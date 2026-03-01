// Enforcement data from various sources
export type EnforcementSource = 'mpd' | 'shelby_county' | 'thp';

export interface EnforcementRecord {
  id: string;
  source: EnforcementSource;
  date: string; // ISO date
  time?: string;
  location: string;
  lat?: number;
  lng?: number;
  violationType: string;
  violationCategory: 'speed' | 'equipment' | 'registration' | 'license' | 'insurance' | 'other';
  agency: string;
  ward?: string;
  precinct?: string;
  demographics?: {
    age?: number;
    gender?: string;
    race?: string;
  };
  rawData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Manual entry batch for Shelby County / THP data
export interface ManualEntryBatch {
  id: string;
  source: 'shelby_county' | 'thp';
  dateRangeStart: string;
  dateRangeEnd: string;
  totalCitations: number;
  topViolations: {
    type: string;
    count: number;
  }[];
  agencyBreakdown?: {
    agency: string;
    count: number;
  }[];
  notes?: string;
  enteredBy: string;
  createdAt: string;
}

// Intake analytics derived from our submissions
export interface IntakeAnalytics {
  id: string;
  ticketId: string;
  location: string;
  zone: string; // Normalized zone/area name
  lat?: number;
  lng?: number;
  violationType: string;
  violationCategory: 'speed' | 'equipment' | 'registration' | 'license' | 'insurance' | 'other';
  courtDate: string;
  outcome?: 'pending' | 'dismissed' | 'reduced' | 'guilty' | 'refunded';
  price: number;
  createdAt: string;
}

// Zone analysis for market gap
export interface ZoneAnalysis {
  zone: string;
  enforcementVolume: number;
  intakeVolume: number;
  conversionRate: number;
  opportunityScore: number; // Higher = more opportunity
  trend: 'up' | 'down' | 'stable';
}

// Time series data point
export interface TrendDataPoint {
  date: string;
  count: number;
  source?: EnforcementSource;
  violationType?: string;
}

// Offense distribution comparison
export interface OffenseDistribution {
  category: string;
  enforcementCount: number;
  enforcementPercent: number;
  intakeCount: number;
  intakePercent: number;
  gap: number; // Positive = underrepresented in intake
}

// Memphis geographic zones (simplified)
export const MEMPHIS_ZONES = [
  'Downtown',
  'Midtown',
  'East Memphis',
  'Whitehaven',
  'Raleigh',
  'Frayser',
  'Cordova',
  'Bartlett',
  'Germantown',
  'Collierville',
  'Hickory Hill',
  'Orange Mound',
  'South Memphis',
  'North Memphis',
  'Westwood',
  'Parkway Village',
  'Oakhaven',
  'Airport Area',
  'Medical District',
  'University Area',
] as const;

export type MemphisZone = typeof MEMPHIS_ZONES[number];

// Dashboard filter state
export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  sources: EnforcementSource[];
  zones: string[];
  violationCategories: string[];
}
