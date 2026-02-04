-- Migration: Create api_keys table
-- Date: 2026-01-31
-- Description: Stores API keys for Gemini, Perplexity, AnymailFinder, etc.

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    
    -- Key identification
    provider VARCHAR(50) NOT NULL,  -- 'gemini', 'perplexity', 'anymailfinder'
    key_name VARCHAR(255),          -- User-provided name (optional)
    
    -- The API key (encrypted in production, plain here for demo)
    api_key TEXT NOT NULL,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    -- Gemini-specific fields
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 1000,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    
    -- Constraints
    CONSTRAINT unique_provider_key UNIQUE (provider, key_name)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_enabled ON api_keys(is_enabled);

-- Insert/update functions
CREATE OR REPLACE FUNCTION upsert_api_key(
    p_provider VARCHAR,
    p_key_name VARCHAR,
    p_api_key TEXT,
    p_is_enabled BOOLEAN,
    p_usage_limit INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO api_keys (provider, key_name, api_key, is_enabled, usage_limit)
    VALUES (p_provider, p_key_name, p_api_key, p_is_enabled, p_usage_limit)
    ON CONFLICT (provider, key_name)
    DO UPDATE SET
        api_key = p_api_key,
        is_enabled = p_is_enabled,
        usage_limit = p_usage_limit,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(p_id INTEGER) RETURNS VOID AS $$
BEGIN
    UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next gemini key (round-robin)
CREATE OR REPLACE FUNCTION get_next_gemini_key() RETURNS TABLE(id INTEGER, api_key TEXT, usage_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT id, api_key, usage_count
    FROM api_keys
    WHERE provider = 'gemini' AND is_enabled = true
    ORDER BY usage_count ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed!';
    RAISE NOTICE 'Table created: api_keys';
END $$;
