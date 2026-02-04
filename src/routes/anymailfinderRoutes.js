const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Get AnymailFinder API key from database
async function getAnymailfinderKey() {
    const result = await pool.query(
        'SELECT api_key FROM api_keys WHERE provider = $1 AND is_enabled = true LIMIT 1',
        ['anymailfinder']
    );
    return result.rows.length > 0 ? result.rows[0].api_key : null;
}

// Search for email using AnymailFinder API
router.post('/search', async (req, res) => {
    try {
        const { domain, firstName, lastName, company, apiKey } = req.body;

        if (!domain && !company) {
            return res.status(400).json({ 
                success: false, 
                error: 'Domain or company is required' 
            });
        }

        // Use provided API key or get from database
        const key = apiKey || await getAnymailfinderKey();
        
        if (!key) {
            return res.status(400).json({ 
                success: false, 
                error: 'AnymailFinder API key not configured' 
            });
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (domain) params.append('domain', domain);
        if (firstName) params.append('first_name', firstName);
        if (lastName) params.append('last_name', lastName);
        if (company) params.append('company', company);

        // AnymailFinder API endpoint
        const response = await fetch(`https://anymailfinder.com/api/v5.0/email-finder?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: data.error || 'AnymailFinder API error'
            });
        }

        res.json({
            success: true,
            output: {
                email: data.email,
                confidence: data.confidence,
                firstName: data.first_name,
                lastName: data.last_name,
                company: data.company,
                domain: data.domain,
                isValid: data.is_valid,
                isCatchAll: data.is_catch_all,
                disposable: data.disposable
            }
        });
    } catch (error) {
        console.error('AnymailFinder error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify email using AnymailFinder API
router.post('/verify', async (req, res) => {
    try {
        const { email, apiKey } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email is required' 
            });
        }

        // Use provided API key or get from database
        const key = apiKey || await getAnymailfinderKey();
        
        if (!key) {
            return res.status(400).json({ 
                success: false, 
                error: 'AnymailFinder API key not configured' 
            });
        }

        const response = await fetch(`https://api.anymailfinder.com/v5.1/verify-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: data.error || 'AnymailFinder API error'
            });
        }

        res.json({
            success: true,
            output: {
                email: data.email,
                isValid: data.is_valid,
                isRisky: data.is_risky,
                isDisposable: data.disposable,
                isCatchAll: data.is_catch_all,
                reason: data.reason
            }
        });
    } catch (error) {
        console.error('AnymailFinder verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
