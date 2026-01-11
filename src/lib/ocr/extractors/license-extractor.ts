import { OCRResult, ExtractedLicenseData } from '../ocr-provider';

/**
 * Extract structured data from a driver's license
 *
 * Tennessee driver's license patterns:
 * - License number: 7-9 digits
 * - Standard DL layout with labeled fields
 */
export function extractLicenseData(ocrResult: OCRResult): ExtractedLicenseData {
  const text = ocrResult.rawText.toUpperCase();
  const warnings: string[] = [];

  // Debug: Log raw OCR text
  console.log('=== LICENSE OCR DEBUG ===');
  console.log('Raw text:', ocrResult.rawText);
  console.log('Confidence:', ocrResult.confidence);
  console.log('========================');

  // Extract full name
  const { fullName, firstName, lastName, middleName } = extractName(text);
  if (!fullName && !firstName) warnings.push('Could not parse name - please verify');

  // Extract license number
  const licenseNumber = extractLicenseNumber(text);
  if (!licenseNumber) warnings.push('Could not parse license number - please verify');

  // Extract dates
  const dateOfBirth = extractDateOfBirth(text);
  if (!dateOfBirth) warnings.push('Could not parse date of birth - please verify');

  const expirationDate = extractExpirationDate(text);
  const issueDate = extractIssueDate(text);

  // Extract address
  const { address, city, state, zipCode } = extractAddress(text);
  if (!address) warnings.push('Could not parse address - please verify');

  // Extract license class and restrictions
  const licenseClass = extractLicenseClass(text);
  const restrictions = extractRestrictions(text);
  const endorsements = extractEndorsements(text);

  // Debug: Log extracted fields
  console.log('=== EXTRACTED FIELDS ===');
  console.log('Name:', { fullName, firstName, lastName, middleName });
  console.log('License #:', licenseNumber);
  console.log('DOB:', dateOfBirth);
  console.log('Expiration:', expirationDate);
  console.log('Address:', { address, city, state, zipCode });
  console.log('Warnings:', warnings);
  console.log('========================');

  return {
    documentType: 'license',
    rawText: ocrResult.rawText,
    confidence: ocrResult.confidence,
    extractionWarnings: warnings,
    fullName,
    firstName,
    lastName,
    middleName,
    licenseNumber,
    dateOfBirth,
    expirationDate,
    issueDate,
    address,
    city,
    state,
    zipCode,
    licenseClass,
    restrictions,
    endorsements,
  };
}

/**
 * Extract name from license
 * Tennessee DL formats:
 * - LN: LASTNAME / FN: FIRSTNAME MN: MIDDLE
 * - Full name in single field: LASTNAME, FIRSTNAME MIDDLE
 * - Name may appear after "1" or "2" line markers
 */
function extractName(text: string): {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
} {
  let fullName: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let middleName: string | null = null;

  // TN DL specific patterns - often has numbered lines
  // Line 1 is usually last name, Line 2 is first name
  const tnPatterns = [
    // "1 LASTNAME" pattern
    /\b1\s+([A-Z]{2,})\b/,
    // "2 FIRSTNAME MIDDLE" pattern
    /\b2\s+([A-Z]+)\s*([A-Z]*)\b/,
  ];

  // Try TN-specific format first
  const line1Match = text.match(/\b1\s+([A-Z]{2,})\b/);
  const line2Match = text.match(/\b2\s+([A-Z]+)\s*([A-Z]*)/);

  if (line1Match && line2Match) {
    lastName = line1Match[1].trim();
    firstName = line2Match[1].trim();
    middleName = line2Match[2]?.trim() || null;
  }

  // Try labeled fields
  if (!firstName) {
    const fnPatterns = [
      /(?:FN|FIRST\s*(?:NAME)?)[:\s]*([A-Z]+)/i,
      /FIRST[:\s]*([A-Z]+)/i,
    ];
    for (const pattern of fnPatterns) {
      const match = text.match(pattern);
      if (match) {
        firstName = match[1].trim();
        break;
      }
    }
  }

  if (!lastName) {
    const lnPatterns = [
      /(?:LN|LAST\s*(?:NAME)?)[:\s]*([A-Z]+)/i,
      /LAST[:\s]*([A-Z]+)/i,
    ];
    for (const pattern of lnPatterns) {
      const match = text.match(pattern);
      if (match) {
        lastName = match[1].trim();
        break;
      }
    }
  }

  // Try to find middle name
  if (!middleName) {
    const mnMatch = text.match(/(?:MN|MIDDLE\s*(?:NAME)?)[:\s]*([A-Z]+)/i);
    if (mnMatch) {
      middleName = mnMatch[1].trim();
    }
  }

  // Try combined name field (LASTNAME, FIRSTNAME MIDDLE format)
  if (!firstName || !lastName) {
    const combinedPatterns = [
      /([A-Z]{2,}),\s*([A-Z]+)\s+([A-Z]+)/,  // SMITH, JOHN MICHAEL
      /([A-Z]{2,}),\s*([A-Z]+)/,              // SMITH, JOHN
    ];
    for (const pattern of combinedPatterns) {
      const match = text.match(pattern);
      if (match) {
        lastName = lastName || match[1].trim();
        firstName = firstName || match[2].trim();
        if (match[3]) middleName = middleName || match[3].trim();
        break;
      }
    }
  }

  // Try to find any capitalized name-like sequences if still missing
  if (!firstName && !lastName) {
    // Look for patterns like "NAME: JOHN SMITH" or standalone names
    const nameFieldMatch = text.match(/NAME[:\s]+([A-Z]+(?:\s+[A-Z]+)+)/i);
    if (nameFieldMatch) {
      const nameParts = nameFieldMatch[1].trim().split(/\s+/);
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts[nameParts.length - 1];
        if (nameParts.length === 3) {
          middleName = nameParts[1];
        }
      }
    }
  }

  // Build full name
  if (firstName || lastName) {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    fullName = parts.join(' ');
  }

  return { fullName, firstName, lastName, middleName };
}

/**
 * Extract Tennessee driver's license number
 * TN format: 8-9 digit number
 * Often appears after "4d" or "DL" or "LIC NO"
 */
function extractLicenseNumber(text: string): string | null {
  const patterns = [
    // TN specific - often marked with 4d
    /4d?\s*(\d{8,9})/i,
    // Standard DL patterns
    /(?:DL|LICENSE|LIC)\s*(?:NO|NUMBER|#)?[:\s]*(\d{7,9})/i,
    /(?:DL|LICENSE|LIC)\s*(?:NO|NUMBER|#)?[:\s]*([A-Z]?\d{6,8})/i,
    // Look for ID/DL field marker
    /(?:DL|ID)\s*[:\s]*(\d{8,9})/i,
    // Look for customer ID or number
    /(?:CUSTOMER\s*(?:ID|NO|NUMBER))[:\s]*(\d{8,9})/i,
    // Look for standalone 8-9 digit number (TN format)
    /\b(\d{8,9})\b/,
    // 7-digit fallback
    /\b(\d{7})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = match[1].trim();
      // Validate it looks like a license number (not a date or phone)
      if (num.length >= 7 && num.length <= 9 && !num.includes('-')) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Extract date of birth
 * TN uses MMDDYYYY format or MM-DD-YYYY
 * Often marked with "3" or "DOB"
 */
function extractDateOfBirth(text: string): string | null {
  const patterns = [
    // TN specific - often marked with 3
    /\b3\s*(\d{2}[-\/]?\d{2}[-\/]?\d{4})/,
    // Standard DOB patterns
    /DOB[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /DATE\s*OF\s*BIRTH[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /BIRTH\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /BORN[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    // MMDDYYYY format (no separators)
    /DOB[:\s]*(\d{8})/i,
    // Look for a date that's clearly in the past (DOB range 1940-2010)
    /\b((?:0[1-9]|1[0-2])[-\/]?(?:0[1-9]|[12]\d|3[01])[-\/]?(?:19[4-9]\d|20[0-1]\d))\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeDate(match[1]);
    }
  }

  return null;
}

/**
 * Extract expiration date
 * TN licenses show expiration often marked with "4b" or "EXP"
 */
function extractExpirationDate(text: string): string | null {
  const patterns = [
    // TN specific - often marked with 4b
    /4b?\s*(\d{2}[-\/]?\d{2}[-\/]?\d{4})/i,
    // Standard expiration patterns
    /EXP(?:IRES?|IRATION)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /VALID\s*(?:THRU|THROUGH|UNTIL)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    // MMDDYYYY format
    /EXP[:\s]*(\d{8})/i,
    // Look for a date in the future (exp range 2024-2035)
    /\b((?:0[1-9]|1[0-2])[-\/]?(?:0[1-9]|[12]\d|3[01])[-\/]?(?:202[4-9]|203[0-5]))\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeDate(match[1]);
    }
  }

  return null;
}

/**
 * Extract issue date
 */
function extractIssueDate(text: string): string | null {
  const patterns = [
    /ISS(?:UE(?:D)?)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /DATE\s*ISSUED[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeDate(match[1]);
    }
  }

  return null;
}

/**
 * Extract address from license
 */
function extractAddress(text: string): {
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
} {
  let address: string | null = null;
  let city: string | null = null;
  let state: string | null = null;
  let zipCode: string | null = null;

  // Look for address patterns
  const addressPatterns = [
    /(?:ADDRESS|ADD|ADDR)[:\s]*(.+?)(?=\n|CITY|$)/i,
    /(\d+\s+[A-Z\s]+(?:ST|AVE|BLVD|RD|DR|LN|WAY|CT|PL|CIR)[^\n]*)/i,
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      address = cleanText(match[1]);
      break;
    }
  }

  // Look for city
  const cityMatch = text.match(/CITY[:\s]*([A-Z\s]+?)(?=\n|STATE|TN|$)/i);
  if (cityMatch) {
    city = cleanText(cityMatch[1]);
  }

  // Tennessee is likely the state
  if (text.includes('TENNESSEE') || text.includes(' TN ')) {
    state = 'TN';
  }

  // Look for ZIP code
  const zipMatch = text.match(/\b(\d{5}(?:-\d{4})?)\b/);
  if (zipMatch) {
    zipCode = zipMatch[1];
  }

  // Try to extract city from city/state/zip line
  if (!city) {
    const cityStateZipMatch = text.match(/([A-Z\s]+),?\s*(?:TN|TENNESSEE)\s*(\d{5})/i);
    if (cityStateZipMatch) {
      city = cleanText(cityStateZipMatch[1]);
      state = 'TN';
      zipCode = cityStateZipMatch[2];
    }
  }

  return { address, city, state, zipCode };
}

/**
 * Extract license class
 */
function extractLicenseClass(text: string): string | null {
  const patterns = [
    /CLASS[:\s]*([A-Z])/i,
    /LICENSE\s*CLASS[:\s]*([A-Z])/i,
    /\bCLASS\s+([A-Z])\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Extract restrictions
 */
function extractRestrictions(text: string): string[] {
  const restrictions: string[] = [];

  const patterns = [
    /RESTRICTIONS?[:\s]*([A-Z0-9,\s]+)/i,
    /RESTR?[:\s]*([A-Z0-9,\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const codes = match[1].split(/[,\s]+/).filter(c => c.length > 0 && c.length <= 3);
      restrictions.push(...codes);
      break;
    }
  }

  // Common restriction codes
  const restrictionMeanings: Record<string, string> = {
    'A': 'Corrective Lenses',
    'B': 'Outside Mirror',
    'C': 'Automatic Transmission',
    'D': 'Daylight Only',
    'E': 'No Interstate',
    'F': 'Area Restriction',
    'G': 'Power Steering',
    'H': 'Limited to Employment',
    'I': 'Limited to/from School',
  };

  // Return codes with meanings if known
  return restrictions.map(code => {
    const meaning = restrictionMeanings[code];
    return meaning ? `${code} - ${meaning}` : code;
  });
}

/**
 * Extract endorsements
 */
function extractEndorsements(text: string): string[] {
  const endorsements: string[] = [];

  const patterns = [
    /ENDORSEMENTS?[:\s]*([A-Z0-9,\s]+)/i,
    /END[:\s]*([A-Z0-9,\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const codes = match[1].split(/[,\s]+/).filter(c => c.length > 0 && c.length <= 3);
      endorsements.push(...codes);
      break;
    }
  }

  // Common endorsement codes
  const endorsementMeanings: Record<string, string> = {
    'H': 'Hazmat',
    'M': 'Motorcycle',
    'N': 'Tank',
    'P': 'Passenger',
    'S': 'School Bus',
    'T': 'Double/Triple Trailers',
    'X': 'Hazmat + Tank',
  };

  return endorsements.map(code => {
    const meaning = endorsementMeanings[code];
    return meaning ? `${code} - ${meaning}` : code;
  });
}

/**
 * Normalize date to MM/DD/YYYY format
 */
function normalizeDate(dateStr: string): string {
  dateStr = dateStr.trim().replace(/[^0-9/-]/g, '');

  // Handle MMDDYYYY format (8 digits, no separators) - common TN format
  const eightDigitMatch = dateStr.match(/(\d{8})/);
  if (eightDigitMatch) {
    const digits = eightDigitMatch[1];
    const month = digits.slice(0, 2);
    const day = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    return `${month}/${day}/${year}`;
  }

  // Handle MM-DD-YYYY or MM/DD/YYYY format
  const numericMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (numericMatch) {
    let [, month, day, year] = numericMatch;
    if (year.length === 2) {
      const yearNum = parseInt(year, 10);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }
    return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
  }

  return dateStr;
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s,.-]/g, '')
    .trim();
}
