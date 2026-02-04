const CampaignModel = require('../models/CampaignModel');

// GET /api/campaigns
exports.listCampaigns = async (req, res) => {
    try {
        const campaigns = await CampaignModel.getAllCampaigns();
        res.json({ campaigns });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/campaigns/:id
exports.getCampaign = async (req, res) => {
    try {
        const campaign = await CampaignModel.getCampaignById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/campaigns
exports.createCampaign = async (req, res) => {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Campaign name is required' });
    }
    
    try {
        const campaign = await CampaignModel.createCampaign({ 
            name: name.trim(), 
            description: description?.trim() || '' 
        });
        res.status(201).json({ success: true, campaign });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/campaigns/:id
exports.updateCampaign = async (req, res) => {
    const { name, description } = req.body;
    
    try {
        const campaign = await CampaignModel.updateCampaign(req.params.id, { name, description });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json({ success: true, campaign });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/campaigns/:id
exports.deleteCampaign = async (req, res) => {
    try {
        await CampaignModel.deleteCampaign(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
