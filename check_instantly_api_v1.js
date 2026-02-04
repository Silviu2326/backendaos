const https = require('https');
const fs = require('fs');

const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';

function apiRequest(path, method = 'GET', body = null, isV1 = false) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.instantly.ai',
            path: path,
            method: method,
            headers: isV1 ? {
                'Authorization': API_KEY,  // V1 usa solo la key
                'Content-Type': 'application/json'
            } : {
                'Authorization': 'Bearer ' + API_KEY,  // V2 usa Bearer
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

async function checkInstantly() {
    console.log('=== CONSULTANDO INSTANTLY API (V1 + V2) ===\n');

    try {
        // Leer campañas del archivo
        const campaignsData = JSON.parse(fs.readFileSync('./instantly_campaigns.json', 'utf8'));
        const campaigns = campaignsData.items || [];

        console.log(`Campañas encontradas en el archivo: ${campaigns.length}\n`);

        // Intentar V1: Obtener lista de leads
        console.log('1. Intentando obtener leads del workspace (V1 API)...');
        console.log('─'.repeat(100));

        const v1LeadsResponse = await apiRequest('/api/v1/lead/list', 'GET', null, true);

        if (v1LeadsResponse.status === 200 && v1LeadsResponse.data) {
            const leads = v1LeadsResponse.data;
            console.log(`✓ Total de leads en el workspace: ${Array.isArray(leads) ? leads.length : 'N/A'}`);

            if (Array.isArray(leads) && leads.length > 0) {
                // Agrupar por campaña
                const leadsByCampaign = {};

                leads.forEach(lead => {
                    const campId = lead.campaign_id || lead.campaign;
                    if (!leadsByCampaign[campId]) {
                        leadsByCampaign[campId] = [];
                    }
                    leadsByCampaign[campId].push(lead);
                });

                console.log(`\nCampañas con leads:`);
                console.log('─'.repeat(100));

                let totalSent = 0;
                let totalReplied = 0;

                for (const campaign of campaigns) {
                    const leadsInCamp = leadsByCampaign[campaign.id] || [];
                    if (leadsInCamp.length > 0) {
                        console.log(`\n📧 ${campaign.name}`);
                        console.log(`   ID: ${campaign.id}`);
                        console.log(`   Total leads: ${leadsInCamp.length}`);

                        // Analizar estados
                        const sent = leadsInCamp.filter(l => l.status === 'sent' || l.status === 'completed' || (l.emails_sent && l.emails_sent > 0)).length;
                        const replied = leadsInCamp.filter(l => l.replied || l.status === 'replied').length;
                        const bounced = leadsInCamp.filter(l => l.status === 'bounced').length;

                        console.log(`   Emails enviados: ${sent}`);
                        console.log(`   Respuestas: ${replied}`);
                        console.log(`   Bounced: ${bounced}`);

                        totalSent += sent;
                        totalReplied += replied;

                        // Mostrar algunos ejemplos
                        console.log(`\n   Primeros 5 emails:`);
                        leadsInCamp.slice(0, 5).forEach((lead, idx) => {
                            console.log(`     ${idx + 1}. ${lead.email || 'N/A'} - Status: ${lead.status || 'N/A'}`);
                        });
                    }
                }

                console.log('\n' + '═'.repeat(100));
                console.log('\n📊 RESUMEN TOTAL:');
                console.log('═'.repeat(100));
                console.log(`   Total de leads: ${leads.length}`);
                console.log(`   Emails enviados: ${totalSent}`);
                console.log(`   Respuestas: ${totalReplied}`);
                console.log('═'.repeat(100));

            } else {
                console.log('\nNo se encontraron leads en el workspace.');
            }

        } else {
            console.log(`✗ Error con V1 API`);
            console.log(`  Status: ${v1LeadsResponse.status}`);
            console.log(`  Data:`, JSON.stringify(v1LeadsResponse.data).substring(0, 300));

            // Intentar con V2
            console.log('\n2. Intentando con V2 API...');
            const v2Response = await apiRequest('/api/v2/leads?limit=5000', 'GET');

            if (v2Response.status === 200) {
                console.log('✓ V2 API funcionó');
                console.log('  Data:', JSON.stringify(v2Response.data).substring(0, 500));
            } else {
                console.log(`✗ V2 API también falló`);
                console.log(`  Status: ${v2Response.status}`);
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n✓ Consulta completada\n');
}

checkInstantly();
