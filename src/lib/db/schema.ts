// Database schema definitions
// Using file-based JSON storage for development
// Can be migrated to PostgreSQL/MySQL for production

import { EnforcementRecord, ManualEntryBatch, IntakeAnalytics } from '@/types/admin';
import { MPDTrafficStop } from '@/lib/csv-import';

export interface Database {
  enforcement_records: EnforcementRecord[];
  manual_entry_batches: ManualEntryBatch[];
  intake_analytics: IntakeAnalytics[];
  sync_log: SyncLogEntry[];
  import_log: ImportLogEntry[];
}

export interface SyncLogEntry {
  id: string;
  source: string;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface ImportLogEntry {
  id: string;
  filename: string;
  recordCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  importedAt: string;
  status: 'completed' | 'failed';
  error?: string;
}

// Traffic stops are stored in a separate file due to size
export interface TrafficStopsDatabase {
  stops: MPDTrafficStop[];
  lastUpdated: string;
  totalRecords: number;
  stats: {
    byPrecinct: Record<string, number>;
    byZipCode: Record<string, number>;
    byYear: Record<number, number>;
  };
}

// SQL schema for reference (PostgreSQL)
export const SQL_SCHEMA = `
-- Enforcement data from all sources
CREATE TABLE enforcement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(20) NOT NULL, -- 'mpd', 'shelby_county', 'thp'
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  violation_type VARCHAR(100),
  violation_category VARCHAR(50),
  agency VARCHAR(100),
  ward VARCHAR(20),
  precinct VARCHAR(20),
  demographics JSONB,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enforcement_date ON enforcement_records(date);
CREATE INDEX idx_enforcement_source ON enforcement_records(source);
CREATE INDEX idx_enforcement_location ON enforcement_records(lat, lng);
CREATE INDEX idx_enforcement_zone ON enforcement_records(ward, precinct);

-- Manual entry batches for aggregate data
CREATE TABLE manual_entry_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(20) NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  total_citations INTEGER NOT NULL,
  top_violations JSONB,
  agency_breakdown JSONB,
  notes TEXT,
  entered_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics derived from our intake submissions
CREATE TABLE intake_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(100) UNIQUE,
  location TEXT,
  zone VARCHAR(50),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  violation_type VARCHAR(100),
  violation_category VARCHAR(50),
  court_date DATE,
  outcome VARCHAR(20),
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intake_zone ON intake_analytics(zone);
CREATE INDEX idx_intake_date ON intake_analytics(court_date);
CREATE INDEX idx_intake_created ON intake_analytics(created_at);

-- Sync log for API fetches
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  records_processed INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'running',
  error TEXT
);

-- Materialized view for zone analysis
CREATE MATERIALIZED VIEW zone_analysis AS
SELECT
  COALESCE(e.zone, i.zone) as zone,
  COALESCE(e.enforcement_count, 0) as enforcement_volume,
  COALESCE(i.intake_count, 0) as intake_volume,
  CASE
    WHEN COALESCE(e.enforcement_count, 0) = 0 THEN 0
    ELSE ROUND(COALESCE(i.intake_count, 0)::DECIMAL / e.enforcement_count * 100, 2)
  END as conversion_rate
FROM (
  SELECT ward as zone, COUNT(*) as enforcement_count
  FROM enforcement_records
  WHERE date >= NOW() - INTERVAL '90 days'
  GROUP BY ward
) e
FULL OUTER JOIN (
  SELECT zone, COUNT(*) as intake_count
  FROM intake_analytics
  WHERE created_at >= NOW() - INTERVAL '90 days'
  GROUP BY zone
) i ON e.zone = i.zone;
`;
