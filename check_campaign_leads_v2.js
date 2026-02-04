const https = require('https');
const fs = require('fs');

const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';

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

async function checkCampaignLeads() {
    console.log('=== ANALIZANDO LEADS EN CAMPAÑAS DE INSTANTLY (V2) ===\n');

    try {
        // Leer el archivo de campañas
        const campaignsData = JSON.parse(fs.readFileSync('./instantly_campaigns.json', 'utf8'));
        const campaigns = campaignsData.items || [];

        console.log(`Total de campañas en el archivo: ${campaigns.length}\n`);
        console.log('─'.repeat(100));

        let totalLeadsAllCampaigns = 0;
        let totalSentAllCampaigns = 0;
        let totalRepliesAllCampaigns = 0;

        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            console.log(`\n${i + 1}. Campaña: "${campaign.name}"`);
            console.log(`   ID: ${campaign.id}`);
            console.log(`   Status: ${campaign.status === 3 ? 'PAUSADA' : campaign.status === 2 ? 'ACTIVA' : campaign.status === 1 ? 'BORRADOR' : 'DESCONOCIDO (' + campaign.status + ')'}`);

            // Intentar obtener los leads directamente
            try {
                // Método 1: Intentar obtener los leads de la campaña
                const leadsPath = `/api/v2/leads?campaign_id=${campaign.id}&limit=1000`;
                console.log(`   Consultando leads...`);
                const leadsResponse = await apiRequest(leadsPath, 'GET');

                if (leadsResponse.status === 200 && leadsResponse.data) {
                    const leads = Array.isArray(leadsResponse.data) ? leadsResponse.data :
                                 (leadsResponse.data.leads || leadsResponse.data.items || []);

                    const totalLeads = leadsResponse.data.total || leads.length;

                    console.log(`   ✓ Leads encontrados: ${totalLeads}`);

                    // Contar estados de los leads
                    let sent = 0, replied = 0, bounced = 0, inSequence = 0, completed = 0;

                    leads.forEach(lead => {
                        const status = lead.status || lead.campaign_status;
                        if (status === 'sent' || status === 'completed' || lead.emails_sent > 0) sent++;
                        if (lead.replied || status === 'replied') replied++;
                        if (status === 'bounced') bounced++;
                        if (status === 'in_sequence') inSequence++;
                        if (status === 'completed') completed++;
                    });

                    console.log(`     • Emails enviados (estimado): ${sent}`);
                    console.log(`     • Respuestas: ${replied}`);
                    console.log(`     • Bounced: ${bounced}`);
                    console.log(`     • En secuencia: ${inSequence}`);
                    console.log(`     • Completados: ${completed}`);

                    totalLeadsAllCampaigns += totalLeads;
                    totalSentAllCampaigns += sent;
                    totalRepliesAllCampaigns += replied;

                    // Mostrar algunos emails de ejemplo (primeros 3)
                    if (leads.length > 0) {
                        console.log(`\n     Primeros emails en esta campaña:`);
                        leads.slice(0, 3).forEach((lead, idx) => {
                            console.log(`       ${idx + 1}. ${lead.email || 'N/A'} - ${lead.first_name || ''} ${lead.last_name || ''}`);
                        });
                    }

                } else if (leadsResponse.status === 404) {
                    console.log(`   ℹ️  Endpoint de leads no disponible para esta campaña`);
                } else {
                    console.log(`   ✗ Error al obtener leads`);
                    console.log(`     Status: ${leadsResponse.status}`);
                    console.log(`     Response: ${JSON.stringify(leadsResponse.data).substring(0, 300)}`);
                }

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.log(`   ✗ Error: ${error.message}`);
            }

            console.log('   ' + '─'.repeat(90));
        }

        console.log('\n' + '═'.repeat(100));
        console.log('\n📊 RESUMEN TOTAL:');
        console.log('═'.repeat(100));
        console.log(`\n   📧 Total de leads: ${totalLeadsAllCampaigns}`);
        console.log(`   📨 Emails enviados (estimado): ${totalSentAllCampaigns}`);
        console.log(`   💬 Respuestas recibidas: ${totalRepliesAllCampaigns}`);
        console.log('\n' + '═'.repeat(100));

        // Si no pudimos obtener datos, intentar un enfoque diferente
        if (totalLeadsAllCampaigns === 0) {
            console.log('\n⚠️  No se pudieron obtener leads usando el endpoint v2/leads');
            console.log('   Intentando obtener el listado completo de leads del workspace...\n');

            const allLeadsResponse = await apiRequest('/api/v2/leads?limit=3000', 'GET');

            if (allLeadsResponse.status === 200 && allLeadsResponse.data) {
                const allLeads = Array.isArray(allLeadsResponse.data) ? allLeadsResponse.data :
                                (allLeadsResponse.data.leads || allLeadsResponse.data.items || []);

                console.log(`   ✓ Total de leads en el workspace: ${allLeads.length}`);

                // Agrupar por campaña
                const leadsByCampaign = {};
                campaigns.forEach(c => leadsByCampaign[c.id] = []);

                allLeads.forEach(lead => {
                    const campId = lead.campaign_id;
                    if (leadsByCampaign[campId]) {
                        leadsByCampaign[campId].push(lead);
                    }
                });

                console.log('\n   Distribución por campaña:');
                for (const campaign of campaigns) {
                    const leadsInCamp = leadsByCampaign[campaign.id] || [];
                    if (leadsInCamp.length > 0) {
                        console.log(`     • ${campaign.name}: ${leadsInCamp.length} leads`);
                    }
                }
            }
        }

        console.log('\n✓ Análisis completado\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

checkCampaignLeads();
