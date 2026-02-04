const db = require('./src/config/db');

async function verTodosLeads() {
    try {
        console.log('=== TODOS LOS LEADS ===\n');

        // Consulta TODOS los leads
        const result = await db.query(`
            SELECT
                lead_number,
                first_name,
                last_name,
                email,
                company_name,
                step_status,
                instantly_sent_at,
                created_at,
                campaign_id
            FROM leads
            ORDER BY lead_number DESC
            LIMIT 1000
        `);

        const leads = result.rows;

        console.log(`Total de leads: ${leads.length}\n`);
        console.log('─'.repeat(120));

        if (leads.length === 0) {
            console.log('No hay leads en la base de datos.');
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
            console.log(`   Campaign: ${lead.campaign_id || 'N/A'}`);
            console.log(`   Estados:`);
            console.log(`     - Verificación: ${stepStatus.verification || 'N/A'}`);
            console.log(`     - CompScrap: ${stepStatus.compScrap || 'N/A'}`);
            console.log(`     - Box1: ${stepStatus.box1 || 'N/A'}`);
            console.log(`     - Instantly: ${stepStatus.instantly || 'N/A'}`);
            if (lead.instantly_sent_at) {
                console.log(`   Enviado: ${new Date(lead.instantly_sent_at).toLocaleString('es-ES')}`);
            }
            console.log(`   Creado: ${new Date(lead.created_at).toLocaleString('es-ES')}`);
            console.log('   ' + '─'.repeat(80));
        });

        // Estadísticas por estado
        console.log('\n\n=== ESTADÍSTICAS POR FASE ===');

        const verificationStats = {
            pending: 0,
            sent: 0,
            verified: 0,
            failed: 0
        };

        const compscrapStats = {
            pending: 0,
            sent: 0,
            scraped: 0,
            failed: 0
        };

        const box1Stats = {
            pending: 0,
            sent: 0,
            fit: 0,
            hit: 0,
            drop: 0,
            no_fit: 0
        };

        const instantlyStats = {
            pending: 0,
            sent: 0,
            stock: 0,
            replied: 0,
            positive_reply: 0,
            converted: 0,
            bounced: 0
        };

        leads.forEach(lead => {
            const stepStatus = typeof lead.step_status === 'string'
                ? JSON.parse(lead.step_status)
                : lead.step_status;

            // Contar estados
            if (stepStatus.verification) verificationStats[stepStatus.verification] = (verificationStats[stepStatus.verification] || 0) + 1;
            if (stepStatus.compScrap) compscrapStats[stepStatus.compScrap] = (compscrapStats[stepStatus.compScrap] || 0) + 1;
            if (stepStatus.box1) box1Stats[stepStatus.box1] = (box1Stats[stepStatus.box1] || 0) + 1;
            if (stepStatus.instantly) instantlyStats[stepStatus.instantly] = (instantlyStats[stepStatus.instantly] || 0) + 1;
        });

        console.log('\n📧 VERIFICACIÓN:');
        Object.entries(verificationStats).forEach(([status, count]) => {
            if (count > 0) console.log(`   ${status}: ${count}`);
        });

        console.log('\n🔍 COMPSCRAP:');
        Object.entries(compscrapStats).forEach(([status, count]) => {
            if (count > 0) console.log(`   ${status}: ${count}`);
        });

        console.log('\n🎯 BOX1 (FIT/HIT):');
        Object.entries(box1Stats).forEach(([status, count]) => {
            if (count > 0) console.log(`   ${status}: ${count}`);
        });

        console.log('\n📨 INSTANTLY (ENVÍO):');
        Object.entries(instantlyStats).forEach(([status, count]) => {
            if (count > 0) console.log(`   ${status}: ${count}`);
        });

        console.log(`\n📊 TOTAL DE LEADS: ${leads.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error al consultar leads:', error);
        process.exit(1);
    }
}

verTodosLeads();
