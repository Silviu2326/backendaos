da-- Migration 007: Add LeadNumber and TargetID columns
-- These fields are automatically populated during import

-- Add LeadNumber (unique identifier for the lead within a campaign)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_number INTEGER;

-- Add TargetID (reference to the target/source)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS target_id VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_campaign_lead_number ON leads(campaign_id, lead_number);
CREATE INDEX IF NOT EXISTS idx_leads_target_id ON leads(target_id);
