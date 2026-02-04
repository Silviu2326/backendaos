-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    lead_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Comment on table
COMMENT ON TABLE campaigns IS 'Stores campaign data for lead management';
