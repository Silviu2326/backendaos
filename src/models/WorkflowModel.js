const db = require('../config/db');

class WorkflowModel {
    constructor() {
        this._ensureTableExists();
    }

    async _ensureTableExists() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS workflows (
                type TEXT PRIMARY KEY,
                content JSONB NOT NULL
            );
        `;
        try {
            await db.query(createTableQuery);
            console.log('[Model] Ensure workflows table exists');
        } catch (error) {
            console.error('[Model] Error ensuring table exists:', error);
        }
    }

    async getWorkflow(type) {
        try {
            const res = await db.query('SELECT content FROM workflows WHERE type = $1', [type]);
            if (res.rows.length > 0) {
                return res.rows[0].content;
            } else {
                // Return default empty structure if not found
                return { nodes: [], edges: [] };
            }
        } catch (error) {
            console.error(`[Model] Error getting workflow ${type}:`, error);
            throw error;
        }
    }

    async saveWorkflow(type, { nodes, edges }) {
        const content = { nodes, edges };
        const query = `
            INSERT INTO workflows (type, content)
            VALUES ($1, $2)
            ON CONFLICT (type) 
            DO UPDATE SET content = $2
            RETURNING content;
        `;
        try {
            const res = await db.query(query, [type, content]);
            return res.rows[0].content;
        } catch (error) {
            console.error(`[Model] Error saving workflow ${type}:`, error);
            throw error;
        }
    }
}

module.exports = new WorkflowModel();