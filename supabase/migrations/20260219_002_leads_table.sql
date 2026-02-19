-- Migration: Create leads table for centralized lead tracking
-- Purpose: Normalize leads from forms, calls, and chat into single table

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type VARCHAR(20) NOT NULL, -- 'form', 'call', 'chat'
  marketing_source VARCHAR(50), -- 'organic', 'paid', 'lsa', 'maps', 'direct', 'referral', 'social'
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT,
  practice_area VARCHAR(100) DEFAULT 'traffic_ticket',
  landing_page TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  gclid VARCHAR(255),
  call_duration INTEGER, -- seconds, for call leads
  call_recording_url TEXT, -- for call leads
  raw_payload JSONB, -- original webhook payload
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_source_type ON leads(source_type);
CREATE INDEX IF NOT EXISTS idx_leads_marketing_source ON leads(marketing_source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY "Service role can manage leads" 
  ON leads 
  FOR ALL 
  USING (auth.role() = 'service_role');

COMMENT ON TABLE leads IS 'Centralized lead tracking from all sources (forms, calls, chat)';
COMMENT ON COLUMN leads.source_type IS 'Origin of lead: form, call, or chat';
COMMENT ON COLUMN leads.marketing_source IS 'Traffic source: organic, paid, lsa, maps, direct, referral, social';
COMMENT ON COLUMN leads.call_duration IS 'Call duration in seconds (call leads only)';
COMMENT ON COLUMN leads.raw_payload IS 'Original webhook payload for debugging';
