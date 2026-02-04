const https = require('https');

const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';

function apiRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.instantly.ai',
            path: path,
            method: 'GET',
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
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function test() {
    console.log('=== VERIFICANDO ESTRUCTURA DE CAMPAÑA ===\n');

    // Obtener todas las campañas
    const campaignsResponse = await apiRequest('/api/v2/campaigns?limit=5');
    const campaigns = campaignsResponse.data?.items ?? [];

    if (campaigns.length === 0) {
        console.log('No se encontraron campañas');
        return;
    }

    // Obtener detalle de la primera campaña
    const firstCampaign = campaigns[0];
    console.log(`Obteniendo detalle de: "${firstCampaign.name}"`);
    console.log(`ID: ${firstCampaign.id}\n`);

    const detailResponse = await apiRequest(`/api/v2/campaigns/${firstCampaign.id}`);

    if (detailResponse.status === 200) {
        console.log('✓ Detalle obtenido exitosamente');
        console.log('\n=== KEYS DISPONIBLES EN EL OBJETO ===');
        console.log(Object.keys(detailResponse.data).sort());

        console.log('\n=== OBJETO COMPLETO (JSON) ===');
        console.log(JSON.stringify(detailResponse.data, null, 2));

        // Buscar cualquier campo que pueda contener stats
        console.log('\n=== CAMPOS POTENCIALES DE ESTADÍSTICAS ===');
        const data = detailResponse.data;
        const statFields = Object.keys(data).filter(k =>
            k.includes('stat') ||
            k.includes('count') ||
            k.includes('lead') ||
            k.includes('email') ||
            k.includes('sent') ||
            k.includes('total') ||
            k.includes('metric') ||
            k.includes('analytic')
        );

        if (statFields.length > 0) {
            console.log('Campos encontrados:');
            statFields.forEach(field => {
                console.log(`  - ${field}: ${JSON.stringify(data[field])}`);
            });
        } else {
            console.log('❌ No se encontraron campos de estadísticas en el objeto de campaña');
        }
    } else {
        console.log(`✗ Error: ${detailResponse.status}`);
        console.log(detailResponse.data);
    }
}

test();
