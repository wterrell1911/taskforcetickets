import { OCRResult, ExtractedTicketData } from '../ocr-provider';

/**
 * Extract structured data from a traffic ticket/citation
 *
 * Tennessee citation patterns and keywords:
 * - Court dates: "COURT DATE", "APPEAR BY", "MUST APPEAR"
 * - Citation numbers: Various alphanumeric patterns
 * - Statutes: TCA 55-8-xxx, TCA 55-10-xxx
 * - Violation types: SPEEDING, FAILURE TO, VIOLATION OF, etc.
 */
export function extractTicketData(ocrResult: OCRResult): ExtractedTicketData {
  const text = ocrResult.rawText.toUpperCase();
  const originalText = ocrResult.rawText; // Keep original case for display
  const warnings: string[] = [];

  // Debug: Log raw OCR text
  console.log('=== TICKET OCR DEBUG ===');
  console.log('Raw text:', originalText);
  console.log('Confidence:', ocrResult.confidence);
  console.log('========================');

  // Check if this is a camera ticket (red light, speed camera)
  const isCameraTicket = detectCameraTicket(text);
  if (isCameraTicket) {
    warnings.push('This appears to be a camera ticket (civil violation) - we cannot process these');
  }

  // Extract court date
  const courtDate = extractCourtDate(text);
  if (!courtDate) warnings.push('Could not parse court date - please verify');

  // Extract court time
  const courtTime = extractCourtTime(text);

  // Extract court location
  const courtLocation = extractCourtLocation(text);
  if (!courtLocation) warnings.push('Could not parse court location - please verify');

  // Extract citation number
  const citationNumber = extractCitationNumber(text);
  if (!citationNumber) warnings.push('Could not parse citation number - please verify');

  // Extract violations
  const violations = extractViolations(text);
  if (violations.length === 0) warnings.push('Could not identify violations - please verify');

  // Extract officer info
  const { officerName, officerBadge } = extractOfficerInfo(text);

  // Extract violation location
  const violationLocation = extractViolationLocation(text);

  // Extract violation date/time
  const { violationDate, violationTime } = extractViolationDateTime(text);

  // Extract fine amount
  const fineAmount = extractFineAmount(text);

  // Extract statute numbers
  const statuteNumbers = extractStatuteNumbers(text);

  return {
    documentType: 'ticket',
    rawText: ocrResult.rawText,
    confidence: ocrResult.confidence,
    extractionWarnings: warnings,
    courtDate,
    courtTime,
    courtLocation,
    citationNumber,
    violations,
    officerName,
    officerBadge,
    violationLocation,
    violationDate,
    violationTime,
    fineAmount,
    statuteNumbers,
    isCameraTicket,
  };
}

/**
 * Extract court date from ticket text
 * Memphis tickets have various formats - need to be very flexible
 */
function extractCourtDate(text: string): string | null {
  console.log('Searching for court date in text...');

  // Pattern: COURT DATE followed by date - many variations
  const courtDatePatterns = [
    // Standard labeled formats
    /COURT\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /APPEAR\s*(?:BY|ON|BEFORE|DATE)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /MUST\s*APPEAR[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /DATE\s*TO\s*APPEAR[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /HEARING\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /SCHEDULED[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,

    // Memphis/TN specific patterns
    /ARRAIGNMENT[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /TRIAL\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /GENERAL\s*SESSIONS[^]*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,

    // Month name patterns (various formats)
    /COURT\s*DATE[:\s]*((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{1,2},?\s*\d{4})/i,
    /APPEAR[:\s]*((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{1,2},?\s*\d{4})/i,
    /((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{1,2},?\s*202[5-9])/i,

    // Look for date near "COURT" keyword (within same line or nearby)
    /COURT[^\n]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})[^\n]*COURT/i,

    // Date after common markers
    /DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]202[5-9])/i,
    /DT[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]202[5-9])/i,

    // Look for any future date (2025-2030) as potential court date
    /(\d{1,2}[-\/]\d{1,2}[-\/](?:202[5-9]|2030))/,
  ];

  for (const pattern of courtDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      console.log(`Matched pattern, found: ${match[1]}`);
      const normalized = normalizeDate(match[1]);
      // Validate it's a future date (court dates are in the future)
      if (isFutureDate(normalized)) {
        console.log(`Valid future date found: ${normalized}`);
        return normalized;
      }
    }
  }

  // Fallback: find any future date in the text
  console.log('No labeled date found, searching for any future date...');
  const allDates = text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g) || [];
  console.log(`Found ${allDates.length} potential dates:`, allDates);

  for (const date of allDates) {
    const normalized = normalizeDate(date);
    if (isFutureDate(normalized)) {
      console.log(`Future date found in fallback: ${normalized}`);
      return normalized;
    }
  }

  // Try month name dates as fallback
  const monthDates = text.match(/(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{1,2},?\s*\d{4}/gi) || [];
  for (const date of monthDates) {
    const normalized = normalizeDate(date);
    if (isFutureDate(normalized)) {
      return normalized;
    }
  }

  console.log('No court date found');
  return null;
}

/**
 * Check if a date is in the future (likely a court date)
 */
function isFutureDate(dateStr: string): boolean {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return false;

  const [, month, day, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return date >= now;
}

/**
 * Extract court time from ticket text
 */
function extractCourtTime(text: string): string | null {
  const timePatterns = [
    /COURT\s*TIME[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
    /TIME[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
    /AT\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract court location from ticket text
 */
function extractCourtLocation(text: string): string | null {
  const locationPatterns = [
    /COURT\s*(?:LOCATION|ADDRESS)[:\s]*([^\n]+)/i,
    /APPEAR\s*AT[:\s]*([^\n]+)/i,
    /GENERAL\s*SESSIONS\s*COURT[:\s]*([^\n]*)/i,
    /(MEMPHIS|SHELBY\s*COUNTY|GERMANTOWN|BARTLETT|COLLIERVILLE)[^\n]*COURT/i,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return cleanText(match[1] || match[0]);
    }
  }

  // Look for common Memphis court locations
  if (text.includes('201 POPLAR')) {
    return '201 Poplar Ave, Memphis, TN';
  }

  return null;
}

/**
 * Extract citation/ticket number
 * Memphis Police citation formats vary widely
 */
function extractCitationNumber(text: string): string | null {
  console.log('Searching for citation number...');

  const patterns = [
    // Labeled citation numbers
    /CITATION\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /TICKET\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /CASE\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /SUMMONS\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /UNIFORM\s*CITATION[:\s]*([A-Z0-9-]+)/i,
    /UTC\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,

    // Common abbreviations
    /(?:CIT|CITE|CTN)[:\s#]*([A-Z0-9-]+)/i,
    /(?:NO|NUMBER|#)[:\s]*([A-Z]{1,3}[\s-]?\d{6,10})/i,

    // Memphis Police patterns (MPD prefix)
    /MPD[:\s-]*([A-Z0-9-]+)/i,
    /MEMPHIS\s*(?:POLICE|PD)[:\s-]*([A-Z0-9-]+)/i,

    // TN citation format patterns
    /([A-Z]{2,4}[-\s]?\d{6,10})/,  // Letters followed by numbers
    /(\d{2,4}[-]\d{4,8})/,         // Numbers with dash
    /([A-Z]\d{2}[-]\d{6})/,        // Single letter + 2 digits + dash + 6 digits
    /(\d{10,12})/,                  // Long numeric only

    // Shelby County patterns
    /SHELBY[:\s]*([A-Z0-9-]+)/i,
    /(\d{4}-[A-Z]{2,3}-\d+)/i,     // Year-prefix-number format
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].length >= 6) {  // Citation numbers are usually at least 6 chars
      const citation = match[1].trim();
      // Validate it looks like a citation (not just random text)
      if (/\d{4,}/.test(citation) || /[A-Z]{2,}\d+/.test(citation)) {
        console.log(`Found citation: ${citation}`);
        return citation;
      }
    }
  }

  // Fallback: look for any long alphanumeric string that could be a citation
  const potentialCitations = text.match(/\b([A-Z]{0,4}[-]?\d{6,12})\b/g) || [];
  for (const citation of potentialCitations) {
    if (citation.length >= 6 && /\d{4,}/.test(citation)) {
      console.log(`Found potential citation in fallback: ${citation}`);
      return citation;
    }
  }

  console.log('No citation number found');
  return null;
}

/**
 * Extract violations from ticket text
 */
function extractViolations(text: string): string[] {
  const violations: string[] = [];

  // Common violation keywords
  const violationPatterns = [
    /SPEEDING\s*[-:]\s*(\d+)\s*(?:IN|\/)\s*(\d+)/gi,
    /SPEEDING/gi,
    /FAILURE\s*TO\s*(?:YIELD|STOP|SIGNAL|MAINTAIN|OBEY)/gi,
    /RUNNING\s*(?:RED|STOP)\s*(?:LIGHT|SIGN)/gi,
    /RECKLESS\s*DRIVING/gi,
    /DUI|DRIVING\s*UNDER\s*(?:THE\s*)?INFLUENCE/gi,
    /NO\s*(?:VALID\s*)?(?:LICENSE|REGISTRATION|INSURANCE)/gi,
    /EXPIRED\s*(?:LICENSE|REGISTRATION|TAG|PLATE)/gi,
    /IMPROPER\s*(?:LANE\s*CHANGE|PASSING|TURN)/gi,
    /FOLLOWING\s*TOO\s*CLOSE/gi,
    /SEATBELT|SEAT\s*BELT/gi,
    /TEXTING|CELL\s*PHONE/gi,
    /VIOLATION\s*OF[:\s]*([^\n]+)/gi,
    /CHARGE[:\s]*([^\n]+)/gi,
  ];

  for (const pattern of violationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const violation = match[0].trim();
      if (!violations.includes(violation)) {
        violations.push(violation);
      }
    }
  }

  return violations.slice(0, 5); // Limit to 5 violations
}

/**
 * Extract officer information
 */
function extractOfficerInfo(text: string): { officerName: string | null; officerBadge: string | null } {
  let officerName: string | null = null;
  let officerBadge: string | null = null;

  // Officer name patterns
  const namePatterns = [
    /OFFICER[:\s]*([A-Z]+(?:\s+[A-Z]+)?)/i,
    /OFC[:\s]*([A-Z]+(?:\s+[A-Z]+)?)/i,
    /CITING\s*OFFICER[:\s]*([A-Z]+(?:\s+[A-Z]+)?)/i,
    /ISSUED\s*BY[:\s]*([A-Z]+(?:\s+[A-Z]+)?)/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      officerName = cleanText(match[1]);
      break;
    }
  }

  // Badge number patterns
  const badgePatterns = [
    /BADGE\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9]+)/i,
    /UNIT\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9]+)/i,
    /ID\s*(?:NO|NUMBER|#)?[:\s]*(\d+)/i,
  ];

  for (const pattern of badgePatterns) {
    const match = text.match(pattern);
    if (match) {
      officerBadge = match[1].trim();
      break;
    }
  }

  return { officerName, officerBadge };
}

/**
 * Extract violation location
 * NOTE: Disabled - too unreliable on handwritten Memphis tickets
 * Users should enter this information manually
 */
function extractViolationLocation(_text: string): string | null {
  // Violation location extraction is disabled because:
  // 1. Memphis tickets have handwritten/inconsistent formats
  // 2. OCR often picks up court info instead of violation location
  // 3. False positives like "270 NO DRIVE" are worse than no data
  // The intake form allows users to provide this info manually
  return null;
}

/**
 * Extract violation date and time
 */
function extractViolationDateTime(text: string): { violationDate: string | null; violationTime: string | null } {
  let violationDate: string | null = null;
  let violationTime: string | null = null;

  // Date patterns
  const datePatterns = [
    /(?:VIOLATION|OFFENSE|INCIDENT)\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /DATE\s*OF\s*(?:VIOLATION|OFFENSE)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      violationDate = normalizeDate(match[1]);
      break;
    }
  }

  // Time patterns
  const timePatterns = [
    /(?:VIOLATION|OFFENSE|INCIDENT)\s*TIME[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
    /TIME\s*OF\s*(?:VIOLATION|OFFENSE)[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      violationTime = match[1].trim();
      break;
    }
  }

  return { violationDate, violationTime };
}

/**
 * Extract fine amount
 */
function extractFineAmount(text: string): string | null {
  const patterns = [
    /FINE[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /AMOUNT\s*DUE[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /TOTAL[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /\$(\d+(?:\.\d{2})?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return `$${match[1]}`;
    }
  }

  return null;
}

/**
 * Extract TN statute numbers
 */
function extractStatuteNumbers(text: string): string[] {
  const statutes: string[] = [];

  // TCA (Tennessee Code Annotated) patterns
  const patterns = [
    /TCA\s*(\d+-\d+-\d+)/gi,
    /T\.?C\.?A\.?\s*(\d+-\d+-\d+)/gi,
    /(\d+-\d+-\d{3})/g, // Generic statute format
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const statute = match[1] ? `TCA ${match[1]}` : match[0];
      if (!statutes.includes(statute)) {
        statutes.push(statute);
      }
    }
  }

  return statutes;
}

/**
 * Normalize date to MM/DD/YYYY format
 */
function normalizeDate(dateStr: string): string {
  // Remove extra spaces
  dateStr = dateStr.trim().replace(/\s+/g, ' ');

  // Try to parse various formats
  const monthNames: Record<string, string> = {
    JAN: '01', JANUARY: '01',
    FEB: '02', FEBRUARY: '02',
    MAR: '03', MARCH: '03',
    APR: '04', APRIL: '04',
    MAY: '05',
    JUN: '06', JUNE: '06',
    JUL: '07', JULY: '07',
    AUG: '08', AUGUST: '08',
    SEP: '09', SEPTEMBER: '09',
    OCT: '10', OCTOBER: '10',
    NOV: '11', NOVEMBER: '11',
    DEC: '12', DECEMBER: '12',
  };

  // Check for month name format (January 15, 2024)
  const monthNameMatch = dateStr.match(/([A-Z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (monthNameMatch) {
    const month = monthNames[monthNameMatch[1].toUpperCase()];
    if (month) {
      return `${month}/${monthNameMatch[2].padStart(2, '0')}/${monthNameMatch[3]}`;
    }
  }

  // Already in numeric format, just clean up
  const numericMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (numericMatch) {
    let [, month, day, year] = numericMatch;
    if (year.length === 2) {
      year = `20${year}`;
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

/**
 * Detect if this is a camera ticket (red light camera, speed camera, etc.)
 * These are civil violations that cannot be processed
 */
function detectCameraTicket(text: string): boolean {
  const cameraIndicators = [
    // Direct camera references
    /RED\s*LIGHT\s*CAMERA/i,
    /SPEED\s*CAMERA/i,
    /PHOTO\s*ENFORCEMENT/i,
    /PHOTO\s*RADAR/i,
    /CAMERA\s*ENFORCEMENT/i,
    /AUTOMATED\s*ENFORCEMENT/i,
    /TRAFFIC\s*CAMERA/i,
    /INTERSECTION\s*CAMERA/i,

    // Common camera ticket vendors/systems
    /REDFLEX/i,
    /AMERICAN\s*TRAFFIC\s*SOLUTIONS/i,
    /ATS\s*PROCESSING/i,
    /XEROX\s*STATE/i,
    /CONDUENT/i,
    /VERRA\s*MOBILITY/i,
    /GATSO/i,

    // Civil violation indicators
    /NOTICE\s*OF\s*VIOLATION/i,  // Camera tickets often say this instead of "citation"
    /CIVIL\s*PENALTY/i,
    /CIVIL\s*VIOLATION/i,
    /REGISTERED\s*OWNER/i,  // Camera tickets go to registered owner
    /VEHICLE\s*OWNER/i,

    // Specific Memphis/TN camera programs
    /SCHOOL\s*ZONE\s*CAMERA/i,
    /SCHOOL\s*SPEED\s*ZONE.*CAMERA/i,
  ];

  for (const pattern of cameraIndicators) {
    if (pattern.test(text)) {
      console.log(`Camera ticket detected: matched pattern ${pattern}`);
      return true;
    }
  }

  return false;
}
