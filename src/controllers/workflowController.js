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
                const parts = variable.split('.');
                const nodeId = parts[0];
                const property = parts.slice(1).join('.');

                if (ctx && ctx[nodeId]) {
                    const nodeOutput = ctx[nodeId];
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
