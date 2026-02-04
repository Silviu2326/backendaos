-- Migration: Create leads tables
-- Date: 2026-01-31
-- Description: Creates the leads table and lead_status_history table for the dashboard

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  -- Primary Keys
  lead_number VARCHAR(50) PRIMARY KEY,
  target_id VARCHAR(100),

  -- Personal Information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  person_title VARCHAR(255),
  person_title_description TEXT,
  person_summary TEXT,
  person_location VARCHAR(255),
  duration_in_role VARCHAR(100),
  duration_in_company VARCHAR(100),
  person_timestamp TIMESTAMP,
  person_linkedin_url TEXT,
  person_sales_url TEXT,

  -- Company Information (from prospect)
  company_name_from_p VARCHAR(255),
  company_linkedin_url_from_p TEXT,
  company_sales_url_from_p TEXT,

  -- Email Data
  email VARCHAR(255) NOT NULL,
  email_validation VARCHAR(50),
  validation_success VARCHAR(50),
  first_name_cleaned VARCHAR(255),
  last_name_cleaned VARCHAR(255),

  -- Company Data (from scraping)
  company_name VARCHAR(255),
  company_description TEXT,
  industry VARCHAR(255),
  employee_count VARCHAR(50),
  company_location VARCHAR(255),
  website TEXT,
  year_founded VARCHAR(4),
  specialties TEXT,
  phone VARCHAR(50),
  min_revenue VARCHAR(50),
  max_revenue VARCHAR(50),
  growth_6mth VARCHAR(50),
  growth_1yr VARCHAR(50),
  growth_2yr VARCHAR(50),
  linkedin_company_url TEXT,
  comp_url TEXT,

  -- Pipeline Status (JSONB for flexibility)
  step_status JSONB NOT NULL DEFAULT '{
    "export": true,
    "verification": "pending",
    "compScrap": "pending",
    "box1": "pending",
    "instantly": "pending"
  }'::jsonb,

  -- Instantly Data
  instantly_body1 TEXT,
  instantly_body2 TEXT,
  instantly_body3 TEXT,
  instantly_body4 TEXT,
  instantly_response TEXT,
  instantly_conversion BOOLEAN DEFAULT false,

  -- Box1 Outputs (multiple variations)
  box1_outputs JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  campaign_id VARCHAR(100),

  -- Constraints
  CONSTRAINT valid_verification_status CHECK (
    step_status->>'verification' IN ('pending', 'sent', 'verified', 'failed')
  ),
  CONSTRAINT valid_comp_scrap_status CHECK (
    step_status->>'compScrap' IN ('pending', 'sent', 'scraped', 'failed')
  ),
  CONSTRAINT valid_box1_status CHECK (
    step_status->>'box1' IN ('pending', 'sent', 'fit', 'drop', 'no_fit', 'hit', 'failed')
  ),
  CONSTRAINT valid_instantly_status CHECK (
    step_status->>'instantly' IN ('pending', 'sent', 'replied', 'positive_reply', 'converted', 'bounced')
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_verification_status ON leads ((step_status->>'verification'));
CREATE INDEX IF NOT EXISTS idx_leads_comp_scrap_status ON leads ((step_status->>'compScrap'));
CREATE INDEX IF NOT EXISTS idx_leads_box1_status ON leads ((step_status->>'box1'));
CREATE INDEX IF NOT EXISTS idx_leads_instantly_status ON leads ((step_status->>'instantly'));
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads (campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_comp_url ON leads (comp_url) WHERE comp_url IS NOT NULL;

-- Create lead status history table for audit trail
CREATE TABLE IF NOT EXISTS lead_status_history (
  id SERIAL PRIMARY KEY,
  lead_number VARCHAR(50) REFERENCES leads(lead_number) ON DELETE CASCADE,
  step VARCHAR(50) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_history_lead_number ON lead_status_history (lead_number);
CREATE INDEX IF NOT EXISTS idx_history_step ON lead_status_history (step);
CREATE INDEX IF NOT EXISTS idx_history_changed_at ON lead_status_history (changed_at DESC);

-- Create campaigns table (optional)
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB
);

-- Add foreign key constraint for campaign_id in leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaign'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT fk_campaign
      FOREIGN KEY (campaign_id)
      REFERENCES campaigns(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Insert sample campaign
INSERT INTO campaigns (id, name, description, status)
VALUES ('default', 'Default Campaign', 'Default campaign for all leads', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: leads, lead_status_history, campaigns';
  RAISE NOTICE 'Indexes created: 8 indexes on leads, 3 indexes on lead_status_history';
END $$;
