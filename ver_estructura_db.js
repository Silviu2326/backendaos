const db = require('./src/config/db');

async function verEstructura() {
    try {
        console.log('=== ESTRUCTURA DE LA TABLA LEADS ===\n');

        const result = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'leads'
            ORDER BY ordinal_position
        `);

        console.log('Columnas disponibles:\n');
        result.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verEstructura();
