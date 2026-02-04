-- Migration 008: Add CompScrap output fields to leads table
-- Includes all company data fields and headcount variations

-- Company identification
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_company_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_industry VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_website VARCHAR(500);

-- Location fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_location VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_country VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_geographic_area VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_city VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_postal_code VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_headquarters VARCHAR(500);

-- Employee data
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_employee_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_employee_count_range VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_median_tenure VARCHAR(100);

-- Financial data
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_year_founded INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_currency VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_min_revenue VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_max_revenue VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_growth_6mth VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_growth_2yr VARCHAR(50);

-- URLs
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_linkedin_company_url VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_sales_navigator_url VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_decision_makers_search_url VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_employee_search_url VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_logo_url VARCHAR(500);

-- Counts and metadata
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_decision_makers_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_note_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_is_saved BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_query TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_timestamp TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_error TEXT;

-- Headcount by department
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_business_development INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_business_development_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_operations INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_operations_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_administrative INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_administrative_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_research INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_research_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_healthcare_services INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_healthcare_services_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_human_resources INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_human_resources_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_consulting INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_consulting_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_sales INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_sales_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_marketing INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_marketing_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_media_and_communication INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_media_and_communication_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_information_technology INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_information_technology_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_finance INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_finance_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_program_and_project_management INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_program_and_project_management_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_education INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_education_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_engineering INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_engineering_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_accounting INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_accounting_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_customer_success_and_support INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_customer_success_and_support_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_community_and_social_services INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_community_and_social_services_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_legal INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_legal_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_real_estate INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_real_estate_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_entrepreneurship INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_entrepreneurship_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_arts_and_design INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_arts_and_design_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_military_and_protective_services INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_military_and_protective_services_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_quality_assurance INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_quality_assurance_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_purchasing INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_purchasing_growth_1yr VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_product_management INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS headcount_product_management_growth_1yr VARCHAR(50);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_compscrap_company ON leads(compscrap_company_name);
CREATE INDEX IF NOT EXISTS idx_leads_compscrap_industry ON leads(compscrap_industry);
CREATE INDEX IF NOT EXISTS idx_leads_compscrap_country ON leads(compscrap_country);
CREATE INDEX IF NOT EXISTS idx_leads_compscrap_employee_count ON leads(compscrap_employee_count);
