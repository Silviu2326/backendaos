const WorkflowModel = require('../models/WorkflowModel');
const llmService = require('../services/llmService');

const VALID_TYPES = ['precrafter', 'crafter'];

exports.getWorkflow = async (req, res) => {
    const { type } = req.params;
    console.log(`[Controller] getWorkflow: loading ${type}`);

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }

    try {
        const workflow = await WorkflowModel.getWorkflow(type);
        res.json(workflow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveWorkflow = async (req, res) => {
    const { type } = req.params;
    const { nodes, edges } = req.body;
    console.log(`[Controller] saveWorkflow: saving ${type} (${nodes?.length} nodes, ${edges?.length} edges)`);

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }

    try {
        const saved = await WorkflowModel.saveWorkflow(type, { nodes, edges });
        res.json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.runNode = async (req, res) => {
    const { node, context } = req.body;
    console.log(`[Controller] runNode: executing node ${node?.id} with model ${node?.data?.model || 'default'}`);

    if (!node) return res.status(400).json({ error: 'Node data required' });

    try {
        const resolvePath = (obj, path) => {
            return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
        };

        // Variable Substitution Helper
        const replaceVariables = (text, ctx) => {
            if (!text) return '';
            return text.replace(/{{([\w\.-]+)}}/g, (match, variable) => {
                // variable format: "nodeId.outputKey" or just "nodeId" (if output is raw text)
                const parts = variable.split('.');
                const nodeId = parts[0];
                const property = parts.slice(1).join('.');

                if (ctx && ctx[nodeId]) {
                    const nodeOutput = ctx[nodeId];
                    
                    // If property specified, try to parse output as JSON and get field
                    if (property) {
                        try {
                            const parsed = JSON.parse(nodeOutput);
                            const val = resolvePath(parsed, property);
                            return val !== undefined ? val : match;
                        } catch (e) {
                            // If output isn't JSON, return raw if property is just "output", else keep match
                            if (property === 'output') return nodeOutput;
                            return match; 
                        }
                    }
                    return nodeOutput;
                }
                return match; // Return original if not found
            });
        };

        // Handle JSON Static Node
        if (node.data?.type === 'JSON') {
            console.log(`[Controller] runNode: executing JSON node ${node.id}`);
            return res.json({ success: true, output: node.data.json || '{}' });
        }

        // Handle JSON Builder Node
        if (node.data?.type === 'JSON_BUILDER') {
            console.log(`[Controller] runNode: executing JSON_BUILDER node ${node.id}`);
            const template = node.data.json || '{}';
            const output = replaceVariables(template, context);
            return res.json({ success: true, output });
        }

        const systemPrompt = replaceVariables(node.systemPrompt || node.data?.systemPrompt, context);
        const userPrompt = replaceVariables(node.userPrompt || node.data?.userPrompt, context);

        console.log(`[Controller] Prompts prepared (System len: ${systemPrompt.length}, User len: ${userPrompt.length})`);

        const output = await llmService.generate({
            model: node.data?.model || 'gemini-3-pro-preview',
            systemPrompt,
            userPrompt,
            temperature: node.temperature || node.data?.temperature,
            recency: node.data?.recency,
            citations: node.data?.citations
        });

        res.json({ success: true, output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.chat = async (req, res) => {
    const { message, context } = req.body;
    console.log(`[Controller] chat: processing message (len: ${message?.length})`);

    try {
        const systemPrompt = "You are a helpful AI assistant in a workflow automation studio. You have access to context data from executed nodes. Answer the user's questions based on the provided context if available.";
        
        // Combine context and message for the user prompt
        // Context is already formatted string from frontend or can be passed as structured data.
        // Frontend sends "--- CONTEXT ---\n...\n\nUser Message" as the message usually, 
        // OR we can explicitly combine if frontend sends them separately. 
        // Let's assume frontend sends the full prompt in 'message' or we combine here.
        // PreCrafterPanel logic sends `fullContent` which includes context.
        // But let's support explicit 'context' field if we want to separate.
        
        let userPrompt = message;
        if (context) {
             userPrompt = `Context Data:\n${JSON.stringify(context, null, 2)}\n\nUser Question: ${message}`;
        }

        const output = await llmService.generate({
            model: 'gemini-3-pro-preview',
            systemPrompt,
            userPrompt,
            temperature: 0.7
        });

        res.json({ success: true, output });
    } catch (error) {
        console.error('[Controller] Chat error:', error);
        res.status(500).json({ error: error.message });
    }
};