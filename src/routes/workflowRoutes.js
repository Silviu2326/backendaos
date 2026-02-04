const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// Generic runs endpoint (all types)
router.get('/runs', workflowController.listAllRuns);
router.get('/runs/:id', workflowController.getRun);

// Execution endpoints (Specific paths first)
router.post('/run-node', workflowController.runNode);
router.post('/chat', workflowController.chat);
router.post('/generate-variations', workflowController.generateVariations);

// Versioning endpoints (More specific than /:type)
router.get('/:type/versions', workflowController.listVersions);
router.get('/:type/versions/:version', workflowController.getVersion);
router.patch('/:type/versions/:version', workflowController.updateVersion);

// Run endpoints
router.post('/:type/runs', workflowController.saveRun);
router.get('/:type/runs', workflowController.listRuns);

// Standard get/save (defaults to latest/new version) - Generic /:type last
router.get('/:type', workflowController.getWorkflow);
router.post('/:type', workflowController.saveWorkflow);

module.exports = router;
