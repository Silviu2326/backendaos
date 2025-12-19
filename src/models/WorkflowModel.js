const db = require('../config/db');

class WorkflowModel {
    constructor() {
        this._ensureTableExists();
    }

    async _ensureTableExists() {
        const createVersionsTable = `
            CREATE TABLE IF NOT EXISTS workflow_versions (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                version INTEGER NOT NULL,
                content JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                label TEXT,
                UNIQUE(type, version)
            );
        `;
        
        const createRunsTable = `
            CREATE TABLE IF NOT EXISTS workflow_runs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                duration_ms INTEGER,
                results JSONB,
                workflow_version INTEGER
            );
        `;

        try {
            await db.query(createVersionsTable);
            await db.query(createRunsTable);
            console.log('[Model] Ensure tables exist (versions, runs)');
        } catch (error) {
            console.error('[Model] Error ensuring table exists:', error);
        }
    }

    // --- VERSIONING METHODS ---

    async getLatestWorkflow(type) {
        try {
            const query = `
                SELECT content, version, label, created_at 
                FROM workflow_versions 
                WHERE type = $1 
                ORDER BY version DESC 
                LIMIT 1
            `;
            const res = await db.query(query, [type]);
            if (res.rows.length > 0) {
                return { ...res.rows[0].content, _version: res.rows[0].version, _label: res.rows[0].label };
            } else {
                return { nodes: [], edges: [], _version: 0 };
            }
        } catch (error) {
            console.error(`[Model] Error getting latest workflow ${type}:`, error);
            throw error;
        }
    }

    async getWorkflowByVersion(type, version) {
        try {
            const query = `
                SELECT content, version, label, created_at 
                FROM workflow_versions 
                WHERE type = $1 AND version = $2
            `;
            const res = await db.query(query, [type, version]);
            if (res.rows.length > 0) {
                return { ...res.rows[0].content, _version: res.rows[0].version, _label: res.rows[0].label };
            }
            return null;
        } catch (error) {
            console.error(`[Model] Error getting workflow ${type} v${version}:`, error);
            throw error;
        }
    }

    async getVersionsList(type) {
        try {
            const query = `
                SELECT version, label, created_at 
                FROM workflow_versions 
                WHERE type = $1 
                ORDER BY version DESC
            `;
            const res = await db.query(query, [type]);
            return res.rows;
        } catch (error) {
            console.error(`[Model] Error listing versions for ${type}:`, error);
            throw error;
        }
    }

    async saveNewVersion(type, { nodes, edges, label }) {
        const content = { nodes, edges };
        try {
            const maxRes = await db.query('SELECT MAX(version) as v FROM workflow_versions WHERE type = $1', [type]);
            const currentVersion = maxRes.rows[0].v || 0;
            const newVersion = currentVersion + 1;

            const insertQuery = `
                INSERT INTO workflow_versions (type, version, content, label)
                VALUES ($1, $2, $3, $4)
                RETURNING version, created_at;
            `;
            const res = await db.query(insertQuery, [type, newVersion, content, label]);
            return { version: res.rows[0].version, created_at: res.rows[0].created_at, label };
        } catch (error) {
            console.error(`[Model] Error saving new version for ${type}:`, error);
            throw error;
        }
    }

    // --- RUN METHODS ---

    async saveRun(type, { status, startTime, endTime, results, version }) {
        try {
            const duration = endTime && startTime ? (new Date(endTime) - new Date(startTime)) : 0;
            const query = `
                INSERT INTO workflow_runs (type, status, start_time, end_time, duration_ms, results, workflow_version)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            `;
            const res = await db.query(query, [type, status, startTime, endTime, duration, results, version]);
            return res.rows[0].id;
        } catch (error) {
            console.error(`[Model] Error saving run for ${type}:`, error);
            throw error;
        }
    }

    async getRunsList(type) {
        try {
            const query = `
                SELECT id, status, start_time, duration_ms, workflow_version 
                FROM workflow_runs 
                WHERE type = $1 
                ORDER BY start_time DESC
                LIMIT 50
            `;
            const res = await db.query(query, [type]);
            return res.rows;
        } catch (error) {
            console.error(`[Model] Error listing runs for ${type}:`, error);
            throw error;
        }
    }

    async getRunDetails(id) {
        try {
            const query = `SELECT * FROM workflow_runs WHERE id = $1`;
            const res = await db.query(query, [id]);
            return res.rows[0];
        } catch (error) {
            console.error(`[Model] Error getting run details ${id}:`, error);
            throw error;
        }
    }
}

module.exports = new WorkflowModel();