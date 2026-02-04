const db = require('../config/db');
const LeadModel = require('../models/LeadModel');
const CampaignModel = require('../models/CampaignModel');
const multer = require('multer');
const csv = require('csv-parse');
const crypto = require('crypto');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Generate TargetID based on source information
 * Uses a combination of company name and current timestamp for uniqueness
 */
function generateTargetId(leadData) {
  const companyName = leadData.company_name_from_p || leadData.company || 'unknown';
  const sanitizedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `TGT-${sanitizedCompany.slice(0, 8)}-${timestamp}`;
}

/**
 * Import leads from CSV file
 * POST /api/leads/import
 */
const importLeads = async (req, res) => {
  try {
    const { campaignId, mappings, normOptions, dupStrategy } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    // Parse mappings and options
    const columnMappings = mappings ? JSON.parse(mappings) : {};
    const normalizationOptions = normOptions ? JSON.parse(normOptions) : {
      trimWhitespace: true,
      capitalizeNames: true,
      lowercaseEmails: true
    };
    const duplicateStrategy = dupStrategy || 'skip';

    // Parse CSV data
    const csvData = req.file.buffer.toString('utf-8');
    const leads = await parseCSV(csvData);

    // Ensure campaign exists, create if not
    let campaign = await CampaignModel.getCampaignById(campaignId);
    if (!campaign) {
      console.log(`Campaign ${campaignId} not found, creating...`);
      campaign = await CampaignModel.create({
        name: `Campaign ${campaignId}`,
        description: 'Auto-created campaign for import'
      });
      console.log(`Campaign ${campaignId} created successfully:`, campaign.id);
    }

    // Process leads
    const stats = {
      totalRows: leads.length,
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: 0
    };

    // Get next lead number for this campaign
    let nextLeadNumber = await LeadModel.getNextLeadNumber(campaignId);

    for (const leadRow of leads) {
      try {
        // Map CSV columns to lead fields
        const leadData = mapLeadData(leadRow, columnMappings, normalizationOptions);

        if (!leadData.email) {
          stats.errors++;
          continue;
        }

        // Normalize email
        if (normalizationOptions.lowercaseEmails) {
          leadData.email = leadData.email.toLowerCase().trim();
        }

        // Check for existing lead by email
        const existingLead = await LeadModel.findByEmail(leadData.email);

        if (existingLead) {
          if (duplicateStrategy === 'skip') {
            stats.skipped++;
            continue;
          } else if (duplicateStrategy === 'update') {
            await LeadModel.update(existingLead.lead_number, leadData);
            stats.updated++;
          } else if (duplicateStrategy === 'append') {
            // Create new lead with auto-generated lead_number and target_id
            leadData.lead_number = nextLeadNumber;
            leadData.target_id = generateTargetId(leadData);
            leadData.campaign_id = campaignId;
            leadData.step_status = {
              export: true,
              verification: 'pending',
              compScrap: 'pending',
              box1: 'pending',
              instantly: 'pending'
            };
            await LeadModel.create(leadData);
            nextLeadNumber++;
            stats.imported++;
          }
        } else {
          // Create new lead with auto-generated lead_number and target_id
          leadData.lead_number = nextLeadNumber;
          leadData.target_id = generateTargetId(leadData);
          leadData.campaign_id = campaignId;
          leadData.step_status = {
            export: true,
            verification: 'pending',
            compScrap: 'pending',
            box1: 'pending',
            instantly: 'pending'
          };
          await LeadModel.create(leadData);
          nextLeadNumber++;
          stats.imported++;
        }
      } catch (error) {
        console.error('Error processing lead:', error);
        stats.errors++;
      }
    }

    res.json({
      success: true,
      message: `Imported ${stats.imported} leads, skipped ${stats.skipped}, updated ${stats.updated}`,
      stats
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import leads' });
  }
};

/**
 * Parse CSV string to array of objects
 */
async function parseCSV(csvData) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) {
        reject(err);
      } else {
        resolve(records);
      }
    });
  });
}

/**
 * Map CSV row to lead data object
 */
function mapLeadData(row, mappings, options) {
  const leadData = {};
  
  // Field mapping: CSV column -> Lead field (LinkedIn fields included)
  const fieldMap = {
    // Basic fields
    'email': 'email',
    'firstName': 'first_name',
    'lastName': 'last_name',
    'first_name': 'first_name',
    'last_name': 'last_name',
    'company': 'company_name_from_p',
    'companyName': 'company_name_from_p',
    'company_name': 'company_name_from_p',
    'phone': 'phone',
    'title': 'person_title',
    'jobTitle': 'person_title',
    'location': 'person_location',
    'linkedin': 'person_linkedin_url',
    'targetId': 'target_id',
    
    // LinkedIn profile fields (migration 006)
    'profileUrl': 'profile_url',
    'profile_url': 'profile_url',
    'fullName': 'full_name',
    'full_name': 'full_name',
    'name': 'name',
    'companyId': 'company_id',
    'company_id': 'company_id',
    'companyUrl': 'company_url',
    'company_url': 'company_url',
    'regularCompanyUrl': 'regular_company_url',
    'regular_company_url': 'regular_company_url',
    'summary': 'summary',
    'titleDescription': 'title_description',
    'title_description': 'title_description',
    'industry': 'industry',
    'companyLocation': 'company_location',
    'company_location': 'company_location',
    'durationInRole': 'duration_in_role',
    'duration_in_role': 'duration_in_role',
    'durationInCompany': 'duration_in_company',
    'duration_in_company': 'duration_in_company',
    'pastExperienceCompanyName': 'past_experience_company_name',
    'past_experience_company_name': 'past_experience_company_name',
    'pastExperienceCompanyUrl': 'past_experience_company_url',
    'past_experience_company_url': 'past_experience_company_url',
    'pastExperienceCompanyTitle': 'past_experience_company_title',
    'past_experience_company_title': 'past_experience_company_title',
    'pastExperienceDate': 'past_experience_date',
    'past_experience_date': 'past_experience_date',
    'pastExperienceDuration': 'past_experience_duration',
    'past_experience_duration': 'past_experience_duration',
    'connectionDegree': 'connection_degree',
    'connection_degree': 'connection_degree',
    'profileImageUrl': 'profile_image_url',
    'profile_image_url': 'profile_image_url',
    'sharedConnectionsCount': 'shared_connections_count',
    'shared_connections_count': 'shared_connections_count',
    'vmid': 'vmid',
    'linkedinProfileUrl': 'linkedin_profile_url',
    'linkedin_profile_url': 'linkedin_profile_url',
    'isPremium': 'is_premium',
    'is_premium': 'is_premium',
    'isOpenLink': 'is_open_link',
    'is_open_link': 'is_open_link',
    'query': 'query',
    'timestamp': 'timestamp',
    'defaultProfileUrl': 'default_profile_url',
    'default_profile_url': 'default_profile_url',
    'searchAccountProfileId': 'search_account_profile_id',
    'search_account_profile_id': 'search_account_profile_id',
    'searchAccountProfileName': 'search_account_profile_name',
    'search_account_profile_name': 'search_account_profile_name'
  };

  for (const [csvColumn, leadField] of Object.entries(fieldMap)) {
    const mappedColumn = mappings[csvColumn] || csvColumn;
    if (row[mappedColumn]) {
      leadData[leadField] = row[mappedColumn];
    }
  }

  // Apply normalization
  if (options.trimWhitespace) {
    if (leadData.first_name) leadData.first_name = leadData.first_name.trim();
    if (leadData.last_name) leadData.last_name = leadData.last_name.trim();
    if (leadData.company_name_from_p) leadData.company_name_from_p = leadData.company_name_from_p.trim();
  }

  if (options.capitalizeNames) {
    if (leadData.first_name) {
      leadData.first_name = leadData.first_name.charAt(0).toUpperCase() + leadData.first_name.slice(1).toLowerCase();
    }
    if (leadData.last_name) {
      leadData.last_name = leadData.last_name.charAt(0).toUpperCase() + leadData.last_name.slice(1).toLowerCase();
    }
  }

  return leadData;
}

/**
 * Generate unique lead number
 */
function generateLeadNumber() {
  return `LD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * Get all leads (optionally filtered by campaign)
 * GET /api/leads
 */
const getAllLeads = async (req, res) => {
  try {
    const { campaignId, limit = 100, offset = 0 } = req.query;
    
    let leads;
    let total;
    
    if (campaignId) {
      leads = await LeadModel.getByCampaign(campaignId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      total = await LeadModel.countByCampaign(campaignId);
    } else {
      // Get all leads with filters
      const filters = {};
      if (req.query.verificationStatus) filters.verificationStatus = req.query.verificationStatus;
      if (req.query.compScrapStatus) filters.compScrapStatus = req.query.compScrapStatus;
      if (req.query.box1Status) filters.box1Status = req.query.box1Status;
      if (req.query.instantlyStatus) filters.instantlyStatus = req.query.instantlyStatus;
      
      leads = await LeadModel.getAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        filters
      });
      
      const countResult = await db.query('SELECT COUNT(*) as count FROM leads');
      total = parseInt(countResult.rows[0].count);
    }

    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

/**
 * Get lead metrics/stats
 * GET /api/leads/metrics
 */
const getMetrics = async (req, res) => {
  try {
    const { campaignId } = req.query;
    const metrics = await LeadModel.getMetrics(campaignId || null);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

/**
 * Get leads by campaign
 * GET /api/leads/campaign/:campaignId
 */
const getLeadsByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const leads = await LeadModel.getByCampaign(campaignId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const count = await LeadModel.countByCampaign(campaignId);

    res.json({
      leads,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

/**
 * Get a single lead by lead_number
 * GET /api/leads/:leadNumber
 */
const getLead = async (req, res) => {
  try {
    const { leadNumber } = req.params;
    const lead = await LeadModel.findByLeadNumber(leadNumber);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

/**
 * Update a lead
 * PUT /api/leads/:leadNumber
 */
const updateLead = async (req, res) => {
  try {
    const { leadNumber } = req.params;
    const leadData = req.body;

    const existingLead = await LeadModel.findByLeadNumber(leadNumber);
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updatedLead = await LeadModel.update(leadNumber, leadData);
    res.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

/**
 * Send leads to verification step
 * POST /api/leads/send-to-verification
 */
const sendToVerification = async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const updatedLeads = await LeadModel.sendToVerification(leadNumbers);
    
    res.json({
      success: true,
      message: `${updatedLeads.length} leads sent to verification`,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error sending to verification:', error);
    res.status(500).json({ error: 'Failed to send leads to verification' });
  }
};

/**
 * Send leads to compScrap step
 * POST /api/leads/send-to-compscrape
 */
const sendToCompScrap = async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const updatedLeads = await LeadModel.sendToCompScrap(leadNumbers);
    
    res.json({
      success: true,
      message: `${updatedLeads.length} leads sent to company scrap`,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error sending to compScrap:', error);
    res.status(500).json({ error: 'Failed to send leads to compScrap' });
  }
};

/**
 * Send leads to box1 step
 * POST /api/leads/send-to-box1
 */
const sendToBox1 = async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const updatedLeads = await LeadModel.sendToBox1(leadNumbers);
    
    res.json({
      success: true,
      message: `${updatedLeads.length} leads sent to box1`,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error sending to box1:', error);
    res.status(500).json({ error: 'Failed to send leads to box1' });
  }
};

/**
 * Send leads to instantly step
 * POST /api/leads/send-to-instantly
 */
const sendToInstantly = async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const updatedLeads = await LeadModel.sendToInstantly(leadNumbers);
    
    res.json({
      success: true,
      message: `${updatedLeads.length} leads sent to instantly`,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error sending to instantly:', error);
    res.status(500).json({ error: 'Failed to send leads to instantly' });
  }
};

/**
 * Send leads to instantly stock (save for later)
 * POST /api/leads/send-to-instantly-stock
 */
const sendToInstantlyStock = async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const updatedLeads = await LeadModel.sendToInstantlyStock(leadNumbers);
    
    res.json({
      success: true,
      message: `${updatedLeads.length} leads moved to instantly stock`,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error sending to instantly stock:', error);
    res.status(500).json({ error: 'Failed to send leads to instantly stock' });
  }
};

/**
 * Send leads from instantly stock to instantly (send now)
 * POST /api/leads/send-from-stock-to-instantly
 */
const sendFromStockToInstantly = async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const updatedLeads = await LeadModel.sendFromStockToInstantly(leadNumbers);
    
    res.json({
      success: true,
      message: `${updatedLeads.length} leads sent from stock to instantly`,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error sending from stock to instantly:', error);
    res.status(500).json({ error: 'Failed to send leads from stock to instantly' });
  }
};

/**
 * Get input for instantly stock step
 * GET /api/leads/input/instantly-stock
 */
const getInstantlyStockInput = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const leads = await LeadModel.getInstantlyStockInput(limit);
    
    res.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error getting instantly stock input:', error);
    res.status(500).json({ error: 'Failed to get instantly stock input' });
  }
};

/**
 * Import verification output
 * POST /api/leads/import-verification
 */
const importVerificationOutput = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await parseCSV(csvData);
    
    const results = [];
    
    for (const record of records) {
      const leadNumber = record.LeadNumber || record.lead_number;
      if (!leadNumber) continue;

      const lead = await LeadModel.findByLeadNumber(leadNumber);
      if (!lead) continue;

      await LeadModel.updateStepStatus(leadNumber, 'verification', 'verified', {
        email: record.email,
        email_validation: record.email_validation,
        validation_success: record.validation_success,
        first_name_cleaned: record.firstName_cleaned || record.first_name_cleaned,
        last_name_cleaned: record.lastName_cleaned || record.last_name_cleaned,
        comp_url: record.compUrl || record.comp_url
      });
      
      results.push(leadNumber);
    }
    
    res.json({
      success: true,
      message: `${results.length} verification results imported`,
      count: results.length
    });
  } catch (error) {
    console.error('Error importing verification output:', error);
    res.status(500).json({ error: 'Failed to import verification output' });
  }
};

/**
 * Import compScrap output
 * POST /api/leads/import-compscrape
 */
const importCompScrapOutput = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await parseCSV(csvData);
    
    const results = [];
    
    for (const record of records) {
      const leadNumber = record.LeadNumber || record.lead_number;
      if (!leadNumber) continue;

      const lead = await LeadModel.findByLeadNumber(leadNumber);
      if (!lead) continue;

      await LeadModel.updateStepStatus(leadNumber, 'compScrap', 'scraped', {
        company_name: record.companyName || record.company_name,
        company_description: record.companyDescription || record.company_description,
        industry: record.industry,
        employee_count: record.employeeCount || record.employee_count,
        company_location: record.companyLocation || record.company_location,
        website: record.website,
        year_founded: record.yearFounded || record.year_founded,
        specialties: record.specialties,
        phone: record.phone,
        min_revenue: record.minRevenue || record.min_revenue,
        max_revenue: record.maxRevenue || record.max_revenue,
        growth_6mth: record.growth6Mth || record.growth_6mth,
        growth_1yr: record.growth1Yr || record.growth_1yr,
        growth_2yr: record.growth2Yr || record.growth_2yr,
        linkedin_company_url: record.linkedInCompanyUrl || record.linkedin_company_url,
        sales_navigator_company_url: record.salesNavigatorCompanyUrl || record.sales_navigator_company_url,
        company_timestamp_sn: record.companyTimestampSN || record.company_timestamp_sn,
        company_timestamp_ln: record.companyTimestampLN || record.company_timestamp_ln
      });
      
      results.push(leadNumber);
    }
    
    res.json({
      success: true,
      message: `${results.length} compScrap results imported`,
      count: results.length
    });
  } catch (error) {
    console.error('Error importing compScrap output:', error);
    res.status(500).json({ error: 'Failed to import compScrap output' });
  }
};

/**
 * Import box1 output
 * POST /api/leads/import-box1
 */
const importBox1Output = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await parseCSV(csvData);
    
    const results = [];
    
    for (const record of records) {
      const leadNumber = record.LeadNumber || record.lead_number;
      if (!leadNumber) continue;

      const lead = await LeadModel.findByLeadNumber(leadNumber);
      if (!lead) continue;

      const status = record.status || record.Box1Status || 'fit';
      const box1Outputs = [{
        promptVersion: record.promptVersion || record.prompt_version || 'v1',
        userPrompt: record.userPrompt || record.user_prompt || '',
        output: record.output || record.Output || '',
        status: status.toLowerCase()
      }];

      // Update lead status
      await LeadModel.updateStepStatus(leadNumber, 'box1', status.toLowerCase(), {
        box1_outputs: box1Outputs,
        instantly_body1: record.body1 || record.instantly_body1,
        instantly_body2: record.body2 || record.instantly_body2,
        instantly_body3: record.body3 || record.instantly_body3,
        instantly_body4: record.body4 || record.instantly_body4
      });

      // Mark as storage if FIT but not HIT
      if (status.toLowerCase() === 'fit') {
        await LeadModel.markAsStorage([leadNumber]);
      }
      
      results.push(leadNumber);
    }
    
    res.json({
      success: true,
      message: `${results.length} box1 results imported`,
      count: results.length
    });
  } catch (error) {
    console.error('Error importing box1 output:', error);
    res.status(500).json({ error: 'Failed to import box1 output' });
  }
};

/**
 * Get input for verification step
 * GET /api/leads/input/verification
 */
const getVerificationInput = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const leads = await LeadModel.getVerificationInput(limit);
    
    res.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error getting verification input:', error);
    res.status(500).json({ error: 'Failed to get verification input' });
  }
};

/**
 * Get input for compScrap step
 * GET /api/leads/input/compscrape
 */
const getCompScrapInput = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const leads = await LeadModel.getCompScrapInput(limit);
    
    res.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error getting compScrap input:', error);
    res.status(500).json({ error: 'Failed to get compScrap input' });
  }
};

/**
 * Get input for box1 step
 * GET /api/leads/input/box1
 */
const getBox1Input = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const leads = await LeadModel.getBox1Input(limit);
    
    res.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error getting box1 input:', error);
    res.status(500).json({ error: 'Failed to get box1 input' });
  }
};

/**
 * Get input for instantly step
 * GET /api/leads/input/instantly
 */
const getInstantlyInput = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const leads = await LeadModel.getInstantlyInput(limit);
    
    res.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error getting instantly input:', error);
    res.status(500).json({ error: 'Failed to get instantly input' });
  }
};

/**
 * Export leads as CSV
 * GET /api/leads/export
 */
/**
 * Import compScrap output with custom column mappings
 * POST /api/leads/import-compscrap-custom
 */
const importCompScrapCustom = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mappings } = req.body;
    const columnMappings = mappings ? JSON.parse(mappings) : {};

    const csvData = req.file.buffer.toString('utf-8');
    const records = await parseCSV(csvData);
    
    const results = {
      processed: 0,
      notFound: 0,
      errors: 0
    };
    
    for (const record of records) {
      try {
        // Find lead by lead number (from mapped column or default)
        const leadNumberCol = Object.keys(columnMappings).find(
          key => columnMappings[key] === 'leadNumber'
        ) || 'LeadNumber';
        
        const leadNumber = record[leadNumberCol] || record.LeadNumber || record.lead_number;
        
        if (!leadNumber) {
          results.errors++;
          continue;
        }

        const lead = await LeadModel.findByLeadNumber(leadNumber.toString());
        if (!lead) {
          results.notFound++;
          continue;
        }

        // Transform record using mappings
        const compscrapData = {};
        
        for (const [csvColumn, fieldName] of Object.entries(columnMappings)) {
          if (fieldName && record[csvColumn] !== undefined) {
            compscrapData[fieldName] = record[csvColumn];
          }
        }

        // Update lead with compScrap data
        await LeadModel.updateCompscrapCustom(leadNumber.toString(), compscrapData);
        
        // If there's no error, mark as scraped
        if (!compscrapData.error) {
          await LeadModel.updateStepStatus(leadNumber.toString(), 'compScrap', 'scraped', {});
        }
        
        results.processed++;
      } catch (error) {
        console.error('Error processing compScrap record:', error);
        results.errors++;
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.processed} records, ${results.notFound} not found, ${results.errors} errors`,
      results
    });
  } catch (error) {
    console.error('Error importing compScrap output:', error);
    res.status(500).json({ error: 'Failed to import compScrap output' });
  }
};

/**
 * Import compScrap/Box1 output with field mappings (used by CompScrapImportModal)
 * POST /api/leads/import-compscrape-mapped
 */
const importCompscrapeMapped = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mappings } = req.body;
    const columnMappings = mappings ? JSON.parse(mappings) : {};

    const csvData = req.file.buffer.toString('utf-8');
    const records = await parseCSV(csvData);
    
    const results = {
      processed: 0,
      notFound: 0,
      errors: 0
    };
    
    for (const record of records) {
      try {
        // Find lead by lead number (mapped column or default)
        const leadNumberCol = Object.keys(columnMappings).find(
          key => columnMappings[key] === 'leadNumber'
        ) || 'leadNumber';
        
        const leadNumber = record[leadNumberCol] || record.LeadNumber || record.lead_number || record.Lead_Number;
        
        if (!leadNumber) {
          results.errors++;
          continue;
        }

        const lead = await LeadModel.findByLeadNumber(leadNumber.toString());
        if (!lead) {
          results.notFound++;
          continue;
        }

        // Transform record using mappings (map frontend field names to DB column names)
        const compscrapData = {};
        
        for (const [csvColumn, fieldName] of Object.entries(columnMappings)) {
          if (fieldName && record[csvColumn] !== undefined && fieldName !== 'leadNumber') {
            compscrapData[fieldName] = record[csvColumn];
          }
        }

        // Update lead with compScrap data using updateCompscrapCustom
        await LeadModel.updateCompscrapCustom(leadNumber.toString(), compscrapData);
        
        // If there's no error, mark as scraped
        if (!compscrapData.compscrap_error) {
          await LeadModel.updateStepStatus(leadNumber.toString(), 'compScrap', 'scraped', {});
        }
        
        results.processed++;
      } catch (error) {
        console.error('Error processing compScrap record:', error);
        results.errors++;
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.processed} records, ${results.notFound} not found, ${results.errors} errors`,
      results
    });
  } catch (error) {
    console.error('Error importing compScrap output:', error);
    res.status(500).json({ error: 'Failed to import compScrap output' });
  }
};

const exportLeads = async (req, res) => {
  try {
    const { step, campaignId, format = 'csv' } = req.query;
    
    let leads;
    
    switch (step) {
      case 'verification':
        leads = await LeadModel.getVerificationInput(10000);
        break;
      case 'compscrape':
        leads = await LeadModel.getCompScrapInput(10000);
        break;
      case 'box1':
        leads = await LeadModel.getBox1Input(10000);
        break;
      case 'instantly':
        leads = await LeadModel.getInstantlyInput(10000);
        break;
      default:
        leads = await LeadModel.getAll({ limit: 10000, filters: campaignId ? { campaignId } : {} });
    }
    
    if (format === 'json') {
      return res.json({ success: true, data: leads });
    }
    
    // Convert to CSV
    if (leads.length === 0) {
      return res.csv('No leads to export');
    }
    
    const headers = Object.keys(leads[0]);
    const csvRows = [headers.join(',')];
    
    for (const lead of leads) {
      const row = headers.map(h => {
        const value = lead[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).includes(',') ? `"${value}"` : value;
      });
      csvRows.push(row.join(','));
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${step || 'all'}-${Date.now()}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ error: 'Failed to export leads' });
  }
};

module.exports = {
  importLeads,
  getAllLeads,
  getMetrics,
  getLeadsByCampaign,
  getLead,
  updateLead,
  sendToVerification,
  sendToCompScrap,
  sendToBox1,
  sendToInstantly,
  sendToInstantlyStock,
  sendFromStockToInstantly,
  importVerificationOutput,
  importCompScrapOutput,
  importCompScrapCustom,
  importCompscrapeMapped,
  importBox1Output,
  getVerificationInput,
  getCompScrapInput,
  getBox1Input,
  getInstantlyInput,
  getInstantlyStockInput,
  exportLeads,
  upload
};
