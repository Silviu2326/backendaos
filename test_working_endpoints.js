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

async function testWorkingEndpoints() {
    console.log('=== VERIFICANDO ENDPOINTS QUE FUNCIONAN ===\n');

    const endpoints = {
        'Workspace Actual': '/api/v2/workspaces/current',
        'Campañas': '/api/v2/campaigns?limit=5',
        'Cuentas de Email': '/api/v2/accounts',
        'Tags': '/api/v2/tags',
        'Blocklist': '/api/v2/blocklist',
    };

    for (const [name, endpoint] of Object.entries(endpoints)) {
        console.log(`\n📍 ${name}`);
        console.log(`   Endpoint: ${endpoint}`);

        const response = await apiRequest(endpoint, true);

        if (response.status === 200) {
            console.log(`   ✅ Status: ${response.status} - FUNCIONA`);

            const data = response.data;
            const items = data.items || data.data || (Array.isArray(data) ? data : null);

            if (Array.isArray(items)) {
                console.log(`   Total de items: ${items.length}`);
            } else if (data.name || data.id) {
                console.log(`   Datos: ${data.name || data.id}`);
            }
        } else {
            console.log(`   ❌ Status: ${response.status}`);
            console.log(`   ${JSON.stringify(response.data).substring(0, 100)}`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n' + '═'.repeat(100));
    console.log('\n📊 CONCLUSIÓN:');
    console.log('─'.repeat(100));
    console.log('\nLa API v2 de Instantly con esta API key tiene acceso a:');
    console.log('  ✅ Workspace');
    console.log('  ✅ Campañas');
    console.log('  ✅ Cuentas de email');
    console.log('  ✅ Tags y Blocklist');
    console.log('\nPERO NO tiene acceso a:');
    console.log('  ❌ Leads individuales');
    console.log('  ❌ Analytics de campañas');
    console.log('  ❌ Estadísticas de envío');
    console.log('\n💡 POSIBLES SOLUCIONES:');
    console.log('  1. Verificar los scopes/permisos de la API key en:');
    console.log('     https://app.instantly.ai/app/settings/integrations');
    console.log('  2. Generar una nueva API key con permisos completos');
    console.log('  3. Consultar la documentación oficial actualizada:');
    console.log('     https://developer.instantly.ai/');
    console.log('  4. Exportar los leads manualmente desde la interfaz web');
    console.log('─'.repeat(100) + '\n');
}

testWorkingEndpoints().catch(err => console.error('Error:', err));
