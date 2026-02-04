-- Migration 006: Add LinkedIn profile fields to leads table
-- Add all LinkedIn-related fields for comprehensive lead data

ALTER TABLE leads ADD COLUMN IF NOT EXISTS profile_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS regular_company_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title_description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_location TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duration_in_role TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duration_in_company TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS past_experience_company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS past_experience_company_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS past_experience_company_title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS past_experience_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS past_experience_duration TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS connection_degree TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS shared_connections_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vmid TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_open_link BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS query TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS default_profile_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_account_profile_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_account_profile_name TEXT;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_profile_url ON leads(linkedin_profile_url);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location);

-- Add foreign key for campaigns if not exists
-- ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS fk_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
