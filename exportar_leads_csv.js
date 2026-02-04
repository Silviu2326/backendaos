const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function exportarLeadsCSV() {
    try {
        console.log('=== EXPORTAR LEADS A CSV ===\n');

        // Consulta leads enviados
        const result = await db.query(`
            SELECT
                lead_number,
                target_id,
                first_name,
                last_name,
                email,
                company_name,
                person_title,
                phone,
                website,
                step_status,
                instantly_body1,
                instantly_body2,
                instantly_body3,
                instantly_body4,
                campaign_id,
                created_at,
                updated_at
            FROM leads
            WHERE step_status->>'instantly' IN ('sent', 'replied', 'positive_reply', 'converted', 'bounced', 'stock')
            ORDER BY updated_at DESC
        `);

        const leads = result.rows;

        if (leads.length === 0) {
            console.log('No hay leads para exportar.');
            process.exit(0);
        }

        // Crear CSV
        const headers = [
            'Lead Number',
            'Target ID',
            'First Name',
            'Last Name',
            'Email',
            'Company Name',
            'Title',
            'Phone',
            'Website',
            'Instantly Status',
            'Last Updated',
            'Body 1',
            'Body 2',
            'Body 3',
            'Body 4',
            'Campaign ID',
            'Created At'
        ];

        const csvRows = [headers.join(',')];

        leads.forEach(lead => {
            const stepStatus = typeof lead.step_status === 'string'
                ? JSON.parse(lead.step_status)
                : lead.step_status;

            const row = [
                lead.lead_number,
                lead.target_id || '',
                `"${(lead.first_name || '').replace(/"/g, '""')}"`,
                `"${(lead.last_name || '').replace(/"/g, '""')}"`,
                lead.email || '',
                `"${(lead.company_name || '').replace(/"/g, '""')}"`,
                `"${(lead.person_title || '').replace(/"/g, '""')}"`,
                lead.phone || '',
                lead.website || '',
                stepStatus.instantly || '',
                lead.updated_at ? new Date(lead.updated_at).toISOString() : '',
                `"${(lead.instantly_body1 || '').replace(/"/g, '""')}"`,
                `"${(lead.instantly_body2 || '').replace(/"/g, '""')}"`,
                `"${(lead.instantly_body3 || '').replace(/"/g, '""')}"`,
                `"${(lead.instantly_body4 || '').replace(/"/g, '""')}"`,
                lead.campaign_id || '',
                lead.created_at ? new Date(lead.created_at).toISOString() : ''
            ];
            csvRows.push(row.join(','));
        });

        // Crear directorio de exportación si no existe
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Guardar archivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `leads_enviados_${timestamp}_${Date.now()}.csv`;
        const filepath = path.join(exportDir, filename);

        fs.writeFileSync(filepath, csvRows.join('\n'), 'utf-8');

        console.log(`✅ Exportación exitosa!`);
        console.log(`📁 Archivo: ${filepath}`);
        console.log(`📊 Total de leads: ${leads.length}`);

        // Estadísticas
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

        console.log('\n=== ESTADÍSTICAS ===');
        console.log(`✉️  Enviados: ${stats.sent}`);
        console.log(`💬 Respondieron: ${stats.replied}`);
        console.log(`✅ Respuestas positivas: ${stats.positive_reply}`);
        console.log(`🎯 Convertidos: ${stats.converted}`);
        console.log(`❌ Rebotados: ${stats.bounced}`);
        console.log(`📦 En stock: ${stats.stock}`);

        process.exit(0);
    } catch (error) {
        console.error('Error al exportar leads:', error);
        process.exit(1);
    }
}

exportarLeadsCSV();
