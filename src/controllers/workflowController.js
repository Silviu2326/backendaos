const WorkflowModel = require('../models/WorkflowModel');
const llmService = require('../services/llmService');
const fs = require('fs').promises;
const path = require('path');

const VALID_TYPES = ['precrafter', 'crafter'];
const AUDIT_DIR = path.join(__dirname, '../../data/audit_logs');

// Helper: Save Audit Log
const saveAuditLog = async (data) => {
    try {
        await fs.mkdir(AUDIT_DIR, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `audit_${timestamp}_${Math.random().toString(36).substr(2, 5)}.json`;
        const filepath = path.join(AUDIT_DIR, filename);

        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        console.log(`[Audit] Log saved: ${filename}`);
    } catch (error) {
        console.error('[Audit] Failed to save log:', error);
    }
};

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
    const { nodes, edges, label, folder } = req.body;
    console.log(`[Controller] saveWorkflow: saving new version for ${type} (label: ${label}, folder: ${folder})`);

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }

    try {
        const result = await WorkflowModel.saveNewVersion(type, { nodes, edges, label, folder });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/workflows/:type/versions/:version
// Updates a version (label, folder)
exports.updateVersion = async (req, res) => {
    const { type, version } = req.params;
    const { label, folder } = req.body;

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid workflow type' });
    }

    try {
        const result = await WorkflowModel.updateVersion(type, parseInt(version), { label, folder });
        if (!result) {
            return res.status(404).json({ error: 'Version not found' });
        }
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

            // Debug: Log context availability once per call if context exists
            // (Using a simple check to avoid spamming logs for every string)
            if (ctx && Object.keys(ctx).length > 0 && text.includes('{{')) {
                console.log(`[Controller] replaceVariables: Context keys available: [${Object.keys(ctx).join(', ')}]`);
            } else if (text.includes('{{')) {
                console.warn('[Controller] replaceVariables: Context is empty or null, but variables are present in text.');
            }

            // Allow optional spaces inside brackets: {{ variable }}
            return text.replace(/{{ ?([\w\.-]+) ?}}/g, (match, variable) => {
                const parts = variable.trim().split('.');
                const nodeId = parts[0];
                const property = parts.slice(1).join('.');

                console.log(`[Controller] Attempting to resolve variable: '${variable}' (Node: ${nodeId}, Prop: ${property})`);

                if (ctx && ctx[nodeId]) {
                    // Support both old format (string) and new format ({input, output})
                    let nodeOutput = ctx[nodeId];
                    if (typeof nodeOutput === 'object' && nodeOutput.output !== undefined) {
                        nodeOutput = nodeOutput.output;
                    }

                    if (property) {
                        // Special case: If requesting .output, return the raw node output (entire JSON or string)
                        if (property === 'output') {
                            return typeof nodeOutput === 'object' ? JSON.stringify(nodeOutput, null, 2) : String(nodeOutput);
                        }

                        try {
                            // Attempt to parse JSON. 
                            let jsonString = nodeOutput;
                            if (typeof jsonString === 'string') {
                                // 1. Try extracting from markdown code blocks first
                                const jsonBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                                if (jsonBlockMatch) {
                                    jsonString = jsonBlockMatch[1];
                                } else {
                                    // 2. Fallback: Find outermost JSON object if no code blocks are present
                                    // This handles cases like "Here is the data: { ... } **Disclaimer**..."
                                    const firstOpen = jsonString.indexOf('{');
                                    const lastClose = jsonString.lastIndexOf('}');
                                    if (firstOpen !== -1 && lastClose > firstOpen) {
                                        jsonString = jsonString.substring(firstOpen, lastClose + 1);
                                    }
                                }
                            }

                            const parsed = JSON.parse(jsonString);
                            const val = resolvePath(parsed, property);

                            if (val !== undefined) {
                                const replacement = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
                                console.log(`[Controller] Resolved '${variable}' to: ${replacement.substring(0, 50)}${replacement.length > 50 ? '...' : ''}`);
                                return replacement;
                            }
                            console.warn(`[Controller] Variable substitution: Property '${property}' not found in node '${nodeId}' output.`);
                            return match;
                        } catch (e) {
                            console.warn(`[Controller] Variable substitution failed for '${variable}': Output of '${nodeId}' is not valid JSON. Error: ${e.message}`);
                            if (property === 'output') return nodeOutput;
                            return match;
                        }
                    }
                    return nodeOutput;
                }
                console.warn(`[Controller] Variable substitution: Node '${nodeId}' not found in context.`);
                return match;
            });
        };

        console.log(`[Controller] runNode: executing node ${node?.id} with model ${model}, type: ${node?.data?.type || node?.type}`);

        // Check for JSON type in both node.data.type and node.type (flattened)
        if (node.data?.type === 'JSON' || node.type === 'JSON') {
            console.log(`[Controller] Returning static JSON for node ${node.id}`);
            // Support both nested and flattened json content
            const jsonContent = node.data?.json || node.json || '{}';
            return res.json({ success: true, output: jsonContent });
        }

        if (node.data?.type === 'JSON_BUILDER' || node.type === 'JSON_BUILDER') {
            const template = node.data?.json || node.json || '{}';
            const output = replaceVariables(template, context);
            return res.json({ success: true, output });
        }

        // LEAD_INPUT: Fetch leads from database
        if (node.data?.type === 'LEAD_INPUT' || node.type === 'LEAD_INPUT') {
            console.log(`[Controller] LEAD_INPUT: Fetching leads from database`);
            const LeadModel = require('../models/LeadModel');
            const statusFilter = node.data?.statusFilter || 'pending_verification';
            const limit = node.data?.limit || 100;
            
            try {
                const leads = await LeadModel.getLeadsByStatus(statusFilter, limit);
                const leadsArray = Array.isArray(leads) ? leads : [];
                console.log(`[Controller] LEAD_INPUT: Found ${leadsArray.length} leads`);
                return res.json({ 
                    success: true, 
                    output: JSON.stringify({
                        leads: leadsArray,
                        leadCount: leadsArray.length
                    }, null, 2)
                });
            } catch (error) {
                console.error('[Controller] LEAD_INPUT error:', error);
                return res.status(500).json({ error: error.message });
            }
        }

        // BOX1_INPUT: Use leads data passed from context (from /run-box1 endpoint)
        if (node.data?.type === 'BOX1_INPUT' || node.type === 'BOX1_INPUT') {
            console.log(`[Controller] BOX1_INPUT: Processing leads from context`);
            
            try {
                // Get leads from context (passed from /run-box1 endpoint)
                let leads = [];
                if (context && typeof context === 'object') {
                    for (const [nodeId, nodeResult] of Object.entries(context)) {
                        if (nodeResult && typeof nodeResult === 'object' && nodeResult.output) {
                            try {
                                const output = typeof nodeResult.output === 'string' 
                                    ? JSON.parse(nodeResult.output) 
                                    : nodeResult.output;
                                if (output.leads) {
                                    leads = output.leads;
                                    break;
                                } else if (Array.isArray(output)) {
                                    leads = output;
                                    break;
                                } else if (output.data && Array.isArray(output.data)) {
                                    leads = output.data;
                                    break;
                                }
                            } catch (e) {
                                console.warn(`[Controller] BOX1_INPUT: Error parsing context output from ${nodeId}:`, e.message);
                            }
                        }
                    }
                }

                // If no leads found in context, try to get from database using status
                if (leads.length === 0) {
                    console.log(`[Controller] BOX1_INPUT: No leads in context, fetching from database...`);
                    const LeadModel = require('../models/LeadModel');
                    leads = await LeadModel.getBox1Input(100);
                }

                const leadsArray = Array.isArray(leads) ? leads : [];
                console.log(`[Controller] BOX1_INPUT: Found ${leadsArray.length} leads for Box1 processing`);
                return res.json({ 
                    success: true, 
                    output: JSON.stringify({
                        leads: leadsArray,
                        leadCount: leadsArray.length
                    }, null, 2)
                });
            } catch (error) {
                console.error('[Controller] BOX1_INPUT error:', error);
                return res.status(500).json({ error: error.message });
            }
        }

        // BOX1_OUTPUT: Mark leads as developed and move to email stock
        if (node.data?.type === 'BOX1_OUTPUT' || node.type === 'BOX1_OUTPUT') {
            console.log(`[Controller] BOX1_OUTPUT: Marking leads as developed, moving to email stock`);
            const LeadModel = require('../models/LeadModel');
            
            try {
                // Get Box1 results from context
                let box1Results = [];
                if (context && typeof context === 'object') {
                    for (const [nodeId, nodeResult] of Object.entries(context)) {
                        if (nodeResult && typeof nodeResult === 'object' && nodeResult.output) {
                            try {
                                const output = typeof nodeResult.output === 'string' 
                                    ? JSON.parse(nodeResult.output) 
                                    : nodeResult.output;
                                if (output.leads) {
                                    box1Results = output.leads;
                                    break;
                                } else if (output.status) {
                                    // Single lead result
                                    box1Results = [output];
                                    break;
                                }
                            } catch (e) {
                                console.warn(`[Controller] BOX1_OUTPUT: Error parsing context output from ${nodeId}:`, e.message);
                            }
                        }
                    }
                }

                if (!box1Results || box1Results.length === 0) {
                    return res.json({
                        success: true,
                        output: JSON.stringify({
                            updated: 0,
                            message: 'No Box1 results to process'
                        }, null, 2)
                    });
                }

                // Update each lead
                const results = [];
                for (const box1Result of box1Results) {
                    const leadNumber = box1Result.LeadNumber || box1Result.lead_number || box1Result.leadNumber;
                    if (!leadNumber) continue;

                    const status = box1Result.status || 'FIT';
                    const reasoning = box1Result.reasoning || '';
                    const instantly_body = box1Result.instantly_body || {};

                    // Only move to email stock if status is FIT or HIT
                    const shouldMoveToStock = status === 'FIT' || status === 'HIT';
                    const stepStatus = shouldMoveToStock 
                        ? {
                            export: true,
                            verification: 'completed',
                            compScrap: 'completed',
                            box1: 'completed',
                            instantly: 'pending'  // Ready for email outreach
                        }
                        : {
                            export: true,
                            verification: 'completed',
                            compScrap: 'completed',
                            box1: 'completed',  // Box1 processed even if DROP
                            instantly: 'dropped'  // Skip email outreach
                        };

                    const updateData = {
                        step_status: stepStatus,
                        box1_result: {
                            status: status,
                            confidence: box1Result.confidence || 0,
                            reasoning: reasoning,
                            instantly_body: instantly_body,
                            processed_at: new Date().toISOString()
                        },
                        // Mark as developed (ready for next step or dropped)
                        developed: true,
                        developed_at: new Date().toISOString()
                    };

                    // If FIT/HIT, move to email stock (Instantly)
                    if (shouldMoveToStock) {
                        updateData.instantly_status = 'pending';
                    }

                    await LeadModel.update(leadNumber, updateData);
                    results.push({
                        leadNumber,
                        status,
                        movedToStock: shouldMoveToStock
                    });
                }

                const movedToStock = results.filter(r => r.movedToStock).length;
                console.log(`[Controller] BOX1_OUTPUT: Processed ${results.length} leads, ${movedToStock} moved to email stock`);

                return res.json({
                    success: true,
                    output: JSON.stringify({
                        updated: results.length,
                        movedToStock: movedToStock,
                        dropped: results.length - movedToStock,
                        results: results,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                });
            } catch (error) {
                console.error('[Controller] BOX1_OUTPUT error:', error);
                return res.status(500).json({ error: error.message });
            }
        }

        // LEAD_OUTPUT: Save results to leads table
        if (node.data?.type === 'LEAD_OUTPUT' || node.type === 'LEAD_OUTPUT') {
            console.log(`[Controller] LEAD_OUTPUT: Saving results to leads`);
            const LeadModel = require('../models/LeadModel');
            
            try {
                // Get the data to update from context
                const inputData = context || {};
                const updateField = node.data?.updateField;
                const customField = node.data?.customField;
                const markAsSent = node.data?.markAsSent || false;
                
                // Find leads data from previous node
                let leads = [];
                if (inputData && typeof inputData === 'object') {
                    for (const [nodeId, nodeResult] of Object.entries(inputData)) {
                        if (nodeResult && typeof nodeResult === 'object' && nodeResult.output) {
                            try {
                                const output = typeof nodeResult.output === 'string' 
                                    ? JSON.parse(nodeResult.output) 
                                    : nodeResult.output;
                                if (output.leads) {
                                    leads = output.leads;
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }

                // Save results for each lead
                const results = [];
                for (const lead of leads) {
                    const leadNumber = lead.LeadNumber || lead.lead_number;
                    if (!leadNumber) continue;

                    // Prepare update data
                    const updateData = {};
                    if (updateField === 'verification_result' && lead.verification_result) {
                        updateData.verification_result = lead.verification_result;
                    } else if (updateField === 'compscrap_result' && lead.compscrap_result) {
                        updateData.compscrap_result = lead.compscrap_result;
                    } else if (updateField === 'box1_result' && lead.box1_result) {
                        updateData.box1_result = lead.box1_result;
                    } else if (updateField === 'custom' && customField) {
                        updateData[customField] = lead;
                    }

                    // Mark as sent to next step if configured
                    if (markAsSent) {
                        // Check verification result status
                        const verificationStatus = lead.verification_result?.status;
                        
                        if (updateField === 'verification_result') {
                            // Special handling for verification:
                            // - If valid: mark as verified AND ready for compScrap (pending)
                            // - If invalid: mark as failed, stays in verification step
                            // - Otherwise: just mark as sent
                            if (verificationStatus === 'valid') {
                                updateData.step_status = {
                                    export: true,
                                    verification: 'verified',
                                    compScrap: 'pending',  // Ready for next step
                                    box1: 'pending',
                                    instantly: 'pending'
                                };
                            } else if (verificationStatus === 'invalid') {
                                updateData.step_status = {
                                    export: true,
                                    verification: 'failed',
                                    compScrap: 'pending',
                                    box1: 'pending',
                                    instantly: 'pending'
                                };
                            } else {
                                // Default behavior: just mark as sent
                                updateData.step_status = {
                                    export: lead.step_status?.export ?? true,
                                    verification: 'sent',
                                    compScrap: lead.step_status?.compScrap ?? 'pending',
                                    box1: lead.step_status?.box1 ?? 'pending',
                                    instantly: lead.step_status?.instantly ?? 'pending'
                                };
                            }
                        } else {
                            // For other steps (compScrap, box1, instantly)
                            updateData.step_status = {
                                export: lead.step_status?.export ?? true,
                                verification: updateField === 'verification_result' ? 'sent' : (lead.step_status?.verification ?? 'pending'),
                                compScrap: updateField === 'compscrap_result' ? 'sent' : (lead.step_status?.compScrap ?? 'pending'),
                                box1: updateField === 'box1_result' ? 'sent' : (lead.step_status?.box1 ?? 'pending'),
                                instantly: updateField === 'instantly_result' ? 'sent' : (lead.step_status?.instantly ?? 'pending')
                            };
                        }
                    }

                    if (Object.keys(updateData).length > 0) {
                        await LeadModel.update(leadNumber, updateData);
                        results.push(leadNumber);
                    }
                }

                console.log(`[Controller] LEAD_OUTPUT: Saved ${results.length} leads`);
                return res.json({ 
                    success: true, 
                    output: JSON.stringify({
                        updated: results.length,
                        leadNumbers: results,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                });
            } catch (error) {
                console.error('[Controller] LEAD_OUTPUT error:', error);
                return res.status(500).json({ error: error.message });
            }
        }

        // ANYMAILFINDER: Verify emails using AnymailFinder API
        if (node.data?.type === 'ANYMAILFINDER' || node.type === 'ANYMAILFINDER') {
            console.log(`[Controller] ANYMAILFINDER: Verifying emails`);
            const apiKey = node.data?.apiKey || process.env.ANYMAILFINDER_API_KEY;
            
            if (!apiKey) {
                return res.status(400).json({ error: 'AnymailFinder API key is required' });
            }
            
            try {
                // Get leads from context
                let leads = [];
                if (context && typeof context === 'object') {
                    for (const [nodeId, nodeResult] of Object.entries(context)) {
                        if (nodeResult && typeof nodeResult === 'object' && nodeResult.output) {
                            try {
                                const output = typeof nodeResult.output === 'string' 
                                    ? JSON.parse(nodeResult.output) 
                                    : nodeResult.output;
                                if (output.leads) {
                                    leads = output.leads;
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }

                if (!leads || leads.length === 0) {
                    return res.json({
                        success: true,
                        output: JSON.stringify({
                            leads: [],
                            message: 'No leads to verify'
                        }, null, 2)
                    });
                }

                // Verify each email using AnymailFinder API
                const results = [];
                for (const lead of leads) {
                    const email = lead.email;
                    if (!email) continue;

                    try {
                        const response = await fetch('https://anymailfinder.com/api/v5/verify/email', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email })
                        });

                        const data = await response.json();
                        
                        results.push({
                            LeadNumber: lead.LeadNumber || lead.lead_number,
                            email: email,
                            verification_result: {
                                status: data.result?.status || 'unknown',
                                is_valid: data.result?.is_valid || false,
                                is_disposable: data.result?.is_disposable || false,
                                is_role: data.result?.is_role || false,
                                is_catchall: data.result?.is_catchall || false,
                                confidence: data.result?.confidence || 0
                            }
                        });
                    } catch (err) {
                        console.error(`[Controller] Error verifying ${email}:`, err.message);
                        results.push({
                            LeadNumber: lead.LeadNumber || lead.lead_number,
                            email: email,
                            verification_result: {
                                status: 'error',
                                error: err.message
                            }
                        });
                    }
                }

                console.log(`[Controller] ANYMAILFINDER: Verified ${results.length} emails`);
                return res.json({
                    success: true,
                    output: JSON.stringify({
                        leads: results,
                        verifiedCount: results.filter(r => r.verification_result?.status === 'valid').length,
                        invalidCount: results.filter(r => r.verification_result?.status === 'invalid').length
                    }, null, 2)
                });
            } catch (error) {
                console.error('[Controller] ANYMAILFINDER error:', error);
                return res.status(500).json({ error: error.message });
            }
        }

        const systemPrompt = replaceVariables(node.systemPrompt || node.data?.systemPrompt, context);
        const userPrompt = replaceVariables(node.userPrompt || node.data?.userPrompt, context);

        const outputMode = node.outputMode || node.data?.outputMode;
        let schema = node.schema || node.data?.schema;

        if (outputMode === 'free') {
            console.log('[Controller] Output Mode is FREE. Ignoring schema.');
            schema = null;
        }

        const output = await llmService.generate({
            model: model,
            systemPrompt,
            userPrompt,
            temperature: node.temperature || node.data?.temperature,
            recency: node.data?.recency,
            citations: node.data?.citations,
            schema,
            outputMode
        });

        // Audit Logging
        // We run this asynchronously without awaiting to not block the response
        saveAuditLog({
            timestamp: new Date().toISOString(),
            nodeId: node?.id,
            nodeLabel: node?.data?.label || node?.label || 'Unknown Node',
            model: model,
            executionType: 'runNode',
            input: {
                systemPrompt,
                userPrompt,
                temperature: node.temperature || node.data?.temperature
            },
            output: output,
            contextKeys: context ? Object.keys(context) : [],
            // Detect if this is a Bio-Lab operation by checking prompt content
            isEvolution: systemPrompt.includes('Evolutionary Prompt Biologist') || userPrompt.includes('EVOLUTION GOAL')
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

// GET /api/workflows/runs
// Returns all runs from all types
exports.listAllRuns = async (req, res) => {
    try {
        const allRuns = [];
        
        // Get runs from both precrafter and crafter
        for (const type of VALID_TYPES) {
            try {
                const runs = await WorkflowModel.getRunsList(type);
                // Add type to each run
                const typedRuns = runs.map(run => ({
                    ...run,
                    type
                }));
                allRuns.push(...typedRuns);
            } catch (error) {
                console.error(`Error fetching runs for ${type}:`, error.message);
            }
        }

        // Sort by startTime descending (most recent first)
        allRuns.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        res.json({ runs: allRuns });
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
