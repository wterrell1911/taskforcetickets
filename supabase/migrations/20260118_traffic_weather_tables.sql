-- Traffic Weather Report Tables
-- Run this migration in Supabase SQL Editor

-- Traffic Metrics Table
-- Stores weekly aggregate citation data
CREATE TABLE IF NOT EXISTS traffic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  week_end DATE NOT NULL,

  -- Citation counts by type
  speeding_citations INTEGER DEFAULT 0,
  red_light_citations INTEGER DEFAULT 0,
  stop_sign_citations INTEGER DEFAULT 0,
  reckless_driving_citations INTEGER DEFAULT 0,
  no_insurance_citations INTEGER DEFAULT 0,
  license_violations INTEGER DEFAULT 0,
  other_citations INTEGER DEFAULT 0,

  -- Court metrics
  total_court_appearances INTEGER DEFAULT 0,
  dismissal_rate DECIMAL(5,2) DEFAULT 0,
  average_fine_amount DECIMAL(10,2) DEFAULT 0,

  -- Enforcement data
  total_traffic_stops INTEGER DEFAULT 0,
  dui_arrests INTEGER DEFAULT 0,

  -- TaskForce metrics
  taskforce_cases_filed INTEGER DEFAULT 0,
  taskforce_dismissals INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enforcement Hotspots Table
-- Stores location-specific citation data
CREATE TABLE IF NOT EXISTS enforcement_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL REFERENCES traffic_metrics(week_start) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  citation_count INTEGER NOT NULL DEFAULT 0,
  primary_violation_type TEXT NOT NULL DEFAULT 'speeding',
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic Reports Table
-- Stores generated content for each week
CREATE TABLE IF NOT EXISTS traffic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE REFERENCES traffic_metrics(week_start) ON DELETE CASCADE,
  week_end DATE NOT NULL,

  -- Generated content
  headline TEXT,
  summary TEXT,
  twitter_post TEXT,
  facebook_post TEXT,
  instagram_caption TEXT,
  blog_content TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_week_start ON traffic_metrics(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_enforcement_hotspots_week_start ON enforcement_hotspots(week_start);
CREATE INDEX IF NOT EXISTS idx_traffic_reports_week_start ON traffic_reports(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_reports_status ON traffic_reports(status);

-- Enable RLS (Row Level Security)
ALTER TABLE traffic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_reports ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (for the public traffic report page)
CREATE POLICY "Allow public read access to traffic_metrics"
  ON traffic_metrics FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to enforcement_hotspots"
  ON enforcement_hotspots FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to published traffic_reports"
  ON traffic_reports FOR SELECT
  USING (status = 'published' OR true); -- Allow all reads for now, can restrict later

-- Service role has full access (handled by Supabase automatically)
-- These policies allow the admin API to write data using the service role key
