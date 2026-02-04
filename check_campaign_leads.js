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
    console.log('=== ANALIZANDO LEADS EN CAMPAÑAS DE INSTANTLY ===\n');

    try {
        // Leer el archivo de campañas
        const campaignsData = JSON.parse(fs.readFileSync('./instantly_campaigns.json', 'utf8'));
        const campaigns = campaignsData.items || [];

        console.log(`Total de campañas en el archivo: ${campaigns.length}\n`);
        console.log('─'.repeat(100));

        let totalLeadsAllCampaigns = 0;
        let totalSentAllCampaigns = 0;
        let totalRepliesAllCampaigns = 0;
        let totalPositiveRepliesAllCampaigns = 0;

        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            console.log(`\n${i + 1}. Campaña: "${campaign.name}"`);
            console.log(`   ID: ${campaign.id}`);
            console.log(`   Status: ${campaign.status === 3 ? 'PAUSADA' : campaign.status === 2 ? 'ACTIVA' : campaign.status === 1 ? 'BORRADOR' : 'DESCONOCIDO'}`);
            console.log(`   Creada: ${new Date(campaign.timestamp_created).toLocaleDateString('es-ES')}`);

            // Consultar analytics de la campaña
            try {
                const analyticsPath = `/api/v2/analytics/campaigns/${campaign.id}`;
                console.log(`   Consultando analytics...`);
                const analytics = await apiRequest(analyticsPath, 'GET');

                if (analytics.status === 200 && analytics.data) {
                    const stats = analytics.data;

                    console.log(`   ✓ Analytics obtenidas:`);
                    console.log(`     • Total de leads: ${stats.total_leads || 0}`);
                    console.log(`     • Emails enviados: ${stats.total_sent || 0}`);
                    console.log(`     • Respuestas recibidas: ${stats.total_replied || 0}`);
                    console.log(`     • Respuestas positivas: ${stats.positive_replies || 0}`);
                    console.log(`     • Bounced: ${stats.total_bounced || 0}`);
                    console.log(`     • En cola: ${stats.total_in_sequence || 0}`);
                    console.log(`     • Completados: ${stats.total_completed || 0}`);

                    totalLeadsAllCampaigns += stats.total_leads || 0;
                    totalSentAllCampaigns += stats.total_sent || 0;
                    totalRepliesAllCampaigns += stats.total_replied || 0;
                    totalPositiveRepliesAllCampaigns += stats.positive_replies || 0;
                } else {
                    console.log(`   ✗ Error al obtener analytics`);
                    console.log(`     Status: ${analytics.status}`);
                    console.log(`     Response: ${JSON.stringify(analytics.data).substring(0, 200)}`);
                }

                // Esperar un poco para no sobrecargar la API
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.log(`   ✗ Error: ${error.message}`);
            }

            console.log('   ' + '─'.repeat(90));
        }

        console.log('\n' + '═'.repeat(100));
        console.log('\n📊 RESUMEN TOTAL DE TODAS LAS CAMPAÑAS:');
        console.log('═'.repeat(100));
        console.log(`\n   📧 Total de leads en Instantly: ${totalLeadsAllCampaigns}`);
        console.log(`   📨 Total de emails enviados: ${totalSentAllCampaigns}`);
        console.log(`   💬 Total de respuestas: ${totalRepliesAllCampaigns}`);
        console.log(`   ✅ Total de respuestas positivas: ${totalPositiveRepliesAllCampaigns}`);
        console.log('\n' + '═'.repeat(100));

        // Calcular porcentajes si hay datos
        if (totalLeadsAllCampaigns > 0) {
            const percentSent = ((totalSentAllCampaigns / totalLeadsAllCampaigns) * 100).toFixed(2);
            const percentReplied = totalSentAllCampaigns > 0 ? ((totalRepliesAllCampaigns / totalSentAllCampaigns) * 100).toFixed(2) : 0;
            const percentPositive = totalRepliesAllCampaigns > 0 ? ((totalPositiveRepliesAllCampaigns / totalRepliesAllCampaigns) * 100).toFixed(2) : 0;

            console.log('\n📈 MÉTRICAS DE RENDIMIENTO:');
            console.log('─'.repeat(100));
            console.log(`   • Tasa de envío: ${percentSent}% (${totalSentAllCampaigns} de ${totalLeadsAllCampaigns} leads)`);
            console.log(`   • Tasa de respuesta: ${percentReplied}% (${totalRepliesAllCampaigns} de ${totalSentAllCampaigns} enviados)`);
            console.log(`   • Tasa de respuestas positivas: ${percentPositive}% (${totalPositiveRepliesAllCampaigns} de ${totalRepliesAllCampaigns} respuestas)`);
            console.log('─'.repeat(100));
        }

        console.log('\n✓ Análisis completado\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

checkCampaignLeads();
