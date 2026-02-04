const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Get all API keys
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, provider, key_name, is_enabled, usage_count, usage_limit, created_at, updated_at FROM api_keys ORDER BY provider, id'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get keys by provider
router.get('/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const result = await pool.query(
            'SELECT id, provider, key_name, api_key, is_enabled, usage_count, usage_limit FROM api_keys WHERE provider = $1 ORDER BY id',
            [provider]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single key
router.get('/:provider/:id', async (req, res) => {
    try {
        const { provider, id } = req.params;
        const result = await pool.query(
            'SELECT * FROM api_keys WHERE provider = $1 AND id = $2',
            [provider, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Key not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create or update API key
router.post('/', async (req, res) => {
    try {
        const { provider, key_name, api_key, is_enabled, usage_limit } = req.body;
        
        const result = await pool.query(
            `INSERT INTO api_keys (provider, key_name, api_key, is_enabled, usage_limit)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (provider, key_name)
             DO UPDATE SET api_key = $3, is_enabled = $4, usage_limit = $5, updated_at = NOW()
             RETURNING id, provider, key_name, is_enabled, usage_count, usage_limit`,
            [provider, key_name, api_key, is_enabled !== false, usage_limit || 1000]
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete API key
router.delete('/:provider/:id', async (req, res) => {
    try {
        const { provider, id } = req.params;
        await pool.query(
            'DELETE FROM api_keys WHERE provider = $1 AND id = $2',
            [provider, id]
        );
        res.json({ success: true, message: 'Key deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Toggle key enabled status
router.patch('/:provider/:id/toggle', async (req, res) => {
    try {
        const { provider, id } = req.params;
        const result = await pool.query(
            `UPDATE api_keys SET is_enabled = NOT is_enabled, updated_at = NOW()
             WHERE provider = $1 AND id = $2 RETURNING *`,
            [provider, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Increment usage count
router.post('/:provider/:id/usage', async (req, res) => {
    try {
        const { provider, id } = req.params;
        await pool.query(
            'UPDATE api_keys SET usage_count = usage_count + 1 WHERE provider = $1 AND id = $2',
            [provider, id]
        );
        res.json({ success: true, message: 'Usage incremented' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get next available Gemini key (round-robin)
router.get('/gemini/next', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, api_key, usage_count, usage_limit
             FROM api_keys
             WHERE provider = 'gemini' AND is_enabled = true
             ORDER BY usage_count ASC NULLS LAST
             LIMIT 1`
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No available Gemini keys' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
