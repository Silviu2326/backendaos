const db = require('./src/config/db');

async function verLeadsEnviados() {
    try {
        console.log('=== LEADS CON CORREOS ENVIADOS ===\n');

        // Consulta todos los leads que han sido enviados a Instantly
        const result = await db.query(`
            SELECT
                lead_number,
                first_name,
                last_name,
                email,
                company_name,
                step_status,
                created_at,
                updated_at,
                campaign_id
            FROM leads
            WHERE step_status->>'instantly' IN ('sent', 'replied', 'positive_reply', 'converted', 'bounced', 'stock')
            ORDER BY updated_at DESC
        `);

        const leads = result.rows;

        console.log(`Total de leads con correos enviados: ${leads.length}\n`);
        console.log('─'.repeat(120));

        if (leads.length === 0) {
            console.log('No hay leads con correos enviados todavía.');
            process.exit(0);
        }

        // Mostrar cada lead
        leads.forEach((lead, index) => {
            const stepStatus = typeof lead.step_status === 'string'
                ? JSON.parse(lead.step_status)
                : lead.step_status;

            console.log(`\n${index + 1}. Lead #${lead.lead_number}`);
            console.log(`   Nombre: ${lead.first_name} ${lead.last_name}`);
            console.log(`   Email: ${lead.email}`);
            console.log(`   Empresa: ${lead.company_name || 'N/A'}`);
            console.log(`   Estado: ${stepStatus.instantly}`);
            console.log(`   Última actualización: ${lead.updated_at ? new Date(lead.updated_at).toLocaleString('es-ES') : 'N/A'}`);
            console.log(`   Campaign ID: ${lead.campaign_id || 'N/A'}`);
            console.log('   ' + '─'.repeat(80));
        });

        // Estadísticas
        console.log('\n\n=== ESTADÍSTICAS ===');
        const stats = {
            sent: 0,
            replied: 0,
            positive_reply: 0,
            converted: 0,
            bounced: 0,
            stock: 0
        };

        leads.forEach(lead => {
            const stepStatus = typeof lead.step_status === 'string'
                ? JSON.parse(lead.step_status)
                : lead.step_status;
            const status = stepStatus.instantly;
            if (stats.hasOwnProperty(status)) {
                stats[status]++;
            }
        });

        console.log(`✉️  Enviados: ${stats.sent}`);
        console.log(`💬 Respondieron: ${stats.replied}`);
        console.log(`✅ Respuestas positivas: ${stats.positive_reply}`);
        console.log(`🎯 Convertidos: ${stats.converted}`);
        console.log(`❌ Rebotados: ${stats.bounced}`);
        console.log(`📦 En stock: ${stats.stock}`);
        console.log(`📊 TOTAL: ${leads.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error al consultar leads:', error);
        process.exit(1);
    }
}

verLeadsEnviados();
