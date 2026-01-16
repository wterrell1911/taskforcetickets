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
 * Words to exclude from name extraction (states, cities, common non-name words on licenses)
 */
const NAME_EXCLUSIONS = new Set([
  // States and cities
  'TENNESSEE', 'TN', 'MEMPHIS', 'NASHVILLE', 'KNOXVILLE', 'CHATTANOOGA',
  'BARTLETT', 'GERMANTOWN', 'COLLIERVILLE', 'CORDOVA', 'MILLINGTON',
  // Tennessee specific text
  'VOLUNTEER', 'STATE', 'VOLUNTEERS',
  // License field labels
  'DRIVER', 'LICENSE', 'CLASS', 'EXPIRES', 'ISSUED', 'DOB', 'SEX', 'HT',
  'WT', 'EYES', 'HAIR', 'ADDRESS', 'CITY', 'ZIP', 'USA',
  'ID', 'DL', 'END', 'NONE', 'RSTR', 'DD', 'ISS', 'EXP', 'THE', 'OF',
  // REAL ID markings (common on modern licenses)
  'REAL', 'SEAL', 'STAR', 'GOLD', 'COMPLIANT',
  // Other common license text
  'ORGAN', 'DONOR', 'VETERAN', 'NOT', 'FOR', 'FEDERAL', 'PURPOSES',
  'DUPLICATE', 'COPY', 'PHOTO', 'SIGNATURE', 'RESTRICTION', 'ENDORSEMENT',
  'COMMERCIAL', 'CDL', 'UNDER', 'OVER', 'NONE', 'BRN', 'BLK', 'BLU', 'GRN',
  'HAZ', 'GRY', 'HZL', 'MALE', 'FEMALE', 'FEM', 'IDENTIFICATION',
]);

/**
 * Check if a word looks like a valid name part (first or last name)
 */
function isValidNamePart(word: string): boolean {
  if (!word || word.length < 3) return false;  // Names are usually 3+ chars
  if (NAME_EXCLUSIONS.has(word.toUpperCase())) return false;
  if (/^\d+$/.test(word)) return false; // All digits
  if (/^[A-Z]{1}$/.test(word)) return false; // Single letter
  if (/\d/.test(word)) return false; // Contains any digits (not a name)
  // Must be all letters
  if (!/^[A-Z]+$/i.test(word)) return false;
  return true;
}

/**
 * Check if a word is likely a complete name (not truncated)
 * Names typically end in vowels or common consonant endings
 */
function looksLikeCompleteName(word: string): boolean {
  if (!word || word.length < 5) return false;  // Most real names are 5+ chars
  const upper = word.toUpperCase();
  // Common name endings - be more restrictive to avoid partial words
  const validEndings = ['A', 'E', 'I', 'O', 'Y', 'N', 'S', 'R', 'L', 'D', 'T', 'H'];
  const lastChar = upper.charAt(upper.length - 1);
  return validEndings.includes(lastChar);
}

/**
 * Extract name from license
 * Tennessee DL formats:
 * - LN: LASTNAME / FN: FIRSTNAME MN: MIDDLE
 * - Full name in single field: LASTNAME, FIRSTNAME MIDDLE
 * - Name may appear after "1" or "2" line markers
 * - Name may appear near numbered fields like 1, 2 on TN licenses
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

  console.log('Extracting name from text...');

  // Try labeled fields first (most reliable)
  const fnPatterns = [
    /(?:FN|FIRST\s*NAME?)[:\s]+([A-Z][A-Z]+)/i,
    /FIRST[:\s]+([A-Z][A-Z]+)/i,
  ];
  for (const pattern of fnPatterns) {
    const match = text.match(pattern);
    if (match && isValidNamePart(match[1])) {
      firstName = match[1].trim();
      console.log(`Found first name via label: ${firstName}`);
      break;
    }
  }

  const lnPatterns = [
    /(?:LN|LAST\s*NAME?)[:\s]+([A-Z][A-Z]+)/i,
    /LAST[:\s]+([A-Z][A-Z]+)/i,
  ];
  for (const pattern of lnPatterns) {
    const match = text.match(pattern);
    if (match && isValidNamePart(match[1])) {
      lastName = match[1].trim();
      console.log(`Found last name via label: ${lastName}`);
      break;
    }
  }

  // Try to find middle name
  if (!middleName) {
    const mnMatch = text.match(/(?:MN|MIDDLE\s*NAME?)[:\s]+([A-Z]+)/i);
    if (mnMatch && isValidNamePart(mnMatch[1])) {
      middleName = mnMatch[1].trim();
    }
  }

  // Try TN-specific format with numbered lines (1 = last, 2 = first)
  // The numbers 1 and 2 are field markers on TN licenses
  if (!firstName || !lastName) {
    // Look for "1 LASTNAME" pattern (inline) - require 4+ chars for names
    const line1Match = text.match(/\b1\s+([A-Z]{4,})\b/);
    // Look for "2 FIRSTNAME MIDDLE" pattern (inline)
    const line2Match = text.match(/\b2\s+([A-Z]{4,})(?:\s+([A-Z]{2,}))?/);

    if (line1Match && isValidNamePart(line1Match[1]) && looksLikeCompleteName(line1Match[1])) {
      lastName = lastName || line1Match[1].trim();
      console.log(`Found last name via line1: ${lastName}`);
    }
    if (line2Match && isValidNamePart(line2Match[1]) && looksLikeCompleteName(line2Match[1])) {
      firstName = firstName || line2Match[1].trim();
      console.log(`Found first name via line2: ${firstName}`);
      if (line2Match[2] && isValidNamePart(line2Match[2])) {
        middleName = middleName || line2Match[2].trim();
      }
    }
  }

  // Try combined name field (LASTNAME, FIRSTNAME MIDDLE format)
  if (!firstName || !lastName) {
    const combinedPatterns = [
      /([A-Z]{2,}),\s*([A-Z]{2,})\s+([A-Z]{2,})/,  // SMITH, JOHN MICHAEL
      /([A-Z]{2,}),\s*([A-Z]{2,})/,              // SMITH, JOHN
    ];
    for (const pattern of combinedPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (!lastName && isValidNamePart(match[1])) lastName = match[1].trim();
        if (!firstName && isValidNamePart(match[2])) firstName = match[2].trim();
        if (match[3] && !middleName && isValidNamePart(match[3])) middleName = match[3].trim();
        if (firstName && lastName) break;
      }
    }
  }

  // Parse line by line looking for name patterns
  if (!firstName || !lastName) {
    const lines = text.split(/[\n\r]+/);
    console.log(`Parsing ${lines.length} lines for names...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // If we see a "1" or "LN" marker, check same line and next line for last name
      if (/^1$|^LN$/i.test(line)) {
        // Check next line for the name
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const parts = nextLine.split(/\s+/);
          for (const part of parts) {
            if (isValidNamePart(part) && looksLikeCompleteName(part) && !lastName) {
              lastName = part;
              console.log(`Found last name after marker: ${lastName}`);
              break;
            }
          }
        }
      }

      // If we see a "2" or "FN" marker, check same line and next line for first name
      if (/^2$|^FN$/i.test(line)) {
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const parts = nextLine.split(/\s+/);
          if (parts[0] && isValidNamePart(parts[0]) && looksLikeCompleteName(parts[0]) && !firstName) {
            firstName = parts[0];
            console.log(`Found first name after marker: ${firstName}`);
            if (parts[1] && isValidNamePart(parts[1]) && parts[1].length >= 2 && !middleName) {
              middleName = parts[1];
            }
          }
        }
      }

      // Also check if the marker is on the same line as the name: "1 WHITE" or "2 JANIKA"
      const inlineMatch = line.match(/^([12])\s+([A-Z]{4,})(?:\s+([A-Z]{2,}))?$/);
      if (inlineMatch) {
        const [, num, name1, name2] = inlineMatch;
        if (num === '1' && isValidNamePart(name1) && looksLikeCompleteName(name1) && !lastName) {
          lastName = name1;
          console.log(`Found inline last name: ${lastName}`);
        } else if (num === '2' && isValidNamePart(name1) && looksLikeCompleteName(name1) && !firstName) {
          firstName = name1;
          console.log(`Found inline first name: ${firstName}`);
          if (name2 && isValidNamePart(name2) && !middleName) {
            middleName = name2;
          }
        }
      }
    }
  }

  // Look for "NAME" field directly
  if (!firstName || !lastName) {
    const nameFieldMatch = text.match(/NAME[:\s]+([A-Z]{2,})(?:[,\s]+([A-Z]{2,}))?(?:\s+([A-Z]{2,}))?/i);
    if (nameFieldMatch) {
      // Could be "NAME: LAST, FIRST MIDDLE" or "NAME: FIRST LAST"
      const [, part1, part2, part3] = nameFieldMatch;
      if (part1 && part2) {
        if (!lastName && isValidNamePart(part1)) lastName = part1;
        if (!firstName && isValidNamePart(part2)) firstName = part2;
        if (part3 && !middleName && isValidNamePart(part3)) middleName = part3;
      }
    }
  }

  // Final fallback: look for any capitalized name-like words
  if (!firstName && !lastName) {
    console.log('Using fallback name extraction...');
    // Look for sequences of capitalized words that could be names
    const potentialNames: string[] = [];
    const nameRegex = /\b([A-Z]{5,})\b/g;  // Require 5+ chars for fallback to avoid partial words
    let match;
    while ((match = nameRegex.exec(text)) !== null) {
      const word = match[1];
      // Must be valid AND look like a complete name (not truncated)
      if (isValidNamePart(word) && looksLikeCompleteName(word)) {
        potentialNames.push(word);
      }
    }

    console.log('Potential names found:', potentialNames);

    if (potentialNames.length >= 2) {
      // Try to find the most likely first/last names
      // On TN licenses, last name appears first (line 1), then first name (line 2)
      // So in text order: last name, then first name
      lastName = potentialNames[0];
      firstName = potentialNames[1];
    } else if (potentialNames.length === 1) {
      // If only one name found, it's probably the last name
      lastName = potentialNames[0];
    }
  }

  // Build full name (order: First Middle Last for display)
  if (firstName || lastName) {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    fullName = parts.join(' ');
    console.log(`Final name: ${fullName}`);
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
    // Standard DOB patterns with label - highest priority
    /DOB[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /DATE\s*OF\s*BIRTH[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /BIRTH\s*(?:DATE)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /BORN[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    // TN specific - DOB followed by 8 digits MMDDYYYY
    /DOB[:\s]*(\d{8})/i,
    // TN specific - often marked with "3" followed by date
    /\b3\s+(\d{2}[-\/]\d{2}[-\/]\d{4})/,
    // Look for MM/DD/YYYY pattern in past (1940-2010) - likely DOB
    /\b((?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19[4-9]\d|20[0-1]\d))\b/,
    // Look for MM-DD-YYYY pattern in past
    /\b((?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])-(?:19[4-9]\d|20[0-1]\d))\b/,
    // MMDDYYYY without separators (must be in past)
    /\b((?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(?:19[4-9]\d|20[0-1]\d))\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const normalized = normalizeDate(match[1]);
      // Validate it looks like a reasonable DOB (not a future date, not too old)
      if (isValidDOB(normalized)) {
        return normalized;
      }
    }
  }

  return null;
}

/**
 * Validate a date looks like a reasonable DOB
 */
function isValidDOB(dateStr: string): boolean {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return false;

  const [, month, day, year] = match;
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  // Year should be between 1920 and 2015 (reasonable driving age)
  if (yearNum < 1920 || yearNum > 2015) return false;
  // Month should be 1-12
  if (monthNum < 1 || monthNum > 12) return false;
  // Day should be 1-31
  if (dayNum < 1 || dayNum > 31) return false;

  return true;
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
