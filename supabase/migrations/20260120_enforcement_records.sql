-- Enforcement Records Table
-- Stores traffic stop data synced from Memphis Data Hub

CREATE TABLE IF NOT EXISTS enforcement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL DEFAULT 'mpd',
  date DATE NOT NULL,
  time VARCHAR(10),
  location TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  violation_type TEXT,
  violation_category VARCHAR(50),
  agency VARCHAR(100),
  ward VARCHAR(50),
  precinct VARCHAR(50),
  event_number VARCHAR(100),
  disposition_code VARCHAR(100),
  zip_code VARCHAR(10),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_enforcement_records_date ON enforcement_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_enforcement_records_source ON enforcement_records(source);
CREATE INDEX IF NOT EXISTS idx_enforcement_records_precinct ON enforcement_records(precinct);
CREATE INDEX IF NOT EXISTS idx_enforcement_records_violation_category ON enforcement_records(violation_category);
CREATE INDEX IF NOT EXISTS idx_enforcement_records_zip_code ON enforcement_records(zip_code);

-- Composite index for weekly grouping
CREATE INDEX IF NOT EXISTS idx_enforcement_records_date_source ON enforcement_records(date, source);

-- Enable RLS
ALTER TABLE enforcement_records ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for traffic report)
CREATE POLICY "public_read_enforcement" ON enforcement_records FOR SELECT USING (true);

-- Sync log table to track sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'running',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON sync_logs(source);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_sync_logs" ON sync_logs FOR SELECT USING (true);
