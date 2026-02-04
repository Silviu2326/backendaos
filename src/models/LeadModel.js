const db = require('../config/db');

// Transform snake_case to camelCase/PascalCase for frontend
function transformLeadForFrontend(row) {
  return {
    LeadNumber: row.lead_number,
    TargetID: row.target_id,
    firstName: row.first_name,
    lastName: row.last_name,
    personTitle: row.person_title,
    personTitleDescription: row.person_title_description,
    personSummary: row.person_summary,
    personLocation: row.person_location,
    durationInRole: row.duration_in_role,
    durationInCompany: row.duration_in_company,
    personTimestamp: row.person_timestamp,
    personLinkedinUrl: row.person_linkedin_url,
    personSalesUrl: row.person_sales_url,
    companyName_fromP: row.company_name_from_p,
    companyLinkedinUrl_fromP: row.company_linkedin_url_from_p,
    companySalesUrl_fromP: row.company_sales_url_from_p,
    email: row.email,
    email_validation: row.email_validation,
    validation_success: row.validation_success,
    firstName_cleaned: row.first_name_cleaned,
    lastName_cleaned: row.last_name_cleaned,
    companyName: row.company_name,
    companyDescription: row.company_description,
    industry: row.industry,
    employeeCount: row.employee_count,
    companyLocation: row.company_location,
    website: row.website,
    domain: row.domain,
    yearFounded: row.year_founded,
    specialties: row.specialties,
    phone: row.phone,
    minRevenue: row.min_revenue,
    maxRevenue: row.max_revenue,
    growth6Mth: row.growth_6mth,
    growth1Yr: row.growth_1yr,
    growth2Yr: row.growth_2yr,
    compUrl: row.comp_url,
    stepStatus: row.step_status,
    storage: row.storage,
    verification_result: row.verification_result,
    box1_outputs: row.box1_outputs,
    instantly_body1: row.instantly_body1,
    instantly_body2: row.instantly_body2,
    instantly_body3: row.instantly_body3,
    instantly_body4: row.instantly_body4,
    created_at: row.created_at,
    updated_at: row.updated_at,
    
    // LinkedIn profile fields (migration 006)
    profileUrl: row.profile_url,
    fullName: row.full_name,
    linkedinName: row.name,
    linkedinCompanyId: row.company_id,
    companyUrl: row.company_url,
    regularCompanyUrl: row.regular_company_url,
    linkedinSummary: row.summary,
    titleDescription: row.title_description,
    linkedinIndustry: row.industry,
    pastExperienceCompanyName: row.past_experience_company_name,
    pastExperienceCompanyUrl: row.past_experience_company_url,
    pastExperienceCompanyTitle: row.past_experience_company_title,
    pastExperienceDate: row.past_experience_date,
    pastExperienceDuration: row.past_experience_duration,
    connectionDegree: row.connection_degree,
    profileImageUrl: row.profile_image_url,
    sharedConnectionsCount: row.shared_connections_count,
    vmid: row.vmid,
    linkedinProfileUrl: row.linkedin_profile_url,
    isPremium: row.is_premium,
    isOpenLink: row.is_open_link,
    linkedinQuery: row.query,
    linkedinTimestamp: row.timestamp,
    defaultProfileUrl: row.default_profile_url,
    searchAccountProfileId: row.search_account_profile_id,
    searchAccountProfileName: row.search_account_profile_name,
    
    // CompScrap fields (migration 008)
    compscrapCompanyId: row.company_id,
    compscrapName: row.compscrap_company_name,
    compscrapDescription: row.company_description,
    compscrapIndustry: row.compscrap_industry,
    compscrapWebsite: row.compscrap_website,
    compscrapLocation: row.compscrap_location,
    compscrapCountry: row.compscrap_country,
    compscrapGeographicArea: row.compscrap_geographic_area,
    compscrapCity: row.compscrap_city,
    compscrapPostalCode: row.compscrap_postal_code,
    compscrapAddress: row.compscrap_address,
    compscrapHeadquarters: row.compscrap_headquarters,
    compscrapEmployeeCount: row.compscrap_employee_count,
    compscrapEmployeeCountRange: row.compscrap_employee_count_range,
    compscrapMedianTenure: row.compscrap_median_tenure,
    compscrapYearFounded: row.compscrap_year_founded,
    compscrapCurrency: row.compscrap_currency,
    compscrapMinRevenue: row.compscrap_min_revenue,
    compscrapMaxRevenue: row.compscrap_max_revenue,
    compscrapGrowth6Mth: row.compscrap_growth_6mth,
    compscrapGrowth1Yr: row.compscrap_growth_1yr,
    compscrapGrowth2Yr: row.compscrap_growth_2yr,
    compscrapLinkedInCompanyUrl: row.compscrap_linkedin_company_url,
    compscrapSalesNavigatorUrl: row.compscrap_sales_navigator_url,
    compscrapDecisionMakersSearchUrl: row.compscrap_decision_makers_search_url,
    compscrapEmployeeSearchUrl: row.compscrap_employee_search_url,
    compscrapLogoUrl: row.compscrap_logo_url,
    compscrapDecisionMakersCount: row.compscrap_decision_makers_count,
    compscrapNoteCount: row.compscrap_note_count,
    compscrapIsSaved: row.compscrap_is_saved,
    compscrapQuery: row.compscrap_query,
    compscrapTimestamp: row.compscrap_timestamp,
    compscrapError: row.compscrap_error,
    
    // Headcount fields
    headcountBusinessDevelopment: row.headcount_business_development,
    headcountBusinessDevelopmentGrowth1Yr: row.headcount_business_development_growth_1yr,
    headcountOperations: row.headcount_operations,
    headcountOperationsGrowth1Yr: row.headcount_operations_growth_1yr,
    headcountAdministrative: row.headcount_administrative,
    headcountAdministrativeGrowth1Yr: row.headcount_administrative_growth_1yr,
    headcountResearch: row.headcount_research,
    headcountResearchGrowth1Yr: row.headcount_research_growth_1yr,
    headcountHealthcareServices: row.headcount_healthcare_services,
    headcountHealthcareServicesGrowth1Yr: row.headcount_healthcare_services_growth_1yr,
    headcountHumanResources: row.headcount_human_resources,
    headcountHumanResourcesGrowth1Yr: row.headcount_human_resources_growth_1yr,
    headcountConsulting: row.headcount_consulting,
    headcountConsultingGrowth1Yr: row.headcount_consulting_growth_1yr,
    headcountSales: row.headcount_sales,
    headcountSalesGrowth1Yr: row.headcount_sales_growth_1yr,
    headcountMarketing: row.headcount_marketing,
    headcountMarketingGrowth1Yr: row.headcount_marketing_growth_1yr,
    headcountMediaAndCommunication: row.headcount_media_and_communication,
    headcountMediaAndCommunicationGrowth1Yr: row.headcount_media_and_communication_growth_1yr,
    headcountInformationTechnology: row.headcount_information_technology,
    headcountInformationTechnologyGrowth1Yr: row.headcount_information_technology_growth_1yr,
    headcountFinance: row.headcount_finance,
    headcountFinanceGrowth1Yr: row.headcount_finance_growth_1yr,
    headcountProgramAndProjectManagement: row.headcount_program_and_project_management,
    headcountProgramAndProjectManagementGrowth1Yr: row.headcount_program_and_project_management_growth_1yr,
    headcountEducation: row.headcount_education,
    headcountEducationGrowth1Yr: row.headcount_education_growth_1yr,
    headcountEngineering: row.headcount_engineering,
    headcountEngineeringGrowth1Yr: row.headcount_engineering_growth_1yr,
    headcountAccounting: row.headcount_accounting,
    headcountAccountingGrowth1Yr: row.headcount_accounting_growth_1yr,
    headcountCustomerSuccessAndSupport: row.headcount_customer_success_and_support,
    headcountCustomerSuccessAndSupportGrowth1Yr: row.headcount_customer_success_and_support_growth_1yr,
    headcountCommunityAndSocialServices: row.headcount_community_and_social_services,
    headcountCommunityAndSocialServicesGrowth1Yr: row.headcount_community_and_social_services_growth_1yr,
    headcountLegal: row.headcount_legal,
    headcountLegalGrowth1Yr: row.headcount_legal_growth_1yr,
    headcountRealEstate: row.headcount_real_estate,
    headcountRealEstateGrowth1Yr: row.headcount_real_estate_growth_1yr,
    headcountEntrepreneurship: row.headcount_entrepreneurship,
    headcountEntrepreneurshipGrowth1Yr: row.headcount_entrepreneurship_growth_1yr,
    headcountArtsAndDesign: row.headcount_arts_and_design,
    headcountArtsAndDesignGrowth1Yr: row.headcount_arts_and_design_growth_1yr,
    headcountMilitaryAndProtectiveServices: row.headcount_military_and_protective_services,
    headcountMilitaryAndProtectiveServicesGrowth1Yr: row.headcount_military_and_protective_services_growth_1yr,
    headcountQualityAssurance: row.headcount_quality_assurance,
    headcountQualityAssuranceGrowth1Yr: row.headcount_quality_assurance_growth_1yr,
    headcountPurchasing: row.headcount_purchasing,
    headcountPurchasingGrowth1Yr: row.headcount_purchasing_growth_1yr,
    headcountProductManagement: row.headcount_product_management,
    headcountProductManagementGrowth1Yr: row.headcount_product_management_growth_1yr,
  };
}

class LeadModel {
  /**
   * Generate the next lead number for a campaign
   * LeadNumber = campaign_id * 1000 + sequential number within campaign
   */
  static async getNextLeadNumber(campaignId) {
    // Get the current max lead_number for this campaign
    const result = await db.query(
      'SELECT COALESCE(MAX(lead_number), 0) as max_lead FROM leads WHERE campaign_id = $1',
      [campaignId]
    );
    
    const maxLead = parseInt(result.rows[0].max_lead);
    // Extract the sequential part and increment
    const campaignBase = campaignId * 1000;
    const currentSeq = maxLead > campaignBase ? maxLead - campaignBase : 0;
    
    return campaignBase + currentSeq + 1;
  }

  /**
   * Find a lead by email
   */
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM leads WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Get leads by status for LEAD_INPUT node
   * Maps statusFilter to appropriate database query
   */
  static async getLeadsByStatus(statusFilter, limit = 100) {
    let query = `SELECT * FROM leads WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    switch (statusFilter) {
      case 'pending_verification':
        query += ` AND step_status->>'verification' = 'pending' AND step_status->>'export' IN ('true', '1')`;
        break;
      case 'pending_compscrap':
        query += ` AND step_status->>'verification' = 'verified' AND step_status->>'compScrap' = 'pending'`;
        break;
      case 'pending_box1':
        query += ` AND step_status->>'compScrap' = 'scraped' AND step_status->>'box1' = 'pending'`;
        break;
      case 'pending_instantly':
        query += ` AND step_status->>'box1' = 'hit' AND step_status->>'instantly' = 'pending'`;
        break;
      case 'all':
        // Return all leads
        break;
      default:
        // Default to pending verification
        query += ` AND step_status->>'verification' = 'pending'`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Find a lead by lead_number
   */
  static async findByLeadNumber(leadNumber) {
    const result = await db.query(
      'SELECT * FROM leads WHERE lead_number = $1',
      [leadNumber]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new lead
   */
  static async create(leadData) {
    const {
      lead_number,
      first_name,
      last_name,
      email,
      company_name_from_p,
      phone,
      campaign_id,
      target_id,
      person_title,
      person_location,
      person_linkedin_url,
      company_linkedin_url_from_p,
      company_sales_url_from_p,
      // LinkedIn profile fields (migration 006)
      profile_url,
      full_name,
      name,
      company_id,
      company_url,
      regular_company_url,
      summary,
      title_description,
      industry,
      company_location,
      duration_in_role,
      duration_in_company,
      past_experience_company_name,
      past_experience_company_url,
      past_experience_company_title,
      past_experience_date,
      past_experience_duration,
      connection_degree,
      profile_image_url,
      shared_connections_count,
      vmid,
      linkedin_profile_url,
      is_premium,
      is_open_link,
      query,
      timestamp,
      default_profile_url,
      search_account_profile_id,
      search_account_profile_name
    } = leadData;

    const stepStatus = {
      export: true,
      verification: 'pending',
      compScrap: 'pending',
      box1: 'pending',
      instantly: 'pending'
    };

    const result = await db.query(
      `INSERT INTO leads (
        lead_number, target_id, first_name, last_name, person_title,
        person_location, person_linkedin_url,
        email, company_name_from_p, company_linkedin_url_from_p,
        company_sales_url_from_p, phone, campaign_id, step_status,
        profile_url, full_name, name, company_id, company_url, regular_company_url,
        summary, title_description, industry, company_location, duration_in_role,
        duration_in_company, past_experience_company_name, past_experience_company_url,
        past_experience_company_title, past_experience_date, past_experience_duration,
        connection_degree, profile_image_url, shared_connections_count, vmid,
        linkedin_profile_url, is_premium, is_open_link, query, timestamp,
        default_profile_url, search_account_profile_id, search_account_profile_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45)
      RETURNING *`,
      [
        lead_number,
        target_id || null,
        first_name,
        last_name,
        person_title || null,
        person_location || null,
        person_linkedin_url || null,
        email.toLowerCase(),
        company_name_from_p || null,
        company_linkedin_url_from_p || null,
        company_sales_url_from_p || null,
        phone || null,
        campaign_id || null,
        JSON.stringify(stepStatus),
        // LinkedIn profile fields
        profile_url || null,
        full_name || null,
        name || null,
        company_id || null,
        company_url || null,
        regular_company_url || null,
        summary || null,
        title_description || null,
        industry || null,
        company_location || null,
        duration_in_role || null,
        duration_in_company || null,
        past_experience_company_name || null,
        past_experience_company_url || null,
        past_experience_company_title || null,
        past_experience_date || null,
        past_experience_duration || null,
        connection_degree || null,
        profile_image_url || null,
        shared_connections_count || null,
        vmid || null,
        linkedin_profile_url || null,
        is_premium || false,
        is_open_link || false,
        query || null,
        timestamp || null,
        default_profile_url || null,
        search_account_profile_id || null,
        search_account_profile_name || null
      ]
    );

    return result.rows[0];
  }

  /**
   * Update an existing lead
   * Supports updating various fields including verification results and step status
   */
  static async update(leadNumber, leadData) {
    const allowedFields = [
      'first_name', 'last_name', 'company_name_from_p', 'phone',
      'verification_result', 'compscrap_result', 'box1_result',
      'email_validation', 'validation_success', 'first_name_cleaned', 'last_name_cleaned',
      'comp_url', 'company_name', 'company_description', 'industry',
      'employee_count', 'company_location', 'website', 'year_founded',
      'specialties', 'phone', 'min_revenue', 'max_revenue',
      'growth_6mth', 'growth_1yr', 'growth_2yr', 'storage',
      // LinkedIn profile fields (migration 006)
      'profile_url', 'full_name', 'name', 'company_id', 'company_url',
      'regular_company_url', 'summary', 'title_description', 'industry',
      'duration_in_role', 'duration_in_company', 'past_experience_company_name',
      'past_experience_company_url', 'past_experience_company_title',
      'past_experience_date', 'past_experience_duration', 'connection_degree',
      'profile_image_url', 'shared_connections_count', 'vmid', 'linkedin_profile_url',
      'is_premium', 'is_open_link', 'query', 'timestamp', 'default_profile_url',
      'search_account_profile_id', 'search_account_profile_name'
    ];

    const setClauses = ['updated_at = NOW()'];
    const values = [leadNumber];
    let paramIndex = 2;

    for (const field of allowedFields) {
      if (leadData[field] !== undefined) {
        if (field === 'verification_result' || field === 'compscrap_result' || field === 'box1_result') {
          // JSON fields
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(JSON.stringify(leadData[field]));
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(leadData[field]);
        }
        paramIndex++;
      }
    }

    // Handle step_status update separately if provided
    if (leadData.step_status && typeof leadData.step_status === 'object') {
      setClauses.push(`step_status = $${paramIndex}`);
      values.push(JSON.stringify(leadData.step_status));
      paramIndex++;
    }

    const result = await db.query(
      `UPDATE leads SET ${setClauses.join(', ')} WHERE lead_number = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Update compScrap data with custom column mappings
   * Used when importing compScrap output with variable column positions
   * Supports both compScrap fields and Box1 flow output fields
   */
  static async updateCompscrapCustom(leadNumber, compscrapData) {
    const setClauses = ['updated_at = NOW()'];
    const values = [leadNumber];
    let paramIndex = 2;

    // Define all possible compScrap fields (migration 008)
    // Includes both original compScrap fields and Box1 flow output fields
    const compscrapFields = {
      // Matching fields
      lead_number: 'lead_number',
      target_id: 'target_id',
      
      // Person info (from Box1 flow)
      first_name: 'first_name',
      last_name: 'last_name',
      person_title: 'person_title',
      person_title_description: 'person_title_description',
      person_summary: 'person_summary',
      person_location: 'person_location',
      duration_in_role: 'duration_in_role',
      duration_in_company: 'duration_in_company',
      person_timestamp: 'person_timestamp',
      person_linkedin_url: 'person_linkedin_url',
      person_sales_url: 'person_sales_url',
      
      // Email info (from Box1 flow)
      email: 'email',
      email_validation: 'email_validation',
      
      // Company identification (from Box1 flow and compScrap)
      company_id: 'company_id',
      compscrap_company_name: 'compscrap_company_name',
      company_name: 'company_name',
      company_description: 'company_description',
      company_tag_line: 'company_tag_line',
      compscrap_industry: 'compscrap_industry',
      industry: 'industry',
      compscrap_employee_count: 'compscrap_employee_count',
      employee_count: 'employee_count',
      compscrap_location: 'compscrap_location',
      company_location: 'company_location',
      compscrap_website: 'compscrap_website',
      website: 'website',
      domain: 'domain',
      compscrap_year_founded: 'compscrap_year_founded',
      year_founded: 'year_founded',
      compscrap_specialties: 'compscrap_specialties',
      specialties: 'specialties',
      compscrap_phone: 'compscrap_phone',
      phone: 'phone',
      
      // Location (compScrap specific)
      compscrap_country: 'compscrap_country',
      compscrap_geographic_area: 'compscrap_geographic_area',
      compscrap_city: 'compscrap_city',
      compscrap_postal_code: 'compscrap_postal_code',
      compscrap_address: 'compscrap_address',
      compscrap_headquarters: 'compscrap_headquarters',
      
      // Employee data (compScrap specific)
      compscrap_employee_count_range: 'compscrap_employee_count_range',
      compscrap_median_tenure: 'compscrap_median_tenure',
      
      // Financial
      compscrap_currency: 'compscrap_currency',
      compscrap_min_revenue: 'compscrap_min_revenue',
      min_revenue: 'min_revenue',
      compscrap_max_revenue: 'compscrap_max_revenue',
      max_revenue: 'max_revenue',
      compscrap_growth_6mth: 'compscrap_growth_6mth',
      growth_6mth: 'growth_6mth',
      compscrap_growth_1yr: 'compscrap_growth_1yr',
      growth_1yr: 'growth_1yr',
      compscrap_growth_2yr: 'compscrap_growth_2yr',
      growth_2yr: 'growth_2yr',
      
      // Timestamps (from Box1 flow)
      company_timestamp: 'company_timestamp_sn',
      
      // URLs
      compscrap_linkedin_company_url: 'compscrap_linkedin_company_url',
      linkedin_company_url: 'linkedin_company_url',
      compscrap_sales_navigator_url: 'compscrap_sales_navigator_url',
      sales_navigator_company_url: 'sales_navigator_company_url',
      compscrap_decision_makers_search_url: 'compscrap_decision_makers_search_url',
      compscrap_employee_search_url: 'compscrap_employee_search_url',
      compscrap_logo_url: 'compscrap_logo_url',
      
      // Counts and metadata
      compscrap_decision_makers_count: 'compscrap_decision_makers_count',
      compscrap_note_count: 'compscrap_note_count',
      compscrap_is_saved: 'compscrap_is_saved',
      compscrap_query: 'compscrap_query',
      compscrap_timestamp: 'compscrap_timestamp',
      compscrap_error: 'compscrap_error',
      
      // Headcount fields (map from camelCase to snake_case)
      headcount_business_development: 'headcount_business_development',
      headcount_business_development_growth_1yr: 'headcount_business_development_growth_1yr',
      headcount_operations: 'headcount_operations',
      headcount_operations_growth_1yr: 'headcount_operations_growth_1yr',
      headcount_administrative: 'headcount_administrative',
      headcount_administrative_growth_1yr: 'headcount_administrative_growth_1yr',
      headcount_research: 'headcount_research',
      headcount_research_growth_1yr: 'headcount_research_growth_1yr',
      headcount_healthcare_services: 'headcount_healthcare_services',
      headcount_healthcare_services_growth_1yr: 'headcount_healthcare_services_growth_1yr',
      headcount_human_resources: 'headcount_human_resources',
      headcount_human_resources_growth_1yr: 'headcount_human_resources_growth_1yr',
      headcount_consulting: 'headcount_consulting',
      headcount_consulting_growth_1yr: 'headcount_consulting_growth_1yr',
      headcount_sales: 'headcount_sales',
      headcount_sales_growth_1yr: 'headcount_sales_growth_1yr',
      headcount_marketing: 'headcount_marketing',
      headcount_marketing_growth_1yr: 'headcount_marketing_growth_1yr',
      headcount_media_and_communication: 'headcount_media_and_communication',
      headcount_media_and_communication_growth_1yr: 'headcount_media_and_communication_growth_1yr',
      headcount_information_technology: 'headcount_information_technology',
      headcount_information_technology_growth_1yr: 'headcount_information_technology_growth_1yr',
      headcount_finance: 'headcount_finance',
      headcount_finance_growth_1yr: 'headcount_finance_growth_1yr',
      headcount_program_and_project_management: 'headcount_program_and_project_management',
      headcount_program_and_project_management_growth_1yr: 'headcount_program_and_project_management_growth_1yr',
      headcount_education: 'headcount_education',
      headcount_education_growth_1yr: 'headcount_education_growth_1yr',
      headcount_engineering: 'headcount_engineering',
      headcount_engineering_growth_1yr: 'headcount_engineering_growth_1yr',
      headcount_accounting: 'headcount_accounting',
      headcount_accounting_growth_1yr: 'headcount_accounting_growth_1yr',
      headcount_customer_success_and_support: 'headcount_customer_success_and_support',
      headcount_customer_success_and_support_growth_1yr: 'headcount_customer_success_and_support_growth_1yr',
      headcount_community_and_social_services: 'headcount_community_and_social_services',
      headcount_community_and_social_services_growth_1yr: 'headcount_community_and_social_services_growth_1yr',
      headcount_legal: 'headcount_legal',
      headcount_legal_growth_1yr: 'headcount_legal_growth_1yr',
      headcount_real_estate: 'headcount_real_estate',
      headcount_real_estate_growth_1yr: 'headcount_real_estate_growth_1yr',
      headcount_entrepreneurship: 'headcount_entrepreneurship',
      headcount_entrepreneurship_growth_1yr: 'headcount_entrepreneurship_growth_1yr',
      headcount_arts_and_design: 'headcount_arts_and_design',
      headcount_arts_and_design_growth_1yr: 'headcount_arts_and_design_growth_1yr',
      headcount_military_and_protective_services: 'headcount_military_and_protective_services',
      headcount_military_and_protective_services_growth_1yr: 'headcount_military_and_protective_services_growth_1yr',
      headcount_quality_assurance: 'headcount_quality_assurance',
      headcount_quality_assurance_growth_1yr: 'headcount_quality_assurance_growth_1yr',
      headcount_purchasing: 'headcount_purchasing',
      headcount_purchasing_growth_1yr: 'headcount_purchasing_growth_1yr',
      headcount_product_management: 'headcount_product_management',
      headcount_product_management_growth_1yr: 'headcount_product_management_growth_1yr',
    };

    for (const [fieldName, dbColumn] of Object.entries(compscrapFields)) {
      if (compscrapData[fieldName] !== undefined) {
        setClauses.push(`${dbColumn} = $${paramIndex}`);
        values.push(compscrapData[fieldName]);
        paramIndex++;
      }
    }

    const result = await db.query(
      `UPDATE leads SET ${setClauses.join(', ')} WHERE lead_number = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Update step status with timestamp
   */
  static async updateStepStatus(leadNumber, step, status, additionalData = {}) {
    const timestampFields = {
      verification: { sent: 'verification_sent_at', completed: 'verification_completed_at' },
      compScrap: { sent: 'compscrap_sent_at', completed: 'compscrap_completed_at' },
      box1: { sent: 'box1_sent_at', completed: 'box1_completed_at' },
      instantly: { sent: 'instantly_sent_at', completed: null }
    };

    const timestampField = status === 'sent' && timestampFields[step]?.sent 
      ? `${timestampFields[step].sent} = NOW()` 
      : status === 'verified' || status === 'scraped' || ['fit', 'drop', 'no_fit', 'hit'].includes(status) || ['replied', 'positive_reply', 'converted', 'bounced'].includes(status)
        ? (timestampFields[step]?.completed ? `${timestampFields[step].completed} = NOW()` : '')
        : '';

    const setClauses = [`step_status = jsonb_set(step_status, '{${step}}', '"${status}"')`];
    const values = [leadNumber];
    let paramIndex = 2;

    if (timestampField) {
      setClauses.push(timestampField);
    }

    const allowedFields = ['email', 'email_validation', 'validation_success', 'first_name_cleaned', 
      'last_name_cleaned', 'company_name', 'company_description', 'industry', 'employee_count',
      'company_location', 'website', 'year_founded', 'specialties', 'phone', 'min_revenue',
      'max_revenue', 'growth_6mth', 'growth_1yr', 'growth_2yr', 'linkedin_company_url',
      'comp_url', 'company_timestamp_sn', 'company_timestamp_ln', 'sales_navigator_company_url',
      'instantly_body1', 'instantly_body2', 'instantly_body3', 'instantly_body4',
      'instantly_response', 'instantly_conversion', 'box1_outputs'];

    for (const field of allowedFields) {
      if (additionalData[field] !== undefined) {
        if (field === 'box1_outputs') {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(JSON.stringify(additionalData[field]));
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(additionalData[field]);
        }
        paramIndex++;
      }
    }

    const result = await db.query(
      `UPDATE leads SET ${setClauses.join(', ')} WHERE lead_number = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Send leads to verification step
   */
  static async sendToVerification(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET 
        step_status = jsonb_set(step_status, '{verification}', '"sent"'),
        verification_sent_at = NOW()
      WHERE lead_number = ANY($1)
      AND step_status->>'verification' = 'pending'
      RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Send leads to compScrap step
   */
  static async sendToCompScrap(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET 
        step_status = jsonb_set(step_status, '{compScrap}', '"sent"'),
        compscrap_sent_at = NOW()
      WHERE lead_number = ANY($1)
      AND step_status->>'compScrap' = 'pending'
      AND step_status->>'verification' = 'verified'
      RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Send leads to box1 step
   */
  static async sendToBox1(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET 
        step_status = jsonb_set(step_status, '{box1}', '"sent"'),
        box1_sent_at = NOW()
      WHERE lead_number = ANY($1)
      AND step_status->>'box1' = 'pending'
      AND step_status->>'compScrap' = 'scraped'
      RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Send leads to instantly step
   */
  static async sendToInstantly(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET 
        step_status = jsonb_set(step_status, '{instantly}', '"sent"'),
        instantly_sent_at = NOW()
      WHERE lead_number = ANY($1)
      AND step_status->>'instantly' = 'pending'
      AND step_status->>'box1' = 'hit'
      RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Mark leads as stored (FIT no HIT)
   */
  static async markAsStorage(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET storage = true WHERE lead_number = ANY($1) RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Get leads for verification input
   */
  static async getVerificationInput(limit = 1000) {
    const result = await db.query(
      `SELECT lead_number as "LeadNumber", target_id as "TargetID",
        first_name as "firstName", last_name as "lastName", person_title as "personTitle",
        person_title_description as "personTitleDescription", person_summary as "personSummary",
        person_location as "personLocation", duration_in_role as "durationInRole",
        duration_in_company as "durationInCompany", person_timestamp as "personTimestamp",
        person_linkedin_url as "personLinkedinUrl", person_sales_url as "personSalesUrl",
        company_name_from_p as "companyName_fromP", company_linkedin_url_from_p as "companyLinkedinUrl_fromP",
        company_sales_url_from_p as "companySalesUrl_fromP"
      FROM leads
      WHERE step_status->>'export' IN ('true', '1') AND step_status->>'verification' = 'pending'
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get leads for compScrap input
   */
  static async getCompScrapInput(limit = 1000) {
    const result = await db.query(
      `SELECT lead_number as "LeadNumber", target_id as "TargetID",
        first_name as "firstName", last_name as "lastName", person_title as "personTitle",
        email, email_validation, validation_success, first_name_cleaned, last_name_cleaned
      FROM leads
      WHERE step_status->>'verification' = 'verified' AND step_status->>'compScrap' = 'pending'
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get leads for box1 input
   * Returns all fields needed for Box1 / FIT processing
   */
  static async getBox1Input(limit = 1000) {
    const result = await db.query(
      `SELECT 
        lead_number as "LeadNumber",
        target_id as "TargetID",
        first_name as "firstName",
        last_name as "lastName",
        person_title as "personTitle",
        person_title_description as "personTitleDescription",
        person_summary as "personSummary",
        person_location as "personLocation",
        duration_in_role as "durationInRole",
        duration_in_company as "durationInCompany",
        person_timestamp as "personTimestamp",
        person_linkedin_url as "personLinkedinUrl",
        person_sales_url as "personSalesUrl",
        email,
        email_validation,
        company_name as "companyName",
        company_description as "companyDescription",
        company_tag_line as "companyTagLine",
        industry,
        employee_count as "employeeCount",
        company_location as "companyLocation",
        website,
        domain,
        year_founded as "yearFounded",
        specialties,
        phone,
        min_revenue as "minRevenue",
        max_revenue as "maxRevenue",
        growth_6mth as "growth6Mth",
        growth_1yr as "growth1Yr",
        growth_2yr as "growth2Yr",
        company_timestamp_sn as "companyTimestamp",
        linkedin_company_url as "linkedInCompanyUrl",
        sales_navigator_company_url as "salesNavigatorCompanyUrl"
      FROM leads
      WHERE step_status->>'compScrap' = 'scraped' AND step_status->>'box1' = 'pending'
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get leads for instantly input
   */
  static async getInstantlyInput(limit = 1000) {
    const result = await db.query(
      `SELECT lead_number as "LeadNumber", target_id as "TargetID",
        first_name_cleaned, last_name_cleaned, email,
        instantly_body1 as body1, instantly_body2 as body2,
        instantly_body3 as body3, instantly_body4 as body4
      FROM leads
      WHERE step_status->>'box1' = 'hit' AND step_status->>'instantly' = 'pending'
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Send leads to instantly stock (save for later)
   */
  static async sendToInstantlyStock(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET 
        step_status = jsonb_set(step_status, '{instantly}', '"stock"'),
        instantly_stock_at = NOW()
      WHERE lead_number = ANY($1)
      AND step_status->>'instantly' = 'pending'
      AND step_status->>'box1' = 'hit'
      RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Send leads from instantly stock to instantly (send now)
   */
  static async sendFromStockToInstantly(leadNumbers) {
    const result = await db.query(
      `UPDATE leads SET 
        step_status = jsonb_set(step_status, '{instantly}', '"sent"'),
        instantly_sent_at = NOW()
      WHERE lead_number = ANY($1)
      AND step_status->>'instantly' = 'stock'
      RETURNING *`,
      [leadNumbers]
    );
    return result.rows;
  }

  /**
   * Get leads for instantly stock input
   */
  static async getInstantlyStockInput(limit = 1000) {
    const result = await db.query(
      `SELECT lead_number as "LeadNumber", target_id as "TargetID",
        first_name_cleaned, last_name_cleaned, email,
        instantly_body1 as body1, instantly_body2 as body2,
        instantly_body3 as body3, instantly_body4 as body4,
        company_name, company_description, industry, website
      FROM leads
      WHERE step_status->>'instantly' = 'stock'
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Count leads by campaign
   */
  static async countByCampaign(campaignId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM leads WHERE campaign_id = $1',
      [campaignId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get all leads by campaign with pagination
   */
  static async getByCampaign(campaignId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const result = await db.query(
      `SELECT * FROM leads WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    );

    return result.rows.map(transformLeadForFrontend);
  }

  /**
   * Get all leads with pagination
   */
  static async getAll(options = {}) {
    const { limit = 100, offset = 0, filters = {} } = options;
    
    let query = `SELECT * FROM leads WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (filters.campaignId) {
      query += ` AND campaign_id = $${paramIndex}`;
      values.push(filters.campaignId);
      paramIndex++;
    }

    if (filters.verificationStatus) {
      query += ` AND step_status->>'verification' = $${paramIndex}`;
      values.push(filters.verificationStatus);
      paramIndex++;
    }

    if (filters.compScrapStatus) {
      query += ` AND step_status->>'compScrap' = $${paramIndex}`;
      values.push(filters.compScrapStatus);
      paramIndex++;
    }

    if (filters.box1Status) {
      query += ` AND step_status->>'box1' = $${paramIndex}`;
      values.push(filters.box1Status);
      paramIndex++;
    }

    if (filters.instantlyStatus) {
      query += ` AND step_status->>'instantly' = $${paramIndex}`;
      values.push(filters.instantlyStatus);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows.map(transformLeadForFrontend);
  }

  /**
   * Get total count with filters
   */
  static async countAll(filters = {}) {
    let query = `SELECT COUNT(*) as count FROM leads WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (filters.campaignId) {
      query += ` AND campaign_id = $${paramIndex}`;
      values.push(filters.campaignId);
      paramIndex++;
    }

    if (filters.verificationStatus) {
      query += ` AND step_status->>'verification' = $${paramIndex}`;
      values.push(filters.verificationStatus);
      paramIndex++;
    }

    if (filters.compScrapStatus) {
      query += ` AND step_status->>'compScrap' = $${paramIndex}`;
      values.push(filters.compScrapStatus);
      paramIndex++;
    }

    if (filters.box1Status) {
      query += ` AND step_status->>'box1' = $${paramIndex}`;
      values.push(filters.box1Status);
      paramIndex++;
    }

    if (filters.instantlyStatus) {
      query += ` AND step_status->>'instantly' = $${paramIndex}`;
      values.push(filters.instantlyStatus);
      paramIndex++;
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get comprehensive metrics
   */
  static async getMetrics(campaignId = null) {
    const whereClause = campaignId ? 'WHERE campaign_id = $1' : 'WHERE 1=1';
    const values = campaignId ? [campaignId] : [];

    const totalResult = await db.query(`SELECT COUNT(*) as count FROM leads ${whereClause}`, values);
    const totalExport = parseInt(totalResult.rows[0].count);

    // Verification metrics
    const verifiedResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'verification' = 'verified'`,
      values
    );
    const verified = parseInt(verifiedResult.rows[0].count);

    const sentVerificationResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'verification' IN ('sent', 'verified', 'failed')`,
      values
    );
    const sentVerification = parseInt(sentVerificationResult.rows[0].count);

    const pendingVerificationResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'export' IN ('true', '1') AND step_status->>'verification' = 'pending'`,
      values
    );
    const pendingVerification = parseInt(pendingVerificationResult.rows[0].count);

    const verifiedWithCompUrlResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'verification' = 'verified' AND comp_url IS NOT NULL AND comp_url != ''`,
      values
    );
    const verifiedWithCompUrl = parseInt(verifiedWithCompUrlResult.rows[0].count);

    // CompScrap metrics
    const scrapedResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'compScrap' = 'scraped'`,
      values
    );
    const scraped = parseInt(scrapedResult.rows[0].count);

    const sentCompScrapResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'compScrap' IN ('sent', 'scraped', 'failed')`,
      values
    );
    const sentCompScrap = parseInt(sentCompScrapResult.rows[0].count);

    const pendingCompScrapResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'verification' = 'verified' AND step_status->>'compScrap' = 'pending'`,
      values
    );
    const pendingCompScrap = parseInt(pendingCompScrapResult.rows[0].count);

    const totalWithCompUrlResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND comp_url IS NOT NULL AND comp_url != ''`,
      values
    );
    const totalWithCompUrl = parseInt(totalWithCompUrlResult.rows[0].count);

    // Box1 metrics
    const dropResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'box1' = 'drop'`,
      values
    );
    const dropCount = parseInt(dropResult.rows[0].count);

    const fitResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'box1' = 'fit'`,
      values
    );
    const fitCount = parseInt(fitResult.rows[0].count);

    const hitResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'box1' = 'hit'`,
      values
    );
    const hitCount = parseInt(hitResult.rows[0].count);

    const sentBox1Result = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'box1' IN ('sent', 'fit', 'drop', 'no_fit', 'hit', 'failed')`,
      values
    );
    const sentBox1 = parseInt(sentBox1Result.rows[0].count);

    const pendingBox1Result = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'compScrap' = 'scraped' AND step_status->>'box1' = 'pending'`,
      values
    );
    const pendingBox1 = parseInt(pendingBox1Result.rows[0].count);

    // Storage (FIT no HIT)
    const storageResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND storage = true`,
      values
    );
    const noHitFitCount = parseInt(storageResult.rows[0].count);

    // Instantly metrics
    const sentInstantlyResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'instantly' IN ('sent', 'replied', 'positive_reply', 'converted', 'bounced')`,
      values
    );
    const sentInstantly = parseInt(sentInstantlyResult.rows[0].count);

    const pendingInstantlyResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'box1' = 'hit' AND step_status->>'instantly' = 'pending'`,
      values
    );
    const pendingInstantly = parseInt(pendingInstantlyResult.rows[0].count);

    const repliedResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'instantly' IN ('replied', 'positive_reply', 'converted')`,
      values
    );
    const repliedCount = parseInt(repliedResult.rows[0].count);

    const positiveReplyResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'instantly' IN ('positive_reply', 'converted')`,
      values
    );
    const positiveReplyCount = parseInt(positiveReplyResult.rows[0].count);

    const convertedResult = await db.query(
      `SELECT COUNT(*) as count FROM leads ${whereClause} AND step_status->>'instantly' = 'converted'`,
      values
    );
    const convertedCount = parseInt(convertedResult.rows[0].count);

    // Calculate ratios
    const verificationRatio = totalExport > 0 ? verified / totalExport : 0;
    const verifiedWithCompUrlRatio = verified > 0 ? verifiedWithCompUrl / verified : 0;
    const compScrapRatio = sentCompScrap > 0 ? scraped / sentCompScrap : 0;
    const compUrlRatio = totalExport > 0 ? totalWithCompUrl / totalExport : 0;
    const dropRatio = sentBox1 > 0 ? dropCount / sentBox1 : 0;
    const fitRatio = sentBox1 > 0 ? fitCount / sentBox1 : 0;
    const hitRatio = sentBox1 > 0 ? hitCount / sentBox1 : 0;
    const storageRatio = sentBox1 > 0 ? noHitFitCount / sentBox1 : 0;
    const fitHitRatio = sentBox1 > 0 ? (fitCount + hitCount) / sentBox1 : 0;
    const replyRatio = sentInstantly > 0 ? repliedCount / sentInstantly : 0;
    const positiveReplyRatio = repliedCount > 0 ? positiveReplyCount / repliedCount : 0;
    const conversionRatio = positiveReplyCount > 0 ? convertedCount / positiveReplyCount : 0;

    // Estimates
    const estimatedVerified = totalExport * verificationRatio;
    const estimatedCompScrap = estimatedVerified * compScrapRatio;
    const estimatedFitHit = estimatedCompScrap * fitHitRatio;
    const estimatedPositiveReply = estimatedFitHit * positiveReplyRatio;
    const estimatedConversion = estimatedPositiveReply * conversionRatio;

    return {
      totalExport, pendingVerification, sentVerification, verified, verificationRatio,
      verifiedWithCompUrl, verifiedWithCompUrlRatio, pendingCompScrap, sentCompScrap,
      scraped, compScrapRatio, totalWithCompUrl, compUrlRatio, pendingBox1, sentBox1,
      dropCount, fitCount, hitCount, noHitFitCount, dropRatio, fitRatio, hitRatio,
      storageRatio, fitHitRatio, pendingInstantly, sentInstantly, repliedCount,
      positiveReplyCount, convertedCount, replyRatio, positiveReplyRatio, conversionRatio,
      estimatedVerified, estimatedCompScrap, estimatedFitHit, estimatedPositiveReply,
      estimatedConversion
    };
  }
}

module.exports = LeadModel;
