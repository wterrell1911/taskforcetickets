/**
 * Address Validation Service using SmartyStreets (Smarty) API
 * Provides address autocomplete and validation with county information
 * 
 * APIs: US Autocomplete Pro + US Street Address
 * Docs: https://www.smarty.com/docs
 * 
 * Requires SMARTY_AUTH_ID and SMARTY_AUTH_TOKEN in environment
 */

export interface AddressSuggestion {
  streetLine: string;
  secondary?: string;
  city: string;
  state: string;
  zipCode: string;
  entries?: number; // For multi-unit addresses
}

export interface ValidatedAddress {
  // Input
  originalAddress: string;
  
  // Validated components
  deliveryLine1: string;
  deliveryLine2?: string;
  lastLine: string;
  
  // Components
  primaryNumber: string;
  streetName: string;
  streetSuffix?: string;
  streetPreDirection?: string;
  streetPostDirection?: string;
  secondaryDesignator?: string;
  secondaryNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  plus4Code?: string;
  
  // Geographic info (for court routing)
  county: string;
  countyFips?: string;
  latitude?: number;
  longitude?: number;
  
  // Metadata
  deliveryPointBarcode?: string;
  recordType?: 'S' | 'R' | 'P' | 'G' | 'H' | 'F'; // Street, Rural Route, PO Box, etc.
  valid: boolean;
  vacant?: boolean;
  dpvConfirmation?: 'Y' | 'N' | 'S' | 'D'; // Yes, No, Secondary missing, Secondary invalid
}

export interface AddressValidationResult {
  valid: boolean;
  address?: ValidatedAddress;
  error?: string;
  errorCode?: 'INVALID_ADDRESS' | 'NOT_FOUND' | 'API_ERROR' | 'MISSING_UNIT' | 'VACANT';
  suggestions?: AddressSuggestion[];
}

export interface AutocompleteResult {
  suggestions: AddressSuggestion[];
  error?: string;
}

/**
 * Check if Smarty credentials are configured
 */
function hasSmartyCredentials(): boolean {
  return !!(process.env.SMARTY_AUTH_ID && process.env.SMARTY_AUTH_TOKEN);
}

/**
 * Get Smarty API credentials
 */
function getSmartyCredentials(): { authId: string; authToken: string } | null {
  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;
  
  if (!authId || !authToken) {
    return null;
  }
  
  return { authId, authToken };
}

/**
 * Get address autocomplete suggestions
 * Uses US Autocomplete Pro API
 */
export async function getAddressSuggestions(
  searchText: string,
  options?: {
    includeOnlyStates?: string[]; // e.g., ['TN', 'AR', 'MS']
    maxResults?: number;
  }
): Promise<AutocompleteResult> {
  const creds = getSmartyCredentials();
  
  if (!creds) {
    console.warn('Smarty credentials not configured');
    return { suggestions: [], error: 'Address autocomplete not available' };
  }

  if (!searchText || searchText.length < 3) {
    return { suggestions: [] };
  }

  try {
    const url = new URL('https://us-autocomplete-pro.api.smarty.com/lookup');
    url.searchParams.set('auth-id', creds.authId);
    url.searchParams.set('auth-token', creds.authToken);
    url.searchParams.set('search', searchText);
    url.searchParams.set('max_results', String(options?.maxResults || 10));
    
    // Filter to specific states if requested (for court routing)
    if (options?.includeOnlyStates?.length) {
      url.searchParams.set('include_only_states', options.includeOnlyStates.join(';'));
    }
    
    // Include secondary suggestions for apartments/units
    url.searchParams.set('source', 'all');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://taskforcetickets.com',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`Smarty API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      return { suggestions: [] };
    }

    const suggestions: AddressSuggestion[] = data.suggestions.map((s: Record<string, unknown>) => ({
      streetLine: s.street_line as string || '',
      secondary: s.secondary as string || undefined,
      city: s.city as string || '',
      state: s.state as string || '',
      zipCode: s.zipcode as string || '',
      entries: s.entries as number || undefined,
    }));

    return { suggestions };
  } catch (error) {
    console.error('Smarty autocomplete error:', error);
    return { suggestions: [], error: 'Address lookup temporarily unavailable' };
  }
}

/**
 * Validate a full address and get county information
 * Uses US Street Address API
 */
export async function validateAddress(
  street: string,
  city?: string,
  state?: string,
  zipCode?: string
): Promise<AddressValidationResult> {
  const creds = getSmartyCredentials();
  
  if (!creds) {
    console.warn('Smarty credentials not configured');
    // Return basic success without validation
    return {
      valid: true,
      address: {
        originalAddress: [street, city, state, zipCode].filter(Boolean).join(', '),
        deliveryLine1: street,
        lastLine: [city, state, zipCode].filter(Boolean).join(', '),
        primaryNumber: '',
        streetName: street,
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        county: 'Unknown',
        valid: true,
      },
    };
  }

  try {
    const url = new URL('https://us-street.api.smarty.com/street-address');
    url.searchParams.set('auth-id', creds.authId);
    url.searchParams.set('auth-token', creds.authToken);
    url.searchParams.set('street', street);
    if (city) url.searchParams.set('city', city);
    if (state) url.searchParams.set('state', state);
    if (zipCode) url.searchParams.set('zipcode', zipCode);
    url.searchParams.set('candidates', '1');
    url.searchParams.set('match', 'enhanced'); // More lenient matching

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://taskforcetickets.com',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Smarty API error: ${response.status}`);
    }

    const data = await response.json();

    // No results = invalid address
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        valid: false,
        error: 'Address not found. Please check the address and try again.',
        errorCode: 'NOT_FOUND',
      };
    }

    const result = data[0];
    const components = result.components || {};
    const metadata = result.metadata || {};
    const analysis = result.analysis || {};

    // Check DPV (Delivery Point Validation)
    const dpvMatch = analysis.dpv_match_code;
    
    // Check for missing secondary (apartment/unit) info
    if (dpvMatch === 'S') {
      return {
        valid: false,
        error: 'This address requires an apartment/unit number',
        errorCode: 'MISSING_UNIT',
      };
    }

    // Check if vacant
    if (analysis.dpv_vacant === 'Y') {
      // Still valid, but flag it
      console.warn('Address marked as vacant:', street);
    }

    const validatedAddress: ValidatedAddress = {
      originalAddress: [street, city, state, zipCode].filter(Boolean).join(', '),
      deliveryLine1: result.delivery_line_1 || '',
      deliveryLine2: result.delivery_line_2 || undefined,
      lastLine: result.last_line || '',
      primaryNumber: components.primary_number || '',
      streetName: components.street_name || '',
      streetSuffix: components.street_suffix || undefined,
      streetPreDirection: components.street_predirection || undefined,
      streetPostDirection: components.street_postdirection || undefined,
      secondaryDesignator: components.secondary_designator || undefined,
      secondaryNumber: components.secondary_number || undefined,
      city: components.city_name || city || '',
      state: components.state_abbreviation || state || '',
      zipCode: components.zipcode || zipCode || '',
      plus4Code: components.plus4_code || undefined,
      county: metadata.county_name || 'Unknown',
      countyFips: metadata.county_fips || undefined,
      latitude: metadata.latitude ? parseFloat(metadata.latitude) : undefined,
      longitude: metadata.longitude ? parseFloat(metadata.longitude) : undefined,
      deliveryPointBarcode: metadata.delivery_point_barcode || undefined,
      recordType: metadata.record_type || undefined,
      valid: dpvMatch === 'Y' || dpvMatch === 'D', // Y = confirmed, D = secondary not required
      vacant: analysis.dpv_vacant === 'Y',
      dpvConfirmation: dpvMatch,
    };

    return {
      valid: true,
      address: validatedAddress,
    };
  } catch (error) {
    console.error('Smarty validation error:', error);
    
    // On API error, allow form to proceed but log it
    return {
      valid: true,
      address: {
        originalAddress: [street, city, state, zipCode].filter(Boolean).join(', '),
        deliveryLine1: street,
        lastLine: [city, state, zipCode].filter(Boolean).join(', '),
        primaryNumber: '',
        streetName: street,
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        county: 'Unknown',
        valid: true,
      },
      error: 'Address validation temporarily unavailable',
      errorCode: 'API_ERROR',
    };
  }
}

/**
 * Parse a single-line address into components
 */
export function parseAddressLine(fullAddress: string): {
  street: string;
  city?: string;
  state?: string;
  zipCode?: string;
} {
  // Simple parser - split by comma
  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const stateZip = lastPart.split(' ').filter(Boolean);
    
    return {
      street: parts[0],
      city: parts[1],
      state: stateZip[0],
      zipCode: stateZip[1],
    };
  }
  
  return { street: fullAddress };
}

/**
 * Format validated address for display
 */
export function formatValidatedAddress(address: ValidatedAddress): string {
  const lines = [address.deliveryLine1];
  if (address.deliveryLine2) {
    lines.push(address.deliveryLine2);
  }
  lines.push(address.lastLine);
  return lines.join('\n');
}

/**
 * Get formatted address with county
 */
export function formatAddressWithCounty(address: ValidatedAddress): string {
  return `${formatValidatedAddress(address)}\n${address.county} County`;
}
