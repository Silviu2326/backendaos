const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./instantly_campaigns.json', 'utf8'));
const campaigns = data.items || [];

console.log('=== ANÁLISIS DE ESTRUCTURA DEL JSON ===\n');
console.log(`Total de campañas: ${campaigns.length}\n`);

// Analizar las primeras 3 campañas
campaigns.slice(0, 3).forEach((camp, i) => {
    console.log(`\nCampaña ${i + 1}: "${camp.name}"`);
    console.log(`  ID: ${camp.id}`);
    console.log(`  Keys principales:`, Object.keys(camp).filter(k => !['sequences', 'campaign_schedule'].includes(k)));

    if (camp.leads) {
        console.log(`  ✓ Tiene campo 'leads':`, Array.isArray(camp.leads) ? `Array[${camp.leads.length}]` : typeof camp.leads);
    }
    if (camp.lead_count !== undefined) {
        console.log(`  ✓ Lead count: ${camp.lead_count}`);
    }
    if (camp.stats) {
        console.log(`  ✓ Stats:`, camp.stats);
    }
    if (camp.total_leads !== undefined) {
        console.log(`  ✓ Total leads: ${camp.total_leads}`);
    }
});

// Buscar cualquier campo que contenga información de leads
console.log('\n\n=== CAMPOS QUE CONTIENEN "LEAD" O "COUNT" ===\n');
const firstCamp = campaigns[0];
Object.keys(firstCamp).forEach(key => {
    if (key.toLowerCase().includes('lead') || key.toLowerCase().includes('count') || key.toLowerCase().includes('stat')) {
        console.log(`  - ${key}:`, JSON.stringify(firstCamp[key]).substring(0, 100));
    }
});

console.log('\n\n=== TODOS LOS CAMPOS DE LA PRIMERA CAMPAÑA ===\n');
console.log(Object.keys(firstCamp).join(', '));
