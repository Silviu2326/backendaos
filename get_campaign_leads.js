const https = require('https');
const fs = require('fs');

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

async function getCampaignLeads() {
    const campaignId = 'f515fc54-8ca1-4983-afd7-09b5fcf0dee5';

    console.log('=== OBTENIENDO LEADS DE LA CAMPAÑA ===\n');
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Nombre: T10 -E4\n`);
    console.log('─'.repeat(100));

    // Obtener leads de esta campaña
    const endpoint = `/api/v2/leads?campaign_id=${campaignId}&limit=1000`;
    console.log(`\nEndpoint: GET ${endpoint}\n`);

    // Intentar primero con X-API-KEY
    console.log('Intentando con X-API-KEY...');
    let response = await apiRequest(endpoint, false);

    if (response.status === 404 || response.status === 401) {
        console.log('Reintentando con Authorization: Bearer...');
        response = await apiRequest(endpoint, true);
    }

    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
        const data = response.data;

        // La respuesta puede tener diferentes estructuras
        const leads = data.leads || data.items || data.data || (Array.isArray(data) ? data : []);

        console.log(`\n✓ Respuesta exitosa`);
        console.log(`Total de leads encontrados: ${leads.length}\n`);

        if (leads.length > 0) {
            console.log('═'.repeat(100));
            console.log('\n📊 INFORMACIÓN DE LOS LEADS:\n');

            // Estadísticas
            const stats = {
                total: leads.length,
                sent: 0,
                replied: 0,
                bounced: 0,
                opened: 0,
                clicked: 0,
                in_sequence: 0
            };

            // Contar por status
            leads.forEach(lead => {
                const status = lead.status || lead.campaign_status;
                if (status === 'sent' || status === 'completed') stats.sent++;
                if (lead.replied || status === 'replied') stats.replied++;
                if (status === 'bounced') stats.bounced++;
                if (lead.opened) stats.opened++;
                if (lead.clicked) stats.clicked++;
                if (status === 'in_sequence' || status === 'active') stats.in_sequence++;
            });

            console.log('Estadísticas generales:');
            console.log(`  Total de leads: ${stats.total}`);
            console.log(`  Emails enviados: ${stats.sent}`);
            console.log(`  En secuencia: ${stats.in_sequence}`);
            console.log(`  Abiertos: ${stats.opened}`);
            console.log(`  Clicks: ${stats.clicked}`);
            console.log(`  Respuestas: ${stats.replied}`);
            console.log(`  Rebotados: ${stats.bounced}`);

            console.log('\n─'.repeat(100));
            console.log('\n📧 PRIMEROS 20 LEADS:\n');

            leads.slice(0, 20).forEach((lead, idx) => {
                console.log(`${idx + 1}. ${lead.email || 'N/A'}`);
                console.log(`   Nombre: ${lead.first_name || ''} ${lead.last_name || ''}`);
                console.log(`   Empresa: ${lead.company_name || 'N/A'}`);
                console.log(`   Status: ${lead.status || lead.campaign_status || 'N/A'}`);
                if (lead.emails_sent) console.log(`   Emails enviados: ${lead.emails_sent}`);
                if (lead.last_contacted) console.log(`   Último contacto: ${lead.last_contacted}`);
                console.log('');
            });

            // Guardar en JSON
            const report = {
                campaign_id: campaignId,
                campaign_name: 'T10 -E4',
                generated_at: new Date().toISOString(),
                total_leads: leads.length,
                statistics: stats,
                leads: leads
            };

            const filename = `campaign_${campaignId}_leads.json`;
            fs.writeFileSync(filename, JSON.stringify(report, null, 2));
            console.log('─'.repeat(100));
            console.log(`\n✅ Reporte completo guardado en: ${filename}`);
            console.log(`   Total de leads: ${leads.length}`);
            console.log('─'.repeat(100));

            // Ver estructura del primer lead
            if (leads.length > 0) {
                console.log('\n\n📋 ESTRUCTURA DEL PRIMER LEAD:\n');
                console.log('Keys disponibles:', Object.keys(leads[0]).sort());
                console.log('\nPrimer lead completo:');
                console.log(JSON.stringify(leads[0], null, 2));
            }

        } else {
            console.log('❌ No se encontraron leads en esta campaña');
            console.log('\nEstructura de la respuesta:');
            console.log(JSON.stringify(data, null, 2).substring(0, 500));
        }

    } else {
        console.log(`\n✗ Error al obtener leads`);
        console.log('\nRespuesta completa:');
        console.log(JSON.stringify(response.data, null, 2));
    }
}

getCampaignLeads().catch(err => {
    console.error('Error:', err);
});
