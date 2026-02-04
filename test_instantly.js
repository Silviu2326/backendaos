const https = require('https');

// ⚠️ IMPORTANTE: Esta API Key es para v1 y NO funcionará con v2
// Genera una nueva API Key v2 desde: https://app.instantly.ai/app/settings/integrations
const API_KEY = 'ZDFmODExMDktYWMxZC00NDcyLWI4MzAtYzFkMjk0YWM0NTNhOlRvc0NsdlpJaEdjSw==';

function makeRequest(url, callback) {
    const urlObj = new URL(url);
    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
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
            console.log(`Status: ${res.statusCode}`);
            try {
                callback(null, JSON.parse(data));
            } catch (e) {
                callback(e, data);
            }
        });
    });

    req.on('error', callback);
    req.end();
}

console.log('=== Conectando a Instantly API V2 ===');
console.log('Documentación: https://developer.instantly.ai/api/v2\n');

console.log('1. Obteniendo workspace actual...');
makeRequest('https://api.instantly.ai/api/v2/workspaces/current', (err, data) => {
    if (err) {
        console.error('Error workspace:', err.message);
    } else {
        console.log('Workspace:', JSON.stringify(data, null, 2));
    }

    console.log('\n2. Obteniendo campañas...');
    makeRequest('https://api.instantly.ai/api/v2/campaigns', (err2, data2) => {
        if (err2) {
            console.error('Error campaigns:', err2.message);
        } else {
            console.log('Campañas:', JSON.stringify(data2, null, 2));
        }

        console.log('\n3. Obteniendo email accounts...');
        makeRequest('https://api.instantly.ai/api/v2/accounts', (err3, data3) => {
            if (err3) {
                console.error('Error accounts:', err3.message);
            } else {
                console.log('Accounts:', JSON.stringify(data3, null, 2));
            }

            console.log('\n4. Obteniendo analytics del workspace...');
            makeRequest('https://api.instantly.ai/api/v2/analytics/workspace', (err4, data4) => {
                if (err4) {
                    console.error('Error analytics:', err4.message);
                } else {
                    console.log('Analytics:', JSON.stringify(data4, null, 2));
                }
            });
        });
    });
});
