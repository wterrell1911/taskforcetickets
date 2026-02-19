-- Migration: Add lead attribution columns to cases table
-- Purpose: Track marketing source for form submissions

ALTER TABLE cases ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gclid VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cases_utm_source ON cases(utm_source);
CREATE INDEX IF NOT EXISTS idx_cases_utm_medium ON cases(utm_medium);
CREATE INDEX IF NOT EXISTS idx_cases_device_type ON cases(device_type);

COMMENT ON COLUMN cases.utm_source IS 'Marketing source from UTM parameter';
COMMENT ON COLUMN cases.utm_medium IS 'Marketing medium from UTM parameter';
COMMENT ON COLUMN cases.utm_campaign IS 'Marketing campaign from UTM parameter';
COMMENT ON COLUMN cases.gclid IS 'Google Ads click ID';
COMMENT ON COLUMN cases.landing_page IS 'First page visitor landed on';
COMMENT ON COLUMN cases.referrer IS 'HTTP referrer URL';
COMMENT ON COLUMN cases.device_type IS 'Device type: mobile, desktop, or tablet';
