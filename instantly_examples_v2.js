const https = require('https');

// ⚠️ REEMPLAZA ESTA KEY CON TU API KEY V2
// Genera una desde: https://app.instantly.ai/app/settings/integrations
const API_KEY = 'TU_API_KEY_V2_AQUI';

function apiRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.instantly.ai',
            path: path,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ============================================
// EJEMPLOS DE USO - API V2
// ============================================

async function examples() {
    console.log('=== Instantly API V2 - Ejemplos de Uso ===\n');

    // 1. Obtener información del workspace actual
    console.log('1. Obtener Workspace Info:');
    try {
        const workspace = await apiRequest('/api/v2/workspaces/current', 'GET');
        console.log(workspace.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 2. Listar campaigns
    console.log('\n2. Listar Campaigns:');
    try {
        const campaigns = await apiRequest('/api/v2/campaigns?limit=10', 'GET');
        console.log(campaigns.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 3. Obtener una campaign específica
    console.log('\n3. Obtener Campaign Específica:');
    try {
        const campaign = await apiRequest('/api/v2/campaigns/TU_CAMPAIGN_ID', 'GET');
        console.log(campaign.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 4. Crear un nuevo lead (añadir a campaña)
    console.log('\n4. Añadir Lead a Campaign:');
    try {
        const newLead = await apiRequest('/api/v2/leads', 'POST', {
            campaign_id: 'TU_CAMPAIGN_ID',
            email: 'ejemplo@dominio.com',
            first_name: 'Juan',
            last_name: 'Pérez',
            company_name: 'Empresa Ejemplo',
            variables: {
                // Variables personalizadas para la campaña
                company: 'Empresa Ejemplo',
                industry: 'Technology'
            }
        });
        console.log(newLead.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 5. Listar email accounts
    console.log('\n5. Listar Email Accounts:');
    try {
        const accounts = await apiRequest('/api/v2/accounts?limit=10', 'GET');
        console.log(accounts.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 6. Obtener analytics del workspace
    console.log('\n6. Workspace Analytics:');
    try {
        const analytics = await apiRequest('/api/v2/analytics/workspace', 'GET');
        console.log(analytics.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 7. Listar tags
    console.log('\n7. Listar Tags:');
    try {
        const tags = await apiRequest('/api/v2/tags', 'GET');
        console.log(tags.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 8. Obtener blocklist
    console.log('\n8. Obtener Blocklist:');
    try {
        const blocklist = await apiRequest('/api/v2/blocklist', 'GET');
        console.log(blocklist.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 9. Agregar email a blocklist
    console.log('\n9. Agregar a Blocklist:');
    try {
        const result = await apiRequest('/api/v2/blocklist', 'POST', {
            email: 'spam@ejemplo.com'
        });
        console.log(result.data);
    } catch(e) {
        console.error('Error:', e.message);
    }

    // 10. Obtener unibox accounts
    console.log('\n10. Unibox Accounts:');
    try {
        const unibox = await apiRequest('/api/v2/unibox/accounts', 'GET');
        console.log(unibox.data);
    } catch(e) {
        console.error('Error:', e.message);
    }
}

// Ejecutar ejemplos
// examples();

// ============================================
// FUNCIONES ÚTILES PARA TU APLICACIÓN
// ============================================

// Agregar múltiples leads a una campaign
async function addLeadsInBulk(campaignId, leads) {
    console.log(`Agregando ${leads.length} leads a campaign ${campaignId}...`);
    const results = [];

    for (const lead of leads) {
        try {
            const result = await apiRequest('/api/v2/leads', 'POST', {
                campaign_id: campaignId,
                email: lead.email,
                first_name: lead.first_name,
                last_name: lead.last_name,
                company_name: lead.company_name,
                variables: lead.variables || {}
            });
            results.push({ success: true, email: lead.email, data: result.data });
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch(e) {
            results.push({ success: false, email: lead.email, error: e.message });
        }
    }

    return results;
}

// Obtener estadísticas de todas las campaigns
async function getAllCampaignsStats() {
    try {
        const campaignsResponse = await apiRequest('/api/v2/campaigns?limit=100', 'GET');
        const campaigns = campaignsResponse.data;

        const stats = [];
        for (const campaign of campaigns) {
            const analytics = await apiRequest(`/api/v2/analytics/campaigns/${campaign.id}`, 'GET');
            stats.push({
                campaign_name: campaign.name,
                campaign_id: campaign.id,
                analytics: analytics.data
            });
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
        }

        return stats;
    } catch(e) {
        console.error('Error getting campaign stats:', e.message);
        return [];
    }
}

// Exportar funciones
module.exports = {
    apiRequest,
    addLeadsInBulk,
    getAllCampaignsStats
};

// Descomentar para ejecutar ejemplos:
// examples();
