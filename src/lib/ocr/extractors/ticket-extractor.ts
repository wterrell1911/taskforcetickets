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
  const warnings: string[] = [];

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
  };
}

/**
 * Extract court date from ticket text
 */
function extractCourtDate(text: string): string | null {
  // Pattern: COURT DATE followed by date
  const courtDatePatterns = [
    /COURT\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /APPEAR\s*(?:BY|ON|BEFORE)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /MUST\s*APPEAR[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /DATE\s*TO\s*APPEAR[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    // Month name patterns
    /COURT\s*DATE[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
    /APPEAR\s*(?:BY|ON|BEFORE)[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i,
  ];

  for (const pattern of courtDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeDate(match[1]);
    }
  }

  return null;
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
 */
function extractCitationNumber(text: string): string | null {
  const patterns = [
    /CITATION\s*(?:NO|NUMBER|#)[:\s]*([A-Z0-9-]+)/i,
    /TICKET\s*(?:NO|NUMBER|#)[:\s]*([A-Z0-9-]+)/i,
    /CASE\s*(?:NO|NUMBER|#)[:\s]*([A-Z0-9-]+)/i,
    /(?:NO|NUMBER|#)[:\s]*([A-Z]{1,3}[\s-]?\d{6,10})/i,
    // TN citation format patterns
    /([A-Z]{2,3}\d{7,10})/,
    /(\d{2}-\d{6,8})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

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
 */
function extractViolationLocation(text: string): string | null {
  const patterns = [
    /LOCATION[:\s]*([^\n]+)/i,
    /(?:AT|ON|NEAR)[:\s]*(\d+\s*[A-Z\s]+(?:ST|AVE|BLVD|RD|DR|HWY|PKWY)[^\n]*)/i,
    /OCCURRED\s*(?:AT|ON)[:\s]*([^\n]+)/i,
    /(I-\d+|INTERSTATE\s*\d+)[^\n]*/i,
    /(\d+\s+[A-Z\s]+(?:STREET|AVENUE|BOULEVARD|ROAD|DRIVE|HIGHWAY|PARKWAY))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return cleanText(match[1] || match[0]);
    }
  }

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
