const db = require('../config/db');

class CampaignModel {
  /**
   * Get all campaigns
   */
  static async getAllCampaigns() {
    const result = await db.query(
      `SELECT * FROM campaigns ORDER BY created_at DESC`
    );
    return result.rows;
  }

  /**
   * Get campaign by ID
   */
  static async getCampaignById(id) {
    const result = await db.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new campaign
   */
  static async createCampaign({ name, description }) {
    try {
      // Generate shorter ID to fit in VARCHAR(100)
      const timestamp = Date.now().toString(36); // Base36 encoding is shorter
      const random = Math.random().toString(36).substr(2, 5);
      const id = `camp_${timestamp}_${random}`; // ~25 chars total
      
      console.log('[CampaignModel] Creating campaign:', { id, name, description });
      
      const result = await db.query(
        `INSERT INTO campaigns (id, name, description, lead_count, status, created_at, updated_at)
         VALUES ($1, $2, $3, 0, 'active', NOW(), NOW())
         RETURNING *`,
        [id, name, description || '']
      );
      
      console.log('[CampaignModel] Campaign created:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('[CampaignModel] Error creating campaign:', error.message);
      console.error('[CampaignModel] Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Update a campaign
   */
  static async updateCampaign(id, { name, description }) {
    const result = await db.query(
      `UPDATE campaigns SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, description]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(id) {
    await db.query('DELETE FROM campaigns WHERE id = $1', [id]);
    return true;
  }

  /**
   * Update lead count for campaign
   */
  static async updateLeadCount(id, count) {
    const result = await db.query(
      `UPDATE campaigns SET 
        lead_count = $2,
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, count]
    );
    
    return result.rows[0] || null;
  }
}

module.exports = CampaignModel;
