/**
 * Confidence-based extraction utilities
 *
 * These functions wrap pattern matching with confidence scoring
 * to enable reliable eligibility decisions.
 */

import {
  FieldExtraction,
  ExtractionResultWithConfidence,
  ExtractedFieldsWithConfidence,
  createFieldExtraction,
  emptyFieldExtraction,
  calculateAverageConfidence,
  checkRequiredFieldsConfidence,
  CONFIDENCE_THRESHOLD,
  REQUIRED_TICKET_FIELDS,
  REQUIRED_LICENSE_FIELDS,
} from '../types';
import { OCRResult } from '../ocr-provider';

/**
 * Extract a field using multiple patterns with decreasing confidence
 * First pattern match = highest confidence, last = lowest
 */
export function extractWithPatterns(
  text: string,
  patterns: { pattern: RegExp; confidence: number }[],
  fieldName: string
): FieldExtraction {
  for (const { pattern, confidence } of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return createFieldExtraction(match[1].trim(), confidence, 'ocr');
    }
  }

  return emptyFieldExtraction();
}

/**
 * Speed extraction result
 */
interface SpeedExtractionResult {
  limit: FieldExtraction<number>;
  actual: FieldExtraction<number>;
  over: FieldExtraction<number>;
}

/**
 * Extract speed information with confidence scoring
 */
export function extractSpeedWithConfidence(text: string): SpeedExtractionResult {
  // Pattern: "65 in a 55" or "65 mph in 55 zone" (HIGH confidence)
  const fullMatch = text.match(/(\d{1,3})\s*(?:mph)?\s*in\s*(?:a\s*)?(\d{1,3})\s*(?:mph)?\s*zone/i);
  if (fullMatch) {
    const actual = parseInt(fullMatch[1]);
    const limit = parseInt(fullMatch[2]);
    if (actual > limit && actual < 200 && limit < 100) {
      return {
        actual: createFieldExtraction(actual, 90, 'ocr'),
        limit: createFieldExtraction(limit, 90, 'ocr'),
        over: createFieldExtraction(actual - limit, 90, 'ocr'),
      };
    }
  }

  // Pattern: "65/55" (MEDIUM-HIGH confidence)
  const slashMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (slashMatch) {
    const actual = parseInt(slashMatch[1]);
    const limit = parseInt(slashMatch[2]);
    if (actual > limit && actual < 200 && limit < 100) {
      return {
        actual: createFieldExtraction(actual, 80, 'ocr'),
        limit: createFieldExtraction(limit, 80, 'ocr'),
        over: createFieldExtraction(actual - limit, 80, 'ocr'),
      };
    }
  }

  // Pattern: "10 over" or "10 mph over" (MEDIUM confidence - we don't know actual/limit)
  const overMatch = text.match(/(\d{1,2})\s*(?:mph\s*)?over/i);
  if (overMatch) {
    const over = parseInt(overMatch[1]);
    if (over > 0 && over < 100) {
      return {
        actual: emptyFieldExtraction(),
        limit: emptyFieldExtraction(),
        over: createFieldExtraction(over, 75, 'ocr'),
      };
    }
  }

  // Pattern: "exceeding by X" or "X mph excess" (LOWER confidence)
  const exceedMatch = text.match(/(?:exceeding|excess)\s*(?:speed\s*)?(?:limit\s*)?(?:by\s*)?(\d+)/i);
  if (exceedMatch) {
    const over = parseInt(exceedMatch[1]);
    if (over > 0 && over < 100) {
      return {
        actual: emptyFieldExtraction(),
        limit: emptyFieldExtraction(),
        over: createFieldExtraction(over, 65, 'ocr'),
      };
    }
  }

  return {
    actual: emptyFieldExtraction(),
    limit: emptyFieldExtraction(),
    over: emptyFieldExtraction(),
  };
}

/**
 * Extract ticket data with confidence scoring
 */
export function extractTicketDataWithConfidence(ocrResult: OCRResult): ExtractionResultWithConfidence {
  const text = ocrResult.rawText.toUpperCase();
  const fields: ExtractedFieldsWithConfidence = {};
  const warnings: string[] = [];

  // COURT DATE
  fields.courtDate = extractWithPatterns(text, [
    { pattern: /COURT\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 90 },
    { pattern: /APPEAR\s*(?:BY|ON|BEFORE)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 85 },
    { pattern: /MUST\s*APPEAR[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 85 },
    { pattern: /DATE\s*TO\s*APPEAR[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 80 },
    { pattern: /COURT\s*DATE[:\s]*(\w+\s+\d{1,2},?\s*\d{4})/i, confidence: 85 },
  ], 'Court Date');

  if (!fields.courtDate.value) {
    warnings.push('Could not extract court date');
  }

  // COURT LOCATION
  fields.courtLocation = extractWithPatterns(text, [
    { pattern: /COURT\s*(?:LOCATION|ADDRESS)[:\s]*([^\n]+)/i, confidence: 85 },
    { pattern: /APPEAR\s*AT[:\s]*([^\n]+)/i, confidence: 80 },
    { pattern: /GENERAL\s*SESSIONS\s*COURT[:\s]*([^\n]*)/i, confidence: 75 },
    { pattern: /(MEMPHIS|SHELBY\s*COUNTY|GERMANTOWN|BARTLETT|COLLIERVILLE)[^\n]*COURT/i, confidence: 70 },
  ], 'Court Location');

  // Check for 201 Poplar specifically
  if (!fields.courtLocation.value && text.includes('201 POPLAR')) {
    fields.courtLocation = createFieldExtraction('201 Poplar Ave, Memphis, TN', 85, 'ocr');
  }

  // COURT DIVISION
  fields.courtDivision = extractWithPatterns(text, [
    { pattern: /DIVISION\s*(\d|[IVX]+)/i, confidence: 90 },
    { pattern: /DIV\.?\s*(\d|[IVX]+)/i, confidence: 85 },
    { pattern: /GENERAL\s*SESSIONS\s*(?:COURT\s*)?(\d)/i, confidence: 80 },
  ], 'Division');

  // CITATION NUMBER
  fields.citationNumber = extractWithPatterns(text, [
    { pattern: /CITATION\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i, confidence: 90 },
    { pattern: /TICKET\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i, confidence: 85 },
    { pattern: /CASE\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i, confidence: 80 },
    { pattern: /(?:NO|NUMBER|#)[:\s]*([A-Z]{1,3}[\s-]?\d{6,10})/i, confidence: 75 },
    { pattern: /([A-Z]{2,3}\d{7,10})/, confidence: 60 },
  ], 'Citation Number');

  if (!fields.citationNumber.value) {
    warnings.push('Could not extract citation number');
  }

  // VIOLATION DESCRIPTION
  const violationPatterns = [
    { pattern: /VIOLATION[:\s]*(.+?)(?:\n|$)/i, confidence: 85 },
    { pattern: /CHARGE[:\s]*(.+?)(?:\n|$)/i, confidence: 85 },
    { pattern: /OFFENSE[:\s]*(.+?)(?:\n|$)/i, confidence: 80 },
    { pattern: /(SPEEDING[^\n]*)/i, confidence: 90 },
    { pattern: /(FAILURE\s*TO\s*(?:YIELD|STOP|SIGNAL|MAINTAIN|OBEY)[^\n]*)/i, confidence: 85 },
    { pattern: /(RUNNING\s*(?:RED|STOP)\s*(?:LIGHT|SIGN)[^\n]*)/i, confidence: 85 },
  ];

  fields.violationDescription = extractWithPatterns(text, violationPatterns, 'Violation');

  if (!fields.violationDescription.value) {
    warnings.push('Could not extract violation description');
  }

  // SPEED EXTRACTION
  const speedResult = extractSpeedWithConfidence(text);
  fields.speedLimit = speedResult.limit;
  fields.actualSpeed = speedResult.actual;
  fields.speedOver = speedResult.over;

  // ISSUING AGENCY
  fields.issuingAgency = extractWithPatterns(text, [
    { pattern: /(MEMPHIS\s*POLICE\s*DEPARTMENT|MPD)/i, confidence: 90 },
    { pattern: /(SHELBY\s*COUNTY\s*SHERIFF)/i, confidence: 90 },
    { pattern: /(TENNESSEE\s*HIGHWAY\s*PATROL|THP|STATE\s*TROOPER)/i, confidence: 90 },
    { pattern: /(CITY\s*OF\s*MEMPHIS)/i, confidence: 85 },
    { pattern: /(SCSO)/i, confidence: 80 },
  ], 'Agency');

  // OFFICER INFO
  fields.officerName = extractWithPatterns(text, [
    { pattern: /OFFICER[:\s]*([A-Z]+(?:\.\s*)?(?:[A-Z]+)?)/i, confidence: 80 },
    { pattern: /OFC\.?\s*([A-Z]+(?:\.\s*)?(?:[A-Z]+)?)/i, confidence: 80 },
    { pattern: /TROOPER[:\s]*([A-Z]+(?:\.\s*)?(?:[A-Z]+)?)/i, confidence: 80 },
    { pattern: /CITING\s*OFFICER[:\s]*([A-Z]+(?:\s+[A-Z]+)?)/i, confidence: 75 },
  ], 'Officer Name');

  fields.officerBadge = extractWithPatterns(text, [
    { pattern: /BADGE\s*(?:#|NO\.?)?[:\s]*(\d+)/i, confidence: 85 },
    { pattern: /#\s*(\d{3,6})/i, confidence: 60 },
  ], 'Badge Number');

  // VIOLATION LOCATION
  fields.violationLocation = extractWithPatterns(text, [
    { pattern: /LOCATION[:\s]*([^\n]+)/i, confidence: 80 },
    { pattern: /(?:AT|ON|NEAR)[:\s]*(\d+\s+[A-Z\s]+(?:ST|AVE|BLVD|RD|DR|HWY|PKWY)[^\n]*)/i, confidence: 75 },
    { pattern: /(I-\d+|INTERSTATE\s*\d+)[^\n]*/i, confidence: 85 },
    { pattern: /(\d+\s+[A-Z\s]+(?:STREET|AVENUE|BOULEVARD|ROAD|DRIVE|HIGHWAY|PARKWAY))/i, confidence: 70 },
  ], 'Violation Location');

  // Calculate confidence scores
  const allFields = Object.values(fields).filter((f): f is FieldExtraction => f !== undefined);
  const overallConfidence = calculateAverageConfidence(allFields);

  const requiredCheck = checkRequiredFieldsConfidence(
    fields,
    REQUIRED_TICKET_FIELDS
  );

  if (!requiredCheck.meetsThreshold) {
    warnings.push(
      `Unable to read required ticket information with sufficient confidence. ` +
      `Missing or low confidence fields: ${requiredCheck.missingFields.join(', ')}`
    );
  }

  return {
    success: requiredCheck.meetsThreshold,
    overallConfidence,
    requiredFieldsConfidence: requiredCheck.averageConfidence,
    requiresManualReview: !requiredCheck.meetsThreshold,
    fields,
    rawText: ocrResult.rawText,
    warnings,
  };
}

/**
 * Extract TN license data with confidence scoring
 *
 * TENNESSEE DRIVER LICENSE FORMAT:
 * - CLASS: D (regular) or A, B, C (CDL)
 * - License number: typically 7-9 digits
 * - DOB and EXP are labeled
 * - Name is usually LAST on one line, FIRST MIDDLE on next
 */
export function extractLicenseDataWithConfidence(ocrResult: OCRResult): ExtractionResultWithConfidence {
  const text = ocrResult.rawText;
  const upperText = text.toUpperCase();
  const fields: ExtractedFieldsWithConfidence = {};
  const warnings: string[] = [];

  // FULL NAME - TN licenses typically have LAST\nFIRST MIDDLE format
  const namePatterns = [
    // Labeled format
    { pattern: /(?:FN|FIRST\s*NAME?)[:\s]*([A-Z]+)/i, confidence: 90 },
    { pattern: /(?:LN|LAST\s*NAME?)[:\s]*([A-Z]+)/i, confidence: 90 },
    { pattern: /NAME[:\s]*([A-Z]+(?:\s+[A-Z]+)+)/i, confidence: 85 },
    // LASTNAME, FIRSTNAME MIDDLE format
    { pattern: /([A-Z]{2,}),\s*([A-Z]+(?:\s+[A-Z]+)?)/i, confidence: 80 },
  ];

  // Try to find first/last separately
  const fnMatch = upperText.match(/(?:FN|FIRST\s*(?:NAME)?)[:\s]*([A-Z]+)/);
  const lnMatch = upperText.match(/(?:LN|LAST\s*(?:NAME)?)[:\s]*([A-Z]+)/);

  if (fnMatch && lnMatch) {
    fields.firstName = createFieldExtraction(fnMatch[1].trim(), 90, 'ocr');
    fields.lastName = createFieldExtraction(lnMatch[1].trim(), 90, 'ocr');
    fields.fullName = createFieldExtraction(`${fnMatch[1].trim()} ${lnMatch[1].trim()}`, 90, 'ocr');
  } else {
    // Try combined name patterns
    const combinedMatch = upperText.match(/([A-Z]{2,}),\s*([A-Z]+)\s*([A-Z]*)/);
    if (combinedMatch) {
      fields.lastName = createFieldExtraction(combinedMatch[1].trim(), 80, 'ocr');
      fields.firstName = createFieldExtraction(combinedMatch[2].trim(), 80, 'ocr');
      if (combinedMatch[3]) {
        fields.middleName = createFieldExtraction(combinedMatch[3].trim(), 70, 'ocr');
      }
      const parts = [combinedMatch[2], combinedMatch[3], combinedMatch[1]].filter(Boolean);
      fields.fullName = createFieldExtraction(parts.join(' ').trim(), 80, 'ocr');
    } else {
      fields.fullName = emptyFieldExtraction();
      warnings.push('Could not extract name from license');
    }
  }

  // LICENSE NUMBER - 7-9 digits for TN
  const licensePatterns = [
    { pattern: /(?:LIC(?:ENSE)?\.?\s*(?:NO\.?|NUMBER|#)?)[:\s]*(\d{7,9})/i, confidence: 90 },
    { pattern: /(?:DL|D\.L\.)[:\s]*(\d{7,9})/i, confidence: 85 },
  ];

  fields.licenseNumber = extractWithPatterns(upperText, licensePatterns, 'License Number');

  // If still not found, try standalone 7-9 digit number (but lower confidence)
  if (!fields.licenseNumber.value) {
    const standaloneMatch = text.match(/\b(\d{7,9})\b/);
    if (standaloneMatch) {
      const num = standaloneMatch[1];
      // Make sure it's not a date (like 19850520)
      if (!num.match(/^(19|20)\d{6}$/)) {
        fields.licenseNumber = createFieldExtraction(num, 50, 'ocr');
        warnings.push('License number extracted with low confidence - please verify');
      }
    }
  }

  if (!fields.licenseNumber.value) {
    fields.licenseNumber = emptyFieldExtraction();
    warnings.push('Could not extract license number');
  }

  // LICENSE CLASS - CRITICAL: Default to 'D' (regular) if not found
  // Only A, B, C are CDL classes
  const classPatterns = [
    { pattern: /CLASS[:\s]*([ABCDM])\b/i, confidence: 90 },
    { pattern: /\bCLASS\s+([ABCDM])\b/i, confidence: 85 },
  ];

  fields.licenseClass = extractWithPatterns(upperText, classPatterns, 'License Class');

  // If no class found, default to 'D' (regular) with low confidence
  // This prevents false CDL detection
  if (!fields.licenseClass.value) {
    fields.licenseClass = createFieldExtraction('D', 40, 'inferred');
    warnings.push('Could not determine license class - defaulting to regular (Class D)');
  }

  // EXPIRATION DATE
  fields.expirationDate = extractWithPatterns(upperText, [
    { pattern: /EXP(?:IRES?|IRATION)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 90 },
    { pattern: /VALID\s*(?:THRU|THROUGH|UNTIL)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 85 },
  ], 'Expiration Date');

  if (!fields.expirationDate.value) {
    warnings.push('Could not extract expiration date');
  }

  // DATE OF BIRTH
  fields.dateOfBirth = extractWithPatterns(upperText, [
    { pattern: /DOB[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 90 },
    { pattern: /DATE\s*OF\s*BIRTH[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 90 },
    { pattern: /BIRTH\s*DATE[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 85 },
    { pattern: /BORN[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i, confidence: 80 },
  ], 'Date of Birth');

  // ADDRESS
  const addressMatch = upperText.match(
    /(\d+\s+[A-Z0-9\s]+(?:ST|AVE|BLVD|RD|DR|LN|WAY|CT|PL|CIR)[A-Z]*)\s*\n?\s*([A-Z]+,?\s*TN\s*\d{5})/i
  );
  if (addressMatch) {
    fields.address = createFieldExtraction(
      `${addressMatch[1].trim()}, ${addressMatch[2].trim()}`,
      75,
      'ocr'
    );
  } else {
    fields.address = emptyFieldExtraction();
  }

  // Look for ZIP specifically
  const zipMatch = text.match(/\b(\d{5}(?:-\d{4})?)\b/);
  if (zipMatch) {
    fields.zipCode = createFieldExtraction(zipMatch[1], 80, 'ocr');
    fields.state = createFieldExtraction('TN', 85, 'inferred');
  }

  // ENDORSEMENTS - Check for CDL endorsements
  const endorsementMatch = upperText.match(/ENDORSEMENTS?[:\s]*([HNPTXS,\s]+)/i);
  if (endorsementMatch) {
    const codes = endorsementMatch[1].split(/[,\s]+/).filter(c => c.length === 1);
    if (codes.length > 0) {
      fields.endorsements = createFieldExtraction(codes, 85, 'ocr');
    }
  }

  // Calculate confidence scores
  const allFields = Object.values(fields).filter((f): f is FieldExtraction => f !== undefined);
  const overallConfidence = calculateAverageConfidence(allFields);

  const requiredCheck = checkRequiredFieldsConfidence(
    fields,
    REQUIRED_LICENSE_FIELDS
  );

  if (!requiredCheck.meetsThreshold) {
    warnings.push(
      `Unable to read required license information with sufficient confidence. ` +
      `Missing or low confidence fields: ${requiredCheck.missingFields.join(', ')}`
    );
  }

  return {
    success: requiredCheck.meetsThreshold,
    overallConfidence,
    requiredFieldsConfidence: requiredCheck.averageConfidence,
    requiresManualReview: !requiredCheck.meetsThreshold,
    fields,
    rawText: ocrResult.rawText,
    warnings,
  };
}
