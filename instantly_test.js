const https = require('https');
const fs = require('fs');

// ⚠️ IMPORTANTE: Esta API Key es para v1 y NO funcionará con v2
// Genera una nueva API Key v2 desde: https://app.instantly.ai/app/settings/integrations
// API v2 requiere una key diferente y no es compatible con v1
const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';

async function apiRequest(path, method = 'GET', body = null, useBearer = false) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.instantly.ai',
            path: path,
            method: method,
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
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, raw: true });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('=== INSTANTLY - REPORTE DE EMAILS ENVIADOS POR CAMPAÑA ===\n');
    console.log('Obteniendo información completa del workspace...\n');

    try {
        // 0. Obtener información del workspace
        const workspaceResponse = await apiRequest('/api/v2/workspaces/current', 'GET', null, true);
        const workspaceName = workspaceResponse.status === 200 ? workspaceResponse.data.name : 'N/A';
        console.log(`Workspace: ${workspaceName}\n`);

        // 1. Obtener lead lists
        console.log('Obteniendo lead lists...');
        const leadListsResponse = await apiRequest('/api/v2/lead-lists?limit=100', 'GET', null, true);
        const leadLists = leadListsResponse.status === 200 ?
            (leadListsResponse.data?.items ?? leadListsResponse.data?.data ?? []) : [];
        console.log(`✓ Total de lead lists: ${leadLists.length}`);

        let totalLeadsInLists = 0;
        if (leadLists.length > 0) {
            console.log('\nLead lists encontradas:');
            leadLists.forEach((list, idx) => {
                const count = list.leads_count || list.total_leads || list.count || 0;
                totalLeadsInLists += count;
                console.log(`  ${idx + 1}. ${list.name || 'Sin nombre'} - ${count} leads`);
            });
        }

        // 2. Obtener cuentas de email
        console.log('\nObteniendo cuentas de email...');
        const accountsResponse = await apiRequest('/api/v2/accounts?limit=100', 'GET', null, true);
        const accounts = accountsResponse.status === 200 ?
            (accountsResponse.data?.items ?? accountsResponse.data?.data ?? []) : [];
        console.log(`✓ Total de cuentas de email: ${accounts.length}\n`);

        // 3. Obtener todas las campañas - Intentar con X-API-KEY primero
        console.log('Intentando obtener campañas con X-API-KEY...');
        let campaignsResponse = await apiRequest('/api/v2/campaigns?limit=100', 'GET');

        // Si falla, intentar con Bearer
        if (campaignsResponse.status !== 200) {
            console.log('Reintentando con Authorization: Bearer...');
            campaignsResponse = await apiRequest('/api/v2/campaigns?limit=100', 'GET', null, true);
        }

        if (campaignsResponse.status !== 200) {
            console.error('❌ Error al obtener campañas:', campaignsResponse.status);
            console.error('Respuesta:', JSON.stringify(campaignsResponse.data, null, 2));
            return;
        }

        // Manejo robusto de la estructura de respuesta
        const campaigns =
            campaignsResponse.data?.items ??
            campaignsResponse.data?.data ??
            (Array.isArray(campaignsResponse.data) ? campaignsResponse.data : []);

        console.log(`✓ Total de campañas encontradas: ${campaigns.length}\n`);
        console.log('─'.repeat(100));

        // 2. Para cada campaña, obtener estadísticas
        const campaignStats = [];
        let totalEmailsSent = 0;
        let totalLeads = 0;
        let totalReplies = 0;

        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            console.log(`\n[${i + 1}/${campaigns.length}] Procesando: "${campaign.name}"`);

            const stats = {
                campaign_id: campaign.id,
                campaign_name: campaign.name,
                campaign_status: campaign.status === 3 ? 'PAUSADA' : campaign.status === 2 ? 'ACTIVA' : campaign.status === 1 ? 'BORRADOR' : 'DESCONOCIDO',
                created_at: campaign.timestamp_created,
                updated_at: campaign.timestamp_updated,
                total_leads: 0,
                emails_sent: 0,
                emails_delivered: 0,
                emails_opened: 0,
                emails_clicked: 0,
                replies: 0,
                positive_replies: 0,
                bounced: 0,
                unsubscribed: 0,
                in_sequence: 0,
                completed: 0
            };

            // Intentar múltiples métodos para obtener estadísticas
            let statsFound = false;

            // Método 1: Obtener campaña individual (puede incluir stats)
            try {
                const campaignDetailResponse = await apiRequest(`/api/v2/campaigns/${campaign.id}`, 'GET');

                if (campaignDetailResponse.status === 200 && campaignDetailResponse.data) {
                    const detail = campaignDetailResponse.data;

                    // Buscar estadísticas en diferentes ubicaciones posibles
                    const analytics = detail.analytics || detail.stats || detail.statistics || detail;

                    if (analytics.total_leads || analytics.emails_sent || analytics.total_sent) {
                        stats.total_leads = analytics.total_leads || analytics.lead_count || 0;
                        stats.emails_sent = analytics.total_sent || analytics.emails_sent || analytics.sent || 0;
                        stats.emails_delivered = analytics.delivered || analytics.emails_delivered || 0;
                        stats.emails_opened = analytics.opened || analytics.emails_opened || 0;
                        stats.emails_clicked = analytics.clicked || analytics.emails_clicked || 0;
                        stats.replies = analytics.total_replied || analytics.replies || analytics.replied || 0;
                        stats.positive_replies = analytics.positive_replies || analytics.positive || 0;
                        stats.bounced = analytics.total_bounced || analytics.bounced || 0;
                        stats.unsubscribed = analytics.unsubscribed || 0;
                        stats.in_sequence = analytics.total_in_sequence || analytics.in_sequence || analytics.active || 0;
                        stats.completed = analytics.total_completed || analytics.completed || 0;

                        console.log(`  ✓ Método: campaign detail`);
                        console.log(`  ✓ Emails enviados: ${stats.emails_sent}`);
                        console.log(`  ✓ Total leads: ${stats.total_leads}`);
                        console.log(`  ✓ Respuestas: ${stats.replies}`);
                        statsFound = true;
                    }
                }
            } catch (error) {
                console.log(`  ⚠️  Método 1 (campaign detail) falló: ${error.message}`);
            }

            // Método 2: Endpoint de analytics específico (si el método 1 no funcionó)
            if (!statsFound) {
                try {
                    const analyticsResponse = await apiRequest(`/api/v2/analytics/campaigns/${campaign.id}`, 'GET');

                    if (analyticsResponse.status === 200 && analyticsResponse.data) {
                        const analytics = analyticsResponse.data;
                        stats.total_leads = analytics.total_leads || 0;
                        stats.emails_sent = analytics.total_sent || analytics.emails_sent || 0;
                        stats.emails_delivered = analytics.delivered || analytics.emails_delivered || 0;
                        stats.emails_opened = analytics.opened || analytics.emails_opened || 0;
                        stats.emails_clicked = analytics.clicked || analytics.emails_clicked || 0;
                        stats.replies = analytics.total_replied || analytics.replies || 0;
                        stats.positive_replies = analytics.positive_replies || 0;
                        stats.bounced = analytics.total_bounced || analytics.bounced || 0;
                        stats.unsubscribed = analytics.unsubscribed || 0;
                        stats.in_sequence = analytics.total_in_sequence || analytics.in_sequence || 0;
                        stats.completed = analytics.total_completed || analytics.completed || 0;

                        console.log(`  ✓ Método: analytics endpoint`);
                        console.log(`  ✓ Emails enviados: ${stats.emails_sent}`);
                        console.log(`  ✓ Total leads: ${stats.total_leads}`);
                        console.log(`  ✓ Respuestas: ${stats.replies}`);
                        statsFound = true;
                    } else if (analyticsResponse.status !== 200) {
                        console.log(`  ℹ️  Analytics endpoint status ${analyticsResponse.status}:`);
                        console.log(`      ${JSON.stringify(analyticsResponse.data).substring(0, 150)}`);
                    }
                } catch (error) {
                    console.log(`  ⚠️  Método 2 (analytics) falló: ${error.message}`);
                }
            }

            // Método 3: Endpoint de stats general
            if (!statsFound) {
                try {
                    const statsResponse = await apiRequest(`/api/v2/stats?campaign_id=${campaign.id}`, 'GET');

                    if (statsResponse.status === 200 && statsResponse.data) {
                        const analytics = statsResponse.data;
                        stats.total_leads = analytics.total_leads || 0;
                        stats.emails_sent = analytics.total_sent || analytics.emails_sent || 0;
                        stats.replies = analytics.total_replied || analytics.replies || 0;

                        console.log(`  ✓ Método: stats endpoint`);
                        console.log(`  ✓ Emails enviados: ${stats.emails_sent}`);
                        statsFound = true;
                    }
                } catch (error) {
                    // Silencioso, es el último intento
                }
            }

            if (!statsFound) {
                console.log(`  ℹ️  No se pudieron obtener estadísticas (campaña vacía o sin permisos)`);
            }

            campaignStats.push(stats);

            totalEmailsSent += stats.emails_sent;
            totalLeads += stats.total_leads;
            totalReplies += stats.replies;

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 3. Crear el resumen
        const report = {
            generated_at: new Date().toISOString(),
            workspace: {
                name: workspaceName,
                total_email_accounts: accounts.length,
                total_lead_lists: leadLists.length,
                total_leads_in_lists: totalLeadsInLists
            },
            summary: {
                total_campaigns: campaigns.length,
                total_leads: totalLeads,
                total_emails_sent: totalEmailsSent,
                total_replies: totalReplies,
                reply_rate: totalEmailsSent > 0 ? ((totalReplies / totalEmailsSent) * 100).toFixed(2) + '%' : '0%'
            },
            lead_lists: leadLists.map(list => ({
                id: list.id,
                name: list.name,
                leads_count: list.leads_count || list.total_leads || list.count || 0,
                created_at: list.created_at || list.timestamp_created
            })),
            email_accounts: accounts.map(acc => ({
                email: acc.email,
                status: acc.status,
                warmup_enabled: acc.warmup_enabled || false
            })),
            campaigns: campaignStats.sort((a, b) => b.emails_sent - a.emails_sent) // Ordenar por emails enviados
        };

        // 4. Guardar en JSON
        const outputFile = 'instantly_email_stats.json';
        fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

        // 5. Mostrar resumen en consola
        console.log('\n' + '═'.repeat(100));
        console.log('\n📊 RESUMEN GENERAL:');
        console.log('═'.repeat(100));
        console.log(`\n  Workspace: ${report.workspace.name}`);
        console.log(`  Cuentas de email conectadas: ${report.workspace.total_email_accounts}`);
        console.log(`  Lead lists creadas: ${report.workspace.total_lead_lists}`);
        console.log(`  Total de leads en lists: ${report.workspace.total_leads_in_lists}`);
        console.log(`\n  Total de campañas: ${report.summary.total_campaigns}`);
        console.log(`  Total de leads en campañas: ${report.summary.total_leads}`);
        console.log(`  Total de emails enviados: ${report.summary.total_emails_sent}`);
        console.log(`  Total de respuestas: ${report.summary.total_replies}`);
        console.log(`  Tasa de respuesta: ${report.summary.reply_rate}`);

        console.log('\n📧 TOP 10 CAMPAÑAS POR EMAILS ENVIADOS:');
        console.log('─'.repeat(100));
        campaignStats.slice(0, 10).forEach((camp, idx) => {
            if (camp.emails_sent > 0) {
                console.log(`\n  ${idx + 1}. ${camp.campaign_name}`);
                console.log(`     Emails enviados: ${camp.emails_sent} | Leads: ${camp.total_leads} | Respuestas: ${camp.replies}`);
            }
        });

        console.log('\n' + '═'.repeat(100));
        console.log(`\n✅ Reporte completo guardado en: ${outputFile}`);
        console.log('═'.repeat(100) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

main();
