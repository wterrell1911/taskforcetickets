/**
 * Phone Validation Service using Numverify API
 * Validates phone numbers and detects line type (mobile/landline)
 * 
 * API: https://numverify.com
 * Requires API key for validation
 */

export type LineType = 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';

export interface PhoneValidationResult {
  valid: boolean;
  phone: string;
  formatted?: string;
  countryCode?: string;
  countryName?: string;
  location?: string;
  carrier?: string;
  lineType?: LineType;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'INVALID_NUMBER' | 'API_ERROR' | 'NOT_US';
}

/**
 * Clean phone number to digits only
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Basic US phone format validation
 */
function isValidUSPhoneFormat(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  // Accept 10 digits or 11 digits starting with 1
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

/**
 * Format phone for display
 */
function formatPhone(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Normalize phone to E.164 format for API
 */
function normalizeToE164(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 10) {
    return `1${cleaned}`;
  }
  return cleaned;
}

/**
 * Validate phone using Numverify API
 * Falls back to local validation if API fails or no key
 */
export async function validatePhone(phone: string): Promise<PhoneValidationResult> {
  const cleaned = cleanPhoneNumber(phone);
  const formatted = formatPhone(phone);

  // Basic format validation
  if (!isValidUSPhoneFormat(phone)) {
    return {
      valid: false,
      phone: cleaned,
      formatted,
      error: 'Please enter a valid 10-digit US phone number',
      errorCode: 'INVALID_FORMAT',
    };
  }

  const apiKey = process.env.NUMVERIFY_API_KEY;
  
  // If no API key, use local validation only
  if (!apiKey) {
    console.warn('NUMVERIFY_API_KEY not configured, using local validation only');
    return {
      valid: true,
      phone: cleaned,
      formatted,
      countryCode: 'US',
      lineType: 'unknown',
    };
  }

  // Call Numverify API
  try {
    const e164 = normalizeToE164(cleaned);
    const url = new URL('http://apilayer.net/api/validate');
    url.searchParams.set('access_key', apiKey);
    url.searchParams.set('number', e164);
    url.searchParams.set('country_code', 'US');
    url.searchParams.set('format', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Numverify API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.error) {
      console.error('Numverify API error:', data.error);
      // Fall back to local validation
      return {
        valid: true,
        phone: cleaned,
        formatted,
        countryCode: 'US',
        lineType: 'unknown',
        error: undefined,
      };
    }

    // Check if number is valid
    if (!data.valid) {
      return {
        valid: false,
        phone: cleaned,
        formatted,
        error: 'This phone number appears to be invalid. Please check and try again.',
        errorCode: 'INVALID_NUMBER',
      };
    }

    // Check if it's a US number
    if (data.country_code !== 'US') {
      return {
        valid: false,
        phone: cleaned,
        formatted,
        countryCode: data.country_code,
        countryName: data.country_name,
        error: 'Please enter a valid US phone number',
        errorCode: 'NOT_US',
      };
    }

    // Map line type from Numverify
    let lineType: LineType = 'unknown';
    if (data.line_type) {
      const apiLineType = data.line_type.toLowerCase();
      if (apiLineType === 'mobile') lineType = 'mobile';
      else if (apiLineType === 'landline') lineType = 'landline';
      else if (apiLineType.includes('voip')) lineType = 'voip';
      else if (apiLineType.includes('toll')) lineType = 'toll_free';
    }

    return {
      valid: true,
      phone: cleaned,
      formatted: data.international_format || formatted,
      countryCode: data.country_code,
      countryName: data.country_name,
      location: data.location,
      carrier: data.carrier,
      lineType,
    };
  } catch (error) {
    console.error('Numverify API error:', error);
    
    // API failed - fall back to local validation
    return {
      valid: true,
      phone: cleaned,
      formatted,
      countryCode: 'US',
      lineType: 'unknown',
    };
  }
}

/**
 * Quick synchronous check (no API call) - for real-time feedback
 */
export function quickPhoneCheck(phone: string): { valid: boolean; error?: string; formatted?: string } {
  if (!isValidUSPhoneFormat(phone)) {
    return { valid: false, error: 'Please enter a valid 10-digit phone number' };
  }
  return { valid: true, formatted: formatPhone(phone) };
}

/**
 * Get line type display text
 */
export function getLineTypeLabel(lineType: LineType): string {
  switch (lineType) {
    case 'mobile': return 'Mobile';
    case 'landline': return 'Landline';
    case 'voip': return 'VoIP';
    case 'toll_free': return 'Toll-Free';
    default: return 'Unknown';
  }
}
