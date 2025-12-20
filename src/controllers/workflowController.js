const WorkflowModel = require('../models/WorkflowModel');
const llmService = require('../services/llmService');

const VALID_TYPES = ['precrafter', 'crafter'];

// GET /api/workflows/:type
// Returns the latest version
exports.getWorkflow = async (req, res) => {
    const { type } = req.params;
    console.log(`[Controller] getWorkflow: loading latest ${type}`);

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }

    try {
        const workflow = await WorkflowModel.getLatestWorkflow(type);
        res.json(workflow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/workflows/:type
// Saves a new version
exports.saveWorkflow = async (req, res) => {
    const { type } = req.params;
    const { nodes, edges, label } = req.body;
    console.log(`[Controller] saveWorkflow: saving new version for ${type} (label: ${label})`);

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }

    try {
        const result = await WorkflowModel.saveNewVersion(type, { nodes, edges, label });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/workflows/:type/versions
// Returns list of versions
exports.listVersions = async (req, res) => {
    const { type } = req.params;
    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }
    try {
        const versions = await WorkflowModel.getVersionsList(type);
        res.json(versions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/workflows/:type/versions/:version
// Returns specific version content
exports.getVersion = async (req, res) => {
    const { type, version } = req.params;
    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }
    try {
        const workflow = await WorkflowModel.getWorkflowByVersion(type, parseInt(version));
        if (!workflow) {
            return res.status(404).json({ error: 'Version not found' });
        }
        res.json(workflow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.runNode = async (req, res) => {
    console.log('[Controller] runNode called');
    console.log('[Controller] Request Body keys:', Object.keys(req.body));
    if (req.body.debug) console.log('[Controller] Frontend Debug:', req.body.debug);
    
    const { node, context } = req.body;
    
    if (node) {
        console.log('[Controller] Node received:', {
            id: node.id,
            model: node.model,
            dataModel: node.data?.model,
            type: node.type,
            keys: Object.keys(node)
        });
    } else {
        console.error('[Controller] Node object is MISSING in request body');
    }

    let model = node?.model || node?.data?.model;
    
    // Fallback based on Node Type if model is not explicitly provided
    if (!model) {
        if (node?.type === 'PERPLEXITY') {
            model = 'sonar';
        } else {
            model = 'gemini-3-pro-preview';
        }
        console.log(`[Controller] Model inferred from type '${node?.type}': ${model}`);
    }

    console.log(`[Controller] runNode: executing node ${node?.id} with model ${model}`);

    if (!node) return res.status(400).json({ error: 'Node data required' });

    try {
        const resolvePath = (obj, path) => {
            return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
        };

        // Variable Substitution Helper
        const replaceVariables = (text, ctx) => {
            if (!text) return '';
            return text.replace(/{{([\w\.-]+)}}/g, (match, variable) => {
                const parts = variable.split('.');
                const nodeId = parts[0];
                const property = parts.slice(1).join('.');

                if (ctx && ctx[nodeId]) {
                    // Support both old format (string) and new format ({input, output})
                    let nodeOutput = ctx[nodeId];
                    if (typeof nodeOutput === 'object' && nodeOutput.output !== undefined) {
                        nodeOutput = nodeOutput.output;
                    }

                    if (property) {
                        try {
                            const parsed = JSON.parse(nodeOutput);
                            const val = resolvePath(parsed, property);
                            return val !== undefined ? val : match;
                        } catch (e) {
                            if (property === 'output') return nodeOutput;
                            return match;
                        }
                    }
                    return nodeOutput;
                }
                return match;
            });
        };

        if (node.data?.type === 'JSON') {
            return res.json({ success: true, output: node.data.json || '{}' });
        }

        if (node.data?.type === 'JSON_BUILDER') {
            const template = node.data.json || '{}';
            const output = replaceVariables(template, context);
            return res.json({ success: true, output });
        }

        const systemPrompt = replaceVariables(node.systemPrompt || node.data?.systemPrompt, context);
        const userPrompt = replaceVariables(node.userPrompt || node.data?.userPrompt, context);

        const output = await llmService.generate({
            model: model,
            systemPrompt,
            userPrompt,
            temperature: node.temperature || node.data?.temperature,
            recency: node.data?.recency,
            citations: node.data?.citations,
            schema: node.schema || node.data?.schema
        });

        // Return both input and output for better run tracking
        res.json({
            success: true,
            output,
            input: {
                systemPrompt,
                userPrompt,
                temperature: node.temperature || node.data?.temperature,
                model: model
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- RUNS ---

exports.saveRun = async (req, res) => {
    const { type } = req.params;
    const { status, startTime, endTime, results, version } = req.body;
    
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid workflow type' });

    try {
        const id = await WorkflowModel.saveRun(type, { status, startTime, endTime, results, version });
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listRuns = async (req, res) => {
    const { type } = req.params;
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid workflow type' });

    try {
        const runs = await WorkflowModel.getRunsList(type);
        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRun = async (req, res) => {
    const { id } = req.params;
    try {
        const run = await WorkflowModel.getRunDetails(id);
        if (!run) return res.status(404).json({ error: 'Run not found' });
        res.json(run);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.chat = async (req, res) => {
    const { message, context } = req.body;
    try {
        const systemPrompt = "You are a helpful AI assistant in a workflow automation studio. You have access to context data from executed nodes.";
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
        res.status(500).json({ error: error.message });
    }
};

exports.generateVariations = async (req, res) => {
    const { node, instructions } = req.body;

    if (!node || !instructions || !Array.isArray(instructions)) {
        return res.status(400).json({ error: 'Node and instructions array required' });
    }

    try {
        const variations = await Promise.all(
            instructions.map(async (instruction, index) => {
                // If instruction is empty, provide a robust default to ensure AI generation
                const effectiveInstruction = instruction.trim() 
                    ? instruction 
                    : "Improve the prompt's clarity and effectiveness while maintaining the original intent.";

                const systemPrompt = `You are an expert prompt engineer. Your task is to improve and modify prompts based on specific instructions.

CRITICAL RULE: You must NOT change the output schema or data structure defined in the original prompts. The output format (JSON structure, keys, etc.) must remain EXACTLY the same. Only modify the instructions, reasoning, or content generation logic within the system and user prompts to satisfy the user's request.

You will receive:
1. An original system prompt
2. An original user prompt
3. The Target Output Schema (MUST BE PRESERVED)
4. A specific instruction for modification

Generate improved versions that follow the instruction while STRICTLY maintaining the output schema and core purpose.

Output ONLY a JSON object with this structure:
{
  "systemPrompt": "improved system prompt here",
  "userPrompt": "improved user prompt here"
}

Do NOT include any explanation or text outside the JSON.`;

                const userPrompt = `Original System Prompt:
${node.systemPrompt || 'None'}

Original User Prompt:
${node.userPrompt || 'None'}

Target Output Schema (MUST BE PRESERVED):
${JSON.stringify(node.schema || node.data?.schema || {}, null, 2)}

Instruction for modification: ${effectiveInstruction}

Generate improved prompts following the instruction above. Output ONLY the JSON object.`;

                const output = await llmService.generate({
                    model: 'gemini-3-pro-preview',
                    systemPrompt,
                    userPrompt,
                    temperature: 0.7,
                    schema: {
                        type: 'object',
                        properties: {
                            systemPrompt: { type: 'string' },
                            userPrompt: { type: 'string' }
                        },
                        required: ['systemPrompt', 'userPrompt']
                    }
                });

                let parsed;
                try {
                    parsed = JSON.parse(output);
                } catch (e) {
                    console.error("Failed to parse AI output for variation:", output);
                    // Fallback to original if parsing fails
                    parsed = { systemPrompt: node.systemPrompt, userPrompt: node.userPrompt };
                }

                return {
                    id: `v_ai_${Date.now()}_${index}`,
                    label: `${instruction.substring(0, 20)}${instruction.length > 20 ? '...' : ''}`,
                    systemPrompt: parsed.systemPrompt,
                    userPrompt: parsed.userPrompt,
                    temperature: node.temperature || 0.7,
                    instruction: instruction,
                    schema: node.schema || node.data?.schema // Explicitly preserve the schema
                };
            })
        );

        res.json({ success: true, variations });
    } catch (error) {
        console.error('Error generating variations:', error);
        res.status(500).json({ error: error.message });
    }
};
