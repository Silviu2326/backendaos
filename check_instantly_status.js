const db = require('./src/config/db');

async function checkInstantlyStatus() {
    try {
        // Total de leads
        const total = await db.query('SELECT COUNT(*) as count FROM leads');
        console.log('Total de leads en la base de datos:', total.rows[0].count);

        // Leads por estado de Instantly
        const byStatus = await db.query(`
            SELECT
                step_status->>'instantly' as status,
                COUNT(*) as count
            FROM leads
            GROUP BY step_status->>'instantly'
            ORDER BY count DESC
        `);

        console.log('\nLeads por estado de Instantly:');
        console.log('─'.repeat(50));

        let totalInstantly = 0;
        byStatus.rows.forEach(row => {
            const status = row.status || 'null/pending';
            console.log(`  ${status}: ${row.count}`);

            // Contar los que tienen un status de enviados
            if (['sent', 'replied', 'positive_reply', 'converted', 'bounced', 'stock'].includes(row.status)) {
                totalInstantly += parseInt(row.count);
            }
        });

        console.log('─'.repeat(50));
        console.log(`\nTotal con correos enviados/procesados en Instantly: ${totalInstantly}`);

        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('Error al consultar leads:', error);
        process.exit(1);
    }
}

checkInstantlyStatus();
