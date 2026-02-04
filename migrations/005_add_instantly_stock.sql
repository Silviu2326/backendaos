-- Migration: Add Instantly Stock status
-- Date: 2026-01-31
-- Description: Adds 'stock' status to instantly step for leads waiting to be sent

-- Update constraint to include 'stock' status
DROP CONSTRAINT IF EXISTS valid_instantly_status;
ALTER TABLE leads
  ADD CONSTRAINT valid_instantly_status CHECK (
    step_status->>'instantly' IN ('pending', 'stock', 'sent', 'replied', 'positive_reply', 'converted', 'bounced')
  );

-- Add timestamp for instantly_stock
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instantly_stock_at TIMESTAMP;

-- Create index for instantly stock leads
CREATE INDEX IF NOT EXISTS idx_leads_instantly_stock ON leads (step_status) 
WHERE step_status->>'instantly' = 'stock';

-- Create view for instantly stock input
CREATE OR REPLACE VIEW v_instantly_stock_input AS
SELECT 
  lead_number as "LeadNumber",
  target_id as "TargetID",
  first_name_cleaned,
  last_name_cleaned,
  email,
  instantly_body1 as "body1",
  instantly_body2 as "body2",
  instantly_body3 as "body3",
  instantly_body4 as "body4",
  company_name,
  company_description,
  industry,
  website
FROM leads
WHERE step_status->>'instantly' = 'stock';

-- Create view for instantly input (only pending, no longer includes stock)
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
WHERE step_status->>'instantly' = 'pending'
  AND step_status->>'box1' = 'hit';

DO $$
BEGIN
  RAISE NOTICE 'Migration 005 completed!';
  RAISE NOTICE 'Added stock status to instantly step';
  RAISE NOTICE 'Created instantly_stock input view';
END $$;
