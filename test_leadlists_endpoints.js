const https = require('https');

const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';

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

async function testLeadListsEndpoints() {
    console.log('=== PROBANDO ENDPOINTS DE LEAD LISTS ===\n');

    // Endpoints posibles para lead lists
    const endpoints = [
        '/api/v2/lead-lists',
        '/api/v2/lead-lists?limit=100',
        '/api/v2/leadlists',
        '/api/v2/lists',
        '/api/v1/lead/lists',
    ];

    console.log('Probando endpoints para listar lead lists...\n');
    console.log('─'.repeat(100));

    for (const endpoint of endpoints) {
        console.log(`\n${endpoints.indexOf(endpoint) + 1}. ${endpoint}`);

        const response = await apiRequest(endpoint, true);
        console.log(`   Status: ${response.status}`);

        if (response.status === 200) {
            console.log('   ✅ FUNCIONA!');

            const data = response.data;
            console.log('\n   Estructura de respuesta:');
            console.log('   Keys:', Object.keys(data));

            const lists = data.lead_lists || data.lists || data.items || data.data || (Array.isArray(data) ? data : []);

            if (Array.isArray(lists)) {
                console.log(`   Total de lead lists: ${lists.length}`);

                if (lists.length > 0) {
                    console.log('\n   Primeras 5 lead lists:');
                    lists.slice(0, 5).forEach((list, idx) => {
                        console.log(`\n   ${idx + 1}. ${list.name || list.title || 'Sin nombre'}`);
                        console.log(`      ID: ${list.id || 'N/A'}`);
                        console.log(`      Leads count: ${list.leads_count || list.total_leads || list.count || 'N/A'}`);
                        if (list.campaign_id) console.log(`      Campaign ID: ${list.campaign_id}`);
                    });

                    // Guardar el resultado
                    const fs = require('fs');
                    fs.writeFileSync('lead_lists.json', JSON.stringify(data, null, 2));
                    console.log('\n   ✅ Datos guardados en: lead_lists.json');

                    // Si encontramos lead lists, intentemos obtener los leads de la primera
                    if (lists.length > 0 && lists[0].id) {
                        console.log('\n' + '─'.repeat(100));
                        console.log('\n📋 Intentando obtener leads de la primera lead list...\n');

                        const listId = lists[0].id;
                        const leadsEndpoints = [
                            `/api/v2/lead-lists/${listId}`,
                            `/api/v2/lead-lists/${listId}/leads`,
                            `/api/v2/lead-lists/${listId}/leads?limit=100`,
                        ];

                        for (const leadsEndpoint of leadsEndpoints) {
                            console.log(`\nProbando: ${leadsEndpoint}`);
                            const leadsResponse = await apiRequest(leadsEndpoint, true);
                            console.log(`Status: ${leadsResponse.status}`);

                            if (leadsResponse.status === 200) {
                                console.log('✅ FUNCIONA!');
                                const leadsData = leadsResponse.data;
                                const leads = leadsData.leads || leadsData.items || leadsData.data || (Array.isArray(leadsData) ? leadsData : []);

                                if (Array.isArray(leads)) {
                                    console.log(`Total de leads: ${leads.length}`);
                                    if (leads.length > 0) {
                                        console.log('\nPrimer lead:');
                                        console.log(`  Email: ${leads[0].email || 'N/A'}`);
                                        console.log(`  Name: ${leads[0].first_name || ''} ${leads[0].last_name || ''}`);
                                        console.log(`  Company: ${leads[0].company_name || 'N/A'}`);
                                    }
                                } else {
                                    console.log('Detalle de lead list:');
                                    console.log(JSON.stringify(leadsData, null, 2).substring(0, 300));
                                }

                                const fs = require('fs');
                                fs.writeFileSync(`lead_list_${listId}_details.json`, JSON.stringify(leadsResponse.data, null, 2));
                                console.log(`\n✅ Guardado en: lead_list_${listId}_details.json`);
                                break; // Si funciona, no probar más
                            }

                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    }
                }
            } else {
                console.log('   Respuesta completa:');
                console.log(JSON.stringify(data, null, 2).substring(0, 500));
            }

            break; // Si encontramos uno que funciona, no seguir probando
        } else if (response.status === 404) {
            console.log('   ❌ 404 - No existe');
        } else {
            console.log(`   ⚠️  ${response.status}`);
            console.log(`   ${JSON.stringify(response.data).substring(0, 100)}`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n' + '═'.repeat(100));
    console.log('\n✓ Prueba completada\n');
}

testLeadListsEndpoints().catch(err => console.error('Error:', err));
