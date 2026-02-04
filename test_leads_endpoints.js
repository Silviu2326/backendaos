const https = require('https');

const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';
const CAMPAIGN_ID = 'f515fc54-8ca1-4983-afd7-09b5fcf0dee5';

function apiRequest(path, useBearer = true) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.instantly.ai',
            path: path,
            method: 'GET',
            headers: useBearer ? {
                'Authorization': 'Bearer ' + API_KEY,
                'Content-Type': 'application/json'
            } : {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, raw: true });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function testEndpoints() {
    console.log('=== PROBANDO DIFERENTES ENDPOINTS PARA OBTENER LEADS ===\n');
    console.log(`Campaign ID: ${CAMPAIGN_ID}\n`);
    console.log('─'.repeat(100));

    // Lista de endpoints a probar
    const endpoints = [
        `/api/v2/leads?campaign_id=${CAMPAIGN_ID}&limit=100`,
        `/api/v2/leads/${CAMPAIGN_ID}`,
        `/api/v2/campaigns/${CAMPAIGN_ID}/leads`,
        `/api/v2/campaigns/${CAMPAIGN_ID}/leads?limit=100`,
        `/api/v2/lead?campaign_id=${CAMPAIGN_ID}`,
        `/api/v1/lead/get/campaign/${CAMPAIGN_ID}`,
        `/api/v1/campaign/${CAMPAIGN_ID}/leads`,
        `/api/v2/leads`,
    ];

    for (const endpoint of endpoints) {
        console.log(`\n${endpoints.indexOf(endpoint) + 1}. Probando: ${endpoint}`);

        // Intentar con Bearer
        const response = await apiRequest(endpoint, true);

        console.log(`   Status: ${response.status}`);

        if (response.status === 200) {
            console.log(`   ✅ ÉXITO!`);

            const data = response.data;
            const leads = data.leads || data.items || data.data || (Array.isArray(data) ? data : []);

            console.log(`   Total de leads: ${Array.isArray(leads) ? leads.length : 'N/A'}`);

            if (Array.isArray(leads) && leads.length > 0) {
                console.log(`   Primer lead: ${leads[0].email || 'N/A'}`);
                console.log('\n   Estructura de respuesta:');
                console.log(`   ${JSON.stringify(data).substring(0, 200)}...`);
            } else {
                console.log(`   Respuesta: ${JSON.stringify(data).substring(0, 150)}`);
            }
        } else if (response.status === 404) {
            console.log(`   ❌ 404 - Endpoint no existe`);
        } else if (response.status === 401 || response.status === 403) {
            console.log(`   ❌ ${response.status} - Sin permisos`);
        } else {
            console.log(`   ⚠️  ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n' + '═'.repeat(100));
    console.log('\n✓ Prueba completada\n');
}

testEndpoints().catch(err => console.error('Error:', err));
