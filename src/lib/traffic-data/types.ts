/**
 * Traffic Weather Report Types
 *
 * Schema for tracking Memphis citation data and generating reports
 */

export interface TrafficMetrics {
  id: string;
  week_start: string; // ISO date string (Monday)
  week_end: string; // ISO date string (Sunday)

  // Citation counts by type
  speeding_citations: number;
  red_light_citations: number;
  stop_sign_citations: number;
  reckless_driving_citations: number;
  no_insurance_citations: number;
  license_violations: number;
  other_citations: number;

  // Court metrics
  total_court_appearances: number;
  dismissal_rate: number; // percentage 0-100
  average_fine_amount: number; // in dollars

  // Enforcement data
  total_traffic_stops: number;
  dui_arrests: number;

  // TaskForce metrics
  taskforce_cases_filed: number;
  taskforce_dismissals: number;

  created_at: string;
  updated_at: string;
}

export interface EnforcementHotspot {
  id: string;
  week_start: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  citation_count: number;
  primary_violation_type: string;
  notes?: string;
}

export interface TrafficReport {
  id: string;
  week_start: string;
  week_end: string;

  // Generated content
  headline: string;
  summary: string;
  twitter_post: string;
  facebook_post: string;
  instagram_caption: string;
  blog_content: string;

  // Status
  status: 'draft' | 'published';
  published_at?: string;

  created_at: string;
  updated_at: string;
}

// Form input types
export interface TrafficMetricsInput {
  week_start: string;
  speeding_citations: number;
  red_light_citations: number;
  stop_sign_citations: number;
  reckless_driving_citations: number;
  no_insurance_citations: number;
  license_violations: number;
  other_citations: number;
  total_court_appearances: number;
  dismissal_rate: number;
  average_fine_amount: number;
  total_traffic_stops: number;
  dui_arrests: number;
  taskforce_cases_filed: number;
  taskforce_dismissals: number;
}

export interface HotspotInput {
  location_name: string;
  latitude?: number;
  longitude?: number;
  citation_count: number;
  primary_violation_type: string;
  notes?: string;
}

// Calculated metrics for display
export interface WeeklyStats {
  totalCitations: number;
  weekOverWeekChange: number; // percentage
  topViolationType: string;
  topViolationCount: number;
  dismissalRate: number;
  averageFine: number;
  hotspots: EnforcementHotspot[];
  taskforceSuccessRate: number;
}

export interface TrendData {
  week: string;
  totalCitations: number;
  dismissalRate: number;
}

// Violation type labels
export const VIOLATION_TYPES = {
  speeding: 'Speeding',
  red_light: 'Red Light',
  stop_sign: 'Stop Sign',
  reckless_driving: 'Reckless Driving',
  no_insurance: 'No Insurance',
  license: 'License Violations',
  other: 'Other',
} as const;

export type ViolationType = keyof typeof VIOLATION_TYPES;

// Common Memphis enforcement locations
export const COMMON_LOCATIONS = [
  'I-240 @ Poplar Ave',
  'I-40 @ Sam Cooper Blvd',
  'Poplar Ave @ Highland',
  'Union Ave @ McLean',
  'Walnut Grove @ Kirby Parkway',
  'Summer Ave @ Graham',
  'Winchester Rd @ Hickory Hill',
  'Elvis Presley Blvd @ Brooks Rd',
  'Airways Blvd @ Democrat',
  'Lamar Ave @ Park Ave',
  'Third Street @ Beale',
  'Madison Ave @ Cleveland',
  'Jackson Ave @ Watkins',
  'Chelsea Ave @ Thomas',
  'Stage Rd @ Bartlett Blvd',
] as const;
