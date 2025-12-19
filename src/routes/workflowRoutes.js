const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// Standard get/save (defaults to latest/new version)
router.get('/:type', workflowController.getWorkflow);
router.post('/:type', workflowController.saveWorkflow);

// Versioning endpoints
router.get('/:type/versions', workflowController.listVersions);
router.get('/:type/versions/:version', workflowController.getVersion);

// Run endpoints
router.post('/:type/runs', workflowController.saveRun);
router.get('/:type/runs', workflowController.listRuns);
router.get('/runs/:id', workflowController.getRun);

// Execution endpoints
router.post('/run-node', workflowController.runNode);
router.post('/chat', workflowController.chat);

module.exports = router;