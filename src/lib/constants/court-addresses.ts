/**
 * Court Addresses by Jurisdiction
 * Used for calendar invites and case management
 */

export interface CourtInfo {
  name: string;
  address: string;
  phone?: string;
}

export const COURT_ADDRESSES: Record<string, CourtInfo> = {
  'MEMPHIS_DIV_1': {
    name: 'Memphis City Court - Division 1',
    address: '201 Poplar Ave, Memphis, TN 38103',
    phone: '(901) 636-3700',
  },
  'MEMPHIS_DIV_2': {
    name: 'Memphis City Court - Division 2',
    address: '201 Poplar Ave, Memphis, TN 38103',
    phone: '(901) 636-3700',
  },
  'MEMPHIS_DIV_3': {
    name: 'Memphis City Court - Division 3',
    address: '201 Poplar Ave, Memphis, TN 38103',
    phone: '(901) 636-3700',
  },
  'SHELBY_COUNTY': {
    name: 'Shelby County General Sessions Court',
    address: '140 Adams Ave, Memphis, TN 38103',
    phone: '(901) 222-3200',
  },
  'TN_HIGHWAY_PATROL': {
    name: 'Tennessee Highway Patrol / General Sessions',
    address: '140 Adams Ave, Memphis, TN 38103',
    phone: '(901) 222-3200',
  },
};

/**
 * Get court info by jurisdiction key
 * Falls back to a generic Memphis court if jurisdiction not found
 */
export function getCourtInfo(jurisdiction: string | null | undefined): CourtInfo {
  if (!jurisdiction) {
    return {
      name: 'Memphis Area Court',
      address: '201 Poplar Ave, Memphis, TN 38103',
    };
  }

  // Try exact match first
  if (COURT_ADDRESSES[jurisdiction]) {
    return COURT_ADDRESSES[jurisdiction];
  }

  // Try case-insensitive match
  const normalizedKey = jurisdiction.toUpperCase().replace(/\s+/g, '_');
  if (COURT_ADDRESSES[normalizedKey]) {
    return COURT_ADDRESSES[normalizedKey];
  }

  // Check if jurisdiction contains key phrases
  const lowerJurisdiction = jurisdiction.toLowerCase();
  if (lowerJurisdiction.includes('division 1') || lowerJurisdiction.includes('div 1')) {
    return COURT_ADDRESSES['MEMPHIS_DIV_1'];
  }
  if (lowerJurisdiction.includes('division 2') || lowerJurisdiction.includes('div 2')) {
    return COURT_ADDRESSES['MEMPHIS_DIV_2'];
  }
  if (lowerJurisdiction.includes('division 3') || lowerJurisdiction.includes('div 3')) {
    return COURT_ADDRESSES['MEMPHIS_DIV_3'];
  }
  if (lowerJurisdiction.includes('shelby')) {
    return COURT_ADDRESSES['SHELBY_COUNTY'];
  }
  if (lowerJurisdiction.includes('highway') || lowerJurisdiction.includes('thp')) {
    return COURT_ADDRESSES['TN_HIGHWAY_PATROL'];
  }

  // Default fallback
  return {
    name: jurisdiction,
    address: '201 Poplar Ave, Memphis, TN 38103',
  };
}
