-- Migration: Add timestamps and storage field
-- Date: 2026-01-31
-- Description: Adds timestamps for each step and storage field for FIT no HIT leads

-- Add timestamps columns for each step
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_sent_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compscrap_completed_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS box1_sent_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS box1_completed_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instantly_sent_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS storage BOOLEAN DEFAULT false;

-- Add compound index for efficient step queries
CREATE INDEX IF NOT EXISTS idx_leads_verification_pending ON leads (step_status) 
WHERE (step_status->>'verification' = 'pending' AND step_status->>'export' = 'true');

CREATE INDEX IF NOT EXISTS idx_leads_compscrape_pending ON leads (step_status) 
WHERE (step_status->>'compScrap' = 'pending' AND step_status->>'verification' = 'verified');

CREATE INDEX IF NOT EXISTS idx_leads_box1_pending ON leads (step_status) 
WHERE (step_status->>'box1' = 'pending' AND step_status->>'compScrap' = 'scraped');

CREATE INDEX IF NOT EXISTS idx_leads_instantly_pending ON leads (step_status) 
WHERE (step_status->>'instantly' = 'pending' AND step_status->>'box1' = 'hit');

CREATE INDEX IF NOT EXISTS idx_leads_storage ON leads (storage) WHERE storage = true;

-- Create view for each step input
CREATE OR REPLACE VIEW v_verification_input AS
SELECT 
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
  company_name_from_p as "companyName_fromP",
  company_linkedin_url_from_p as "companyLinkedinUrl_fromP",
  company_sales_url_from_p as "companySalesUrl_fromP"
FROM leads
WHERE (step_status->>'export')::boolean = true
  AND step_status->>'verification' = 'pending';

CREATE OR REPLACE VIEW v_compscrap_input AS
SELECT 
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
  company_name_from_p as "companyName_fromP",
  company_linkedin_url_from_p as "companyLinkedinUrl_fromP",
  company_sales_url_from_p as "companySalesUrl_fromP",
  email,
  email_validation,
  validation_success,
  first_name_cleaned,
  last_name_cleaned
FROM leads
WHERE step_status->>'verification' = 'verified'
  AND step_status->>'compScrap' = 'pending';

CREATE OR REPLACE VIEW v_box1_input AS
SELECT 
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
  company_name_from_p as "companyName_fromP",
  company_linkedin_url_from_p as "companyLinkedinUrl_fromP",
  company_sales_url_from_p as "companySalesUrl_fromP",
  email,
  email_validation,
  validation_success,
  first_name_cleaned,
  last_name_cleaned,
  company_name,
  company_description,
  industry,
  employee_count,
  company_location,
  website,
  year_founded,
  specialties,
  phone,
  min_revenue,
  max_revenue,
  growth_6mth,
  growth_1yr,
  growth_2yr,
  company_timestamp_sn,
  company_timestamp_ln,
  linkedin_company_url,
  sales_navigator_company_url
FROM leads
WHERE step_status->>'compScrap' = 'scraped'
  AND step_status->>'box1' = 'pending';

CREATE OR REPLACE VIEW v_instantly_input AS
SELECT 
  lead_number as "LeadNumber",
  target_id as "TargetID",
  first_name_cleaned,
  last_name_cleaned,
  email,
  instantly_body1 as "body1",
  instantly_body2 as "body2",
  instantly_body3 as "body3",
  instantly_body4 as "body4"
FROM leads
WHERE step_status->>'box1' = 'hit'
  AND step_status->>'instantly' = 'pending';

DO $$
BEGIN
  RAISE NOTICE 'Migration 004 completed!';
  RAISE NOTICE 'Added timestamps for all steps';
  RAISE NOTICE 'Added storage field';
  RAISE NOTICE 'Created 4 input views: verification, compscrap, box1, instantly';
END $$;
