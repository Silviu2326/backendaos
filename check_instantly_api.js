const https = require('https');

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

async function checkInstantlyLeads() {
    console.log('=== CONSULTANDO INSTANTLY API ===\n');

    try {
        // 1. Obtener información del workspace
        console.log('1. Información del Workspace:');
        console.log('─'.repeat(80));
        const workspace = await apiRequest('/api/v2/workspaces/current', 'GET');
        if (workspace.status === 200) {
            console.log('✓ Workspace conectado exitosamente');
            console.log(`   Nombre: ${workspace.data.name || 'N/A'}`);
            console.log(`   ID: ${workspace.data.id || 'N/A'}`);
        } else {
            console.log('✗ Error al conectar con workspace');
            console.log('   Status:', workspace.status);
            console.log('   Data:', workspace.data);
        }

        // 2. Obtener todas las campañas
        console.log('\n2. Campañas Activas:');
        console.log('─'.repeat(80));
        const campaigns = await apiRequest('/api/v2/campaigns?limit=100', 'GET');

        if (campaigns.status === 200 && campaigns.data) {
            const campaignList = Array.isArray(campaigns.data) ? campaigns.data :
                                (campaigns.data.campaigns || []);

            console.log(`Total de campañas: ${campaignList.length}\n`);

            let totalLeads = 0;
            let totalSent = 0;
            let totalReplies = 0;
            let totalPositiveReplies = 0;

            if (campaignList.length > 0) {
                console.log('Campañas encontradas:');
                for (let i = 0; i < campaignList.length; i++) {
                    const campaign = campaignList[i];
                    console.log(`\n   ${i + 1}. ${campaign.name || 'Sin nombre'}`);
                    console.log(`      ID: ${campaign.id}`);
                    console.log(`      Status: ${campaign.status || 'N/A'}`);

                    // Obtener analytics de cada campaña
                    try {
                        const analytics = await apiRequest(`/api/v2/analytics/campaigns/${campaign.id}`, 'GET');
                        if (analytics.status === 200 && analytics.data) {
                            const stats = analytics.data;
                            console.log(`      Leads totales: ${stats.total_leads || 0}`);
                            console.log(`      Emails enviados: ${stats.total_sent || 0}`);
                            console.log(`      Respuestas: ${stats.total_replied || 0}`);
                            console.log(`      Respuestas positivas: ${stats.positive_replies || 0}`);

                            totalLeads += stats.total_leads || 0;
                            totalSent += stats.total_sent || 0;
                            totalReplies += stats.total_replied || 0;
                            totalPositiveReplies += stats.positive_replies || 0;
                        }
                        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
                    } catch (e) {
                        console.log(`      Error al obtener analytics: ${e.message}`);
                    }
                }

                console.log('\n' + '═'.repeat(80));
                console.log('\n📊 RESUMEN TOTAL DE INSTANTLY:');
                console.log('─'.repeat(80));
                console.log(`   Total de leads en Instantly: ${totalLeads}`);
                console.log(`   Total de emails enviados: ${totalSent}`);
                console.log(`   Total de respuestas: ${totalReplies}`);
                console.log(`   Total de respuestas positivas: ${totalPositiveReplies}`);
                console.log('─'.repeat(80));
            } else {
                console.log('No se encontraron campañas.');
            }
        } else {
            console.log('✗ Error al obtener campañas');
            console.log('   Status:', campaigns.status);
            console.log('   Data:', JSON.stringify(campaigns.data, null, 2));
        }

        // 3. Obtener analytics del workspace (resumen global)
        console.log('\n3. Analytics Globales del Workspace:');
        console.log('─'.repeat(80));
        const workspaceAnalytics = await apiRequest('/api/v2/analytics/workspace', 'GET');
        if (workspaceAnalytics.status === 200) {
            console.log('Analytics globales:');
            console.log(JSON.stringify(workspaceAnalytics.data, null, 2));
        } else {
            console.log('✗ Error al obtener analytics del workspace');
            console.log('   Status:', workspaceAnalytics.status);
        }

        // 4. Obtener cuentas de email
        console.log('\n4. Cuentas de Email Conectadas:');
        console.log('─'.repeat(80));
        const accounts = await apiRequest('/api/v2/accounts?limit=50', 'GET');
        if (accounts.status === 200 && accounts.data) {
            const accountList = Array.isArray(accounts.data) ? accounts.data :
                               (accounts.data.accounts || []);
            console.log(`Total de cuentas: ${accountList.length}`);
            accountList.forEach((account, i) => {
                console.log(`   ${i + 1}. ${account.email || 'N/A'} - Status: ${account.status || 'N/A'}`);
            });
        } else {
            console.log('✗ Error al obtener cuentas');
        }

    } catch (error) {
        console.error('\n❌ Error en la consulta:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✓ Consulta completada');
}

checkInstantlyLeads();
