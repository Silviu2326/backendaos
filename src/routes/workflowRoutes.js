const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

router.post('/run-node', workflowController.runNode);
router.post('/chat', workflowController.chat);
router.get('/:type', workflowController.getWorkflow);
router.post('/:type', workflowController.saveWorkflow);

module.exports = router;