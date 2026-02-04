const https = require('https');

const apiKey = 'uZmB0CkHPBxEQPdYN2dBRZPE';
const email = 'test@example.com';

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email });
    
    const options = {
      hostname: 'anymailfinder.com',
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, data: data.substring(0, 500) });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Testing AnymailFinder API endpoints...\n');

  const endpoints = [
    '/api/v5.0/email-verifier',
    '/api/v5/email-verifier',
    '/api/v5.0/verify',
    '/api/v5/verify',
    '/api/v5/email/verify'
  ];

  for (const path of endpoints) {
    try {
      const result = await testEndpoint(path);
      console.log(`Endpoint: ${path}`);
      console.log(`Status: ${result.status}`);
      console.log(`Response: ${result.data.substring(0, 200)}...`);
      console.log('---');
    } catch (err) {
      console.log(`Endpoint: ${path} - Error: ${err.message}`);
    }
  }
}

main();
