/**
 * Court/Jurisdiction options for intake form
 *
 * Speed limits by jurisdiction determine eligibility thresholds
 */

export const COURT_OPTIONS = [
  { value: 'MEMPHIS_DIV_1', label: 'City of Memphis - Division 1' },
  { value: 'MEMPHIS_DIV_2', label: 'City of Memphis - Division 2' },
  { value: 'MEMPHIS_DIV_3', label: 'City of Memphis - Division 3' },
  { value: 'TN_HIGHWAY_PATROL', label: 'Tennessee Highway Patrol' },
  { value: 'SHELBY_COUNTY', label: 'Shelby County' }
] as const;

export type CourtJurisdiction = typeof COURT_OPTIONS[number]['value'];

export const SPEED_LIMITS_BY_JURISDICTION: Record<CourtJurisdiction, { maxOver: number; label: string }> = {
  'MEMPHIS_DIV_1': { maxOver: 15, label: 'City of Memphis - Division 1' },
  'MEMPHIS_DIV_2': { maxOver: 15, label: 'City of Memphis - Division 2' },
  'MEMPHIS_DIV_3': { maxOver: 10, label: 'City of Memphis - Division 3' },
  'TN_HIGHWAY_PATROL': { maxOver: 15, label: 'Tennessee Highway Patrol' },
  'SHELBY_COUNTY': { maxOver: 15, label: 'Shelby County' }
};
