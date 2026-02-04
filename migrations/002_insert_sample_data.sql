-- Migration: Insert sample data for testing
-- Date: 2026-01-31
-- Description: Inserts sample leads for testing the dashboard

-- Insert sample leads with different statuses
INSERT INTO leads (
  lead_number,
  target_id,
  first_name,
  last_name,
  person_title,
  email,
  company_name_from_p,
  campaign_id,
  step_status
) VALUES
  -- Leads pending verification
  ('LEAD-001', 'TGT-001', 'John', 'Doe', 'CEO', 'john.doe@techcorp.com', 'TechCorp Inc', 'default',
   '{"export": true, "verification": "pending", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-002', 'TGT-002', 'Jane', 'Smith', 'CTO', 'jane.smith@innovate.com', 'Innovate Solutions', 'default',
   '{"export": true, "verification": "pending", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-003', 'TGT-003', 'Bob', 'Johnson', 'VP Sales', 'bob.j@salesforce.com', 'SalesPro LLC', 'default',
   '{"export": true, "verification": "pending", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),

  -- Leads sent to verification
  ('LEAD-004', 'TGT-004', 'Alice', 'Williams', 'Marketing Director', 'alice.w@marketing.io', 'Marketing.io', 'default',
   '{"export": true, "verification": "sent", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-005', 'TGT-005', 'Charlie', 'Brown', 'Product Manager', 'charlie@product.co', 'Product.co', 'default',
   '{"export": true, "verification": "sent", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),

  -- Verified leads
  ('LEAD-006', 'TGT-006', 'Diana', 'Davis', 'CFO', 'diana.d@finance.com', 'FinanceHub', 'default',
   '{"export": true, "verification": "verified", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-007', 'TGT-007', 'Edward', 'Miller', 'COO', 'edward.m@operations.com', 'OpsCo', 'default',
   '{"export": true, "verification": "verified", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-008', 'TGT-008', 'Fiona', 'Garcia', 'HR Director', 'fiona@hrtech.com', 'HRTech Solutions', 'default',
   '{"export": true, "verification": "verified", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),

  -- Leads sent to CompScrap
  ('LEAD-009', 'TGT-009', 'George', 'Martinez', 'Tech Lead', 'george@devops.io', 'DevOps.io', 'default',
   '{"export": true, "verification": "verified", "compScrap": "sent", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-010', 'TGT-010', 'Hannah', 'Lopez', 'Data Scientist', 'hannah@analytics.com', 'Analytics Corp', 'default',
   '{"export": true, "verification": "verified", "compScrap": "sent", "box1": "pending", "instantly": "pending"}'),

  -- Scraped leads (with compUrl)
  ('LEAD-011', 'TGT-011', 'Ivan', 'Hernandez', 'Engineering Manager', 'ivan@engineering.co', 'Engineering Co', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-012', 'TGT-012', 'Julia', 'Gonzalez', 'Design Lead', 'julia@design.studio', 'Design Studio', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "pending", "instantly": "pending"}'),

  -- Leads sent to Box1
  ('LEAD-013', 'TGT-013', 'Kevin', 'Wilson', 'Business Dev', 'kevin@bizdev.com', 'BizDev Inc', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "sent", "instantly": "pending"}'),
  ('LEAD-014', 'TGT-014', 'Laura', 'Anderson', 'Growth Manager', 'laura@growth.io', 'Growth.io', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "sent", "instantly": "pending"}'),

  -- FIT leads
  ('LEAD-015', 'TGT-015', 'Michael', 'Thomas', 'Founder', 'michael@startup.com', 'Startup Inc', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "fit", "instantly": "pending"}'),
  ('LEAD-016', 'TGT-016', 'Nancy', 'Taylor', 'CEO', 'nancy@ceo.com', 'CEO Solutions', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "fit", "instantly": "pending"}'),

  -- HIT leads (ready for Instantly)
  ('LEAD-017', 'TGT-017', 'Oscar', 'Moore', 'VP Marketing', 'oscar@vpm.com', 'VP Marketing Co', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "pending"}'),
  ('LEAD-018', 'TGT-018', 'Patricia', 'Jackson', 'Sales Director', 'patricia@sales.com', 'Sales Direct', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "pending"}'),

  -- DROP leads
  ('LEAD-019', 'TGT-019', 'Quinn', 'White', 'Manager', 'quinn@manager.com', 'Manager Corp', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "drop", "instantly": "pending"}'),
  ('LEAD-020', 'TGT-020', 'Rachel', 'Harris', 'Analyst', 'rachel@analyst.com', 'Analyst Inc', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "drop", "instantly": "pending"}'),

  -- Leads sent to Instantly
  ('LEAD-021', 'TGT-021', 'Steve', 'Martin', 'VP Sales', 'steve@vpsales.com', 'VP Sales LLC', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "sent"}'),
  ('LEAD-022', 'TGT-022', 'Tina', 'Lee', 'CMO', 'tina@cmo.com', 'CMO Group', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "sent"}'),

  -- Replied leads
  ('LEAD-023', 'TGT-023', 'Uma', 'Walker', 'Director', 'uma@director.com', 'Director Co', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "replied"}'),

  -- Positive reply leads
  ('LEAD-024', 'TGT-024', 'Victor', 'Hall', 'VP Product', 'victor@vpproduct.com', 'VP Product Inc', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "positive_reply"}'),
  ('LEAD-025', 'TGT-025', 'Wendy', 'Allen', 'COO', 'wendy@coo.com', 'COO Solutions', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "positive_reply"}'),

  -- Converted leads (final success)
  ('LEAD-026', 'TGT-026', 'Xavier', 'Young', 'CEO', 'xavier@ceosuccess.com', 'CEO Success Co', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "converted"}'),
  ('LEAD-027', 'TGT-027', 'Yolanda', 'King', 'Founder', 'yolanda@founder.com', 'Founder Ventures', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "hit", "instantly": "converted"}'),

  -- Failed at different stages
  ('LEAD-028', 'TGT-028', 'Zachary', 'Wright', 'Manager', 'zachary@failed.com', 'Failed Corp', 'default',
   '{"export": true, "verification": "failed", "compScrap": "pending", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-029', 'TGT-029', 'Amy', 'Scott', 'Coordinator', 'amy@coord.com', 'Coord Inc', 'default',
   '{"export": true, "verification": "verified", "compScrap": "failed", "box1": "pending", "instantly": "pending"}'),
  ('LEAD-030', 'TGT-030', 'Brian', 'Green', 'Associate', 'brian@assoc.com', 'Assoc LLC', 'default',
   '{"export": true, "verification": "verified", "compScrap": "scraped", "box1": "failed", "instantly": "pending"}')
ON CONFLICT (lead_number) DO NOTHING;

-- Update some leads with company URLs
UPDATE leads
SET comp_url = 'https://www.engineering.co'
WHERE lead_number IN ('LEAD-011', 'LEAD-012', 'LEAD-013', 'LEAD-014', 'LEAD-015', 'LEAD-016', 'LEAD-017', 'LEAD-018', 'LEAD-021', 'LEAD-022', 'LEAD-023', 'LEAD-024', 'LEAD-025', 'LEAD-026', 'LEAD-027');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE '30 sample leads created with various statuses';
  RAISE NOTICE 'Total Leads: 30';
  RAISE NOTICE 'Pending Verification: 3';
  RAISE NOTICE 'Verified: 8';
  RAISE NOTICE 'Scraped: 4';
  RAISE NOTICE 'FIT: 2, HIT: 2, DROP: 2';
  RAISE NOTICE 'Converted: 2';
END $$;
