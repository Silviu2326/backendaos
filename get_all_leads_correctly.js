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

async function getAllLeadsData() {
    console.log('=== OBTENIENDO INFORMACIÓN COMPLETA DE INSTANTLY ===\n');

    try {
        // 1. Obtener todas las campañas directamente de la API
        console.log('1. Obteniendo campañas desde la API...');
        console.log('─'.repeat(100));

        const campaignsResponse = await apiRequest('/api/v2/campaigns?limit=100', 'GET');

        let campaigns = [];
        if (campaignsResponse.status === 200) {
            campaigns = campaignsResponse.data.items || campaignsResponse.data || [];
            console.log(`✓ Campañas obtenidas: ${campaigns.length}\n`);
        } else {
            console.log(`✗ No se pudieron obtener campañas de la API`);
            console.log(`  Usando campañas del archivo JSON local...\n`);
            const localData = JSON.parse(fs.readFileSync('./instantly_campaigns.json', 'utf8'));
            campaigns = localData.items || [];
        }

        // 2. Para cada campaña, intentar diferentes métodos para obtener leads
        let totalLeadsFound = 0;
        const results = [];

        for (let i = 0; i < Math.min(campaigns.length, 10); i++) {
            const campaign = campaigns[i];
            console.log(`\n${i + 1}. "${campaign.name}"`);
            console.log(`   ID: ${campaign.id}`);

            const campResult = {
                name: campaign.name,
                id: campaign.id,
                leads: 0,
                method: 'none'
            };

            // Método 1: Intentar obtener lead-list de la campaña
            if (campaign.lead_list_id || campaign.leadListId) {
                const leadListId = campaign.lead_list_id || campaign.leadListId;
                console.log(`   Intentando lead-list ${leadListId}...`);

                try {
                    const leadListResponse = await apiRequest(`/api/v2/lead-lists/${leadListId}`, 'GET');
                    if (leadListResponse.status === 200 && leadListResponse.data) {
                        const count = leadListResponse.data.total || leadListResponse.data.leads?.length || 0;
                        console.log(`   ✓ Lead-list: ${count} leads`);
                        campResult.leads = count;
                        campResult.method = 'lead-list';
                        totalLeadsFound += count;
                    }
                } catch (e) {
                    console.log(`   ✗ Error con lead-list: ${e.message}`);
                }

                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Método 2: Buscar en la información de la campaña misma
            if (campaign.total_leads || campaign.leadCount || campaign.lead_count) {
                const count = campaign.total_leads || campaign.leadCount || campaign.lead_count;
                console.log(`   ℹ️  Campo total_leads en campaña: ${count}`);
                if (campResult.leads === 0) {
                    campResult.leads = count;
                    campResult.method = 'campaign-field';
                    totalLeadsFound += count;
                }
            }

            results.push(campResult);
            console.log('   ' + '─'.repeat(90));
        }

        // 3. Resumen
        console.log('\n' + '═'.repeat(100));
        console.log('\n📊 RESUMEN POR CAMPAÑA:');
        console.log('═'.repeat(100) + '\n');

        let grandTotal = 0;
        results.forEach((r, idx) => {
            if (r.leads > 0) {
                console.log(`${idx + 1}. ${r.name}`);
                console.log(`   Leads: ${r.leads} (método: ${r.method})`);
                console.log('');
                grandTotal += r.leads;
            }
        });

        console.log('═'.repeat(100));
        console.log(`\n📧 TOTAL DE LEADS ENCONTRADOS: ${grandTotal}`);
        console.log('═'.repeat(100));

        // 4. Información adicional si no encontramos leads
        if (grandTotal === 0) {
            console.log('\n\n⚠️  NO SE ENCONTRARON LEADS EN LAS CAMPAÑAS');
            console.log('\nPosibles razones:');
            console.log('  1. Las campañas están vacías (no se han importado leads)');
            console.log('  2. La API key no tiene permisos para acceder a los leads');
            console.log('  3. Los leads fueron eliminados o están en otra ubicación');
            console.log('\nRecomendaciones:');
            console.log('  • Verifica en la interfaz web de Instantly si hay leads en las campañas');
            console.log('  • Revisa los permisos (scopes) de tu API key en Settings > Integrations');
            console.log('  • Si acabas de crear la API key, intenta esperar unos minutos');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n✓ Análisis completado\n');
}

getAllLeadsData();
