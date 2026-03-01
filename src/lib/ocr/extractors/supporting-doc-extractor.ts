import { OCRResult, ExtractedSupportingDocData } from '../ocr-provider';

/**
 * Extract structured data from supporting documents
 * (insurance cards, vehicle registration, etc.)
 */
export function extractSupportingDocData(ocrResult: OCRResult): ExtractedSupportingDocData {
  const text = ocrResult.rawText.toUpperCase();
  const warnings: string[] = [];

  // Determine document subtype
  const documentSubtype = detectDocumentSubtype(text);

  // Extract based on subtype
  let policyNumber: string | null = null;
  let insuranceCompany: string | null = null;
  let effectiveDate: string | null = null;
  let expirationDate: string | null = null;
  let vehicleInfo: string | null = null;
  let vinNumber: string | null = null;
  let plateNumber: string | null = null;
  let insuredName: string | null = null;

  if (documentSubtype === 'insurance') {
    policyNumber = extractPolicyNumber(text);
    if (!policyNumber) warnings.push('Could not parse policy number - please verify');

    insuranceCompany = extractInsuranceCompany(text);
    if (!insuranceCompany) warnings.push('Could not identify insurance company - please verify');

    effectiveDate = extractEffectiveDate(text);
    expirationDate = extractExpirationDate(text);
    if (!expirationDate) warnings.push('Could not parse expiration date - please verify');

    insuredName = extractInsuredName(text);
    vehicleInfo = extractVehicleInfo(text);
    vinNumber = extractVIN(text);
  } else if (documentSubtype === 'registration') {
    plateNumber = extractPlateNumber(text);
    if (!plateNumber) warnings.push('Could not parse plate number - please verify');

    vinNumber = extractVIN(text);
    vehicleInfo = extractVehicleInfo(text);
    expirationDate = extractRegistrationExpiration(text);
    insuredName = extractOwnerName(text);
  } else {
    warnings.push('Could not determine document type - please review manually');
  }

  return {
    documentType: 'supporting',
    rawText: ocrResult.rawText,
    confidence: ocrResult.confidence,
    extractionWarnings: warnings,
    documentSubtype,
    policyNumber,
    insuranceCompany,
    effectiveDate,
    expirationDate,
    vehicleInfo,
    vinNumber,
    plateNumber,
    insuredName,
  };
}

/**
 * Detect the subtype of supporting document
 */
function detectDocumentSubtype(text: string): 'insurance' | 'registration' | 'other' | null {
  // Insurance indicators
  const insuranceKeywords = [
    'INSURANCE', 'POLICY', 'INSURED', 'COVERAGE', 'LIABILITY',
    'PROOF OF INSURANCE', 'INSURANCE CARD', 'AUTO INSURANCE',
    'UNDERWRITTEN', 'PREMIUM', 'STATE FARM', 'GEICO', 'PROGRESSIVE',
    'ALLSTATE', 'NATIONWIDE', 'FARMERS', 'USAA', 'LIBERTY MUTUAL',
  ];

  // Registration indicators
  const registrationKeywords = [
    'REGISTRATION', 'VEHICLE REGISTRATION', 'TITLE', 'CERTIFICATE',
    'PLATE', 'TAG', 'DECAL', 'RENEWAL', 'DEPT OF MOTOR', 'DMV',
    'REGISTERED OWNER', 'TENNESSEE REGISTRATION',
  ];

  let insuranceScore = 0;
  let registrationScore = 0;

  for (const keyword of insuranceKeywords) {
    if (text.includes(keyword)) {
      insuranceScore++;
    }
  }

  for (const keyword of registrationKeywords) {
    if (text.includes(keyword)) {
      registrationScore++;
    }
  }

  if (insuranceScore > registrationScore && insuranceScore >= 2) {
    return 'insurance';
  } else if (registrationScore > insuranceScore && registrationScore >= 2) {
    return 'registration';
  } else if (insuranceScore > 0 || registrationScore > 0) {
    return insuranceScore > registrationScore ? 'insurance' : 'registration';
  }

  return 'other';
}

/**
 * Extract insurance policy number
 */
function extractPolicyNumber(text: string): string | null {
  const patterns = [
    /POLICY\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /POL(?:ICY)?\s*#?[:\s]*([A-Z0-9-]+)/i,
    /(?:NO|NUMBER)[:\s]*([A-Z]{2,3}[\s-]?\d{6,12})/i,
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
 * Extract insurance company name
 */
function extractInsuranceCompany(text: string): string | null {
  const companies = [
    'STATE FARM', 'GEICO', 'PROGRESSIVE', 'ALLSTATE', 'USAA',
    'LIBERTY MUTUAL', 'NATIONWIDE', 'FARMERS', 'TRAVELERS',
    'AMERICAN FAMILY', 'ERIE INSURANCE', 'AUTO-OWNERS',
    'SAFECO', 'HARTFORD', 'MERCURY', 'INFINITY', 'SHELTER',
    'TENNESSEE FARMERS', 'DIRECT AUTO', 'ACCEPTANCE',
  ];

  for (const company of companies) {
    if (text.includes(company)) {
      return company;
    }
  }

  // Try to find company name near "INSURANCE" keyword
  const companyMatch = text.match(/([A-Z]+(?:\s+[A-Z]+)?)\s+INSURANCE/i);
  if (companyMatch) {
    return companyMatch[1].trim();
  }

  return null;
}

/**
 * Extract effective date
 */
function extractEffectiveDate(text: string): string | null {
  const patterns = [
    /EFF(?:ECTIVE)?\s*(?:DATE)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /COVERAGE\s*(?:FROM|BEGINS?)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /FROM[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
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
 */
function extractExpirationDate(text: string): string | null {
  const patterns = [
    /EXP(?:IRES?|IRATION)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(?:COVERAGE\s*)?(?:TO|ENDS?|THROUGH|THRU)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /VALID\s*(?:THRU|THROUGH|UNTIL)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
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
 * Extract insured name
 */
function extractInsuredName(text: string): string | null {
  const patterns = [
    /(?:NAMED\s*)?INSURED[:\s]*([A-Z]+(?:\s+[A-Z]+)*)/i,
    /POLICYHOLDER[:\s]*([A-Z]+(?:\s+[A-Z]+)*)/i,
    /NAME[:\s]*([A-Z]+(?:\s+[A-Z]+)*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }

  return null;
}

/**
 * Extract vehicle information
 */
function extractVehicleInfo(text: string): string | null {
  const patterns = [
    /VEHICLE[:\s]*([^\n]+)/i,
    /(\d{4}\s+[A-Z]+\s+[A-Z0-9]+)/i, // Year Make Model
    /(TOYOTA|HONDA|FORD|CHEVROLET|NISSAN|HYUNDAI|KIA|BMW|MERCEDES|LEXUS)[^\n]*/i,
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
 * Extract VIN number
 */
function extractVIN(text: string): string | null {
  const patterns = [
    /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
    /VEHICLE\s*ID(?:ENTIFICATION)?\s*(?:NO|NUMBER)?[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
    /\b([A-HJ-NPR-Z0-9]{17})\b/, // VIN is exactly 17 characters, excluding I, O, Q
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
 * Extract plate number
 */
function extractPlateNumber(text: string): string | null {
  const patterns = [
    /PLATE\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /TAG\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9-]+)/i,
    /LICENSE\s*PLATE[:\s]*([A-Z0-9-]+)/i,
    // TN plate format: 3 letters + 3 numbers or variations
    /\b([A-Z]{3}[\s-]?\d{3,4})\b/,
    /\b(\d{3}[\s-]?[A-Z]{3})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/[\s-]/g, '').toUpperCase();
    }
  }

  return null;
}

/**
 * Extract registration expiration
 */
function extractRegistrationExpiration(text: string): string | null {
  const patterns = [
    /(?:REG(?:ISTRATION)?\s*)?EXP(?:IRES?|IRATION)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /VALID\s*(?:THRU|THROUGH|UNTIL)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(?:REG(?:ISTRATION)?\s*)?EXP(?:IRES?)?[:\s]*(\d{1,2}[-\/]\d{2,4})/i, // MM/YY format
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
 * Extract registered owner name
 */
function extractOwnerName(text: string): string | null {
  const patterns = [
    /(?:REGISTERED\s*)?OWNER[:\s]*([A-Z]+(?:\s+[A-Z]+)*)/i,
    /NAME[:\s]*([A-Z]+(?:\s+[A-Z]+)*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }

  return null;
}

/**
 * Normalize date to MM/DD/YYYY format
 */
function normalizeDate(dateStr: string): string {
  dateStr = dateStr.trim();

  // Handle MM/YY format
  const shortMatch = dateStr.match(/(\d{1,2})[-\/](\d{2})$/);
  if (shortMatch) {
    return `${shortMatch[1].padStart(2, '0')}/01/20${shortMatch[2]}`;
  }

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
