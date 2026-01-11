/**
 * Ticket Eligibility Screening Engine
 *
 * Automatically screens tickets for eligibility based on:
 * - Ticket type (excludes parking tickets)
 * - Vehicle type (excludes CDL/commercial vehicles)
 * - Speed over limit thresholds by jurisdiction/division
 *
 * IMPORTANT: Requires 70% confidence threshold for eligibility decisions.
 * When confidence is low, sends to manual review instead of rejecting.
 */

import { ExtractedTicketData, ExtractedLicenseData } from '@/lib/ocr/ocr-provider';
import { ExtractionResultWithConfidence, CONFIDENCE_THRESHOLD } from '@/lib/ocr/types';
import { isCDLLicense, isCommercialVehicleTicket } from './cdl-check';
import { checkSpeedEligibility, calculateSpeedOver, hasSpeedData } from './check-speed';
import { CourtJurisdiction, SPEED_LIMITS_BY_JURISDICTION } from '@/lib/constants/jurisdictions';

export type Jurisdiction = 'CITY_OF_MEMPHIS' | 'SHELBY_COUNTY' | 'TN_HIGHWAY_PATROL' | 'UNKNOWN';
export type Division = 'DIVISION_1' | 'DIVISION_2' | 'DIVISION_3' | 'UNKNOWN';

export interface TicketScreeningResult {
  eligible: boolean | null; // null = unknown, requires manual review
  status: 'accepted_for_review' | 'auto_rejected' | 'manual_review_required';
  rejectionReason?: string;
  rejectionCode?: 'PARKING_TICKET' | 'CDL_VEHICLE' | 'SPEED_OVER_LIMIT' | 'MANUAL_REVIEW_REQUIRED' | 'LOW_CONFIDENCE';
  requiresManualReview: boolean;
  speedOver?: number | null;
  jurisdiction?: Jurisdiction;
  division?: Division;
  cdlDetected?: boolean;
  warnings?: string[];
  confidenceInfo?: {
    ticketConfidence: number;
    licenseConfidence: number;
    meetsThreshold: boolean;
  };
}

export interface ScreeningInput {
  ticketData: ExtractedTicketData;
  licenseData?: ExtractedLicenseData;
}

export interface ScreeningInputWithConfidence {
  ticketExtraction: ExtractionResultWithConfidence;
  licenseExtraction?: ExtractionResultWithConfidence;
}

/**
 * Input for screening using the user-selected jurisdiction dropdown
 * This is the preferred method as it uses explicit user input rather than OCR
 */
export interface DropdownScreeningInput {
  courtJurisdiction: CourtJurisdiction;
  speedLimit?: string | number;
  actualSpeed?: string | number;
  licenseClass?: string;
  violationDescription?: string;
}

/**
 * Screen a ticket for eligibility
 * Run this after OCR extraction, before payment
 */
export function screenTicket(input: ScreeningInput): TicketScreeningResult {
  const { ticketData, licenseData } = input;

  // 1. CHECK FOR PARKING TICKETS
  if (isParkingTicket(ticketData)) {
    return {
      eligible: false,
      status: 'auto_rejected',
      rejectionReason: 'Parking tickets are not eligible for this service. We only handle moving violations such as speeding tickets.',
      rejectionCode: 'PARKING_TICKET',
      requiresManualReview: false,
    };
  }

  // 2. CHECK FOR CDL VEHICLES
  if (isCDLVehicle(ticketData, licenseData)) {
    return {
      eligible: false,
      status: 'auto_rejected',
      rejectionReason: 'CDL-related tickets require specialized representation due to the potential impact on your commercial driving privileges. Please contact us directly for a consultation.',
      rejectionCode: 'CDL_VEHICLE',
      requiresManualReview: false,
    };
  }

  // 3. PARSE SPEED OVER LIMIT
  const speedOver = extractSpeedOverLimit(ticketData);

  // 4. DETERMINE JURISDICTION AND DIVISION
  const jurisdiction = determineJurisdiction(ticketData);
  const division = determineDivision(ticketData);

  // If we can't determine speed, send to manual review
  if (speedOver === null) {
    return {
      eligible: true,
      status: 'accepted_for_review',
      requiresManualReview: true,
      speedOver: null,
      jurisdiction,
      division,
    };
  }

  // 5. APPLY SPEED RULES BY JURISDICTION
  if (jurisdiction === 'CITY_OF_MEMPHIS') {
    if (division === 'DIVISION_1' || division === 'DIVISION_2') {
      if (speedOver > 15) {
        return {
          eligible: false,
          status: 'auto_rejected',
          rejectionReason: `Tickets over 15 MPH in Memphis ${formatDivision(division)} are not eligible for our online service. Your ticket shows ${speedOver} MPH over the limit. Please contact us directly for a consultation.`,
          rejectionCode: 'SPEED_OVER_LIMIT',
          requiresManualReview: false,
          speedOver,
          jurisdiction,
          division,
        };
      }
    } else if (division === 'DIVISION_3') {
      if (speedOver > 10) {
        return {
          eligible: false,
          status: 'auto_rejected',
          rejectionReason: `Tickets over 10 MPH in Memphis Division 3 are not eligible for our online service. Your ticket shows ${speedOver} MPH over the limit. Please contact us directly for a consultation.`,
          rejectionCode: 'SPEED_OVER_LIMIT',
          requiresManualReview: false,
          speedOver,
          jurisdiction,
          division,
        };
      }
    }
  } else if (jurisdiction === 'SHELBY_COUNTY' || jurisdiction === 'TN_HIGHWAY_PATROL') {
    if (speedOver > 15) {
      const jurisdictionLabel = jurisdiction === 'SHELBY_COUNTY' ? 'Shelby County' : 'Tennessee Highway Patrol';
      return {
        eligible: false,
        status: 'auto_rejected',
        rejectionReason: `${jurisdictionLabel} tickets over 15 MPH are not eligible for our online service. Your ticket shows ${speedOver} MPH over the limit. Please contact us directly for a consultation.`,
        rejectionCode: 'SPEED_OVER_LIMIT',
        requiresManualReview: false,
        speedOver,
        jurisdiction,
        division,
      };
    }
  }

  // PASSED ALL CHECKS
  return {
    eligible: true,
    status: 'accepted_for_review',
    requiresManualReview: false,
    speedOver,
    jurisdiction,
    division,
  };
}

/**
 * Screen a ticket using confidence-based extraction results
 *
 * This is the preferred screening method that uses confidence scoring
 * to make reliable eligibility decisions.
 *
 * Key principle: When in doubt, don't decide - send to manual review.
 */
export function screenTicketWithConfidence(
  input: ScreeningInputWithConfidence
): TicketScreeningResult {
  const { ticketExtraction, licenseExtraction } = input;
  const warnings: string[] = [...ticketExtraction.warnings];

  if (licenseExtraction) {
    warnings.push(...licenseExtraction.warnings);
  }

  // FIRST: Check if we have enough confidence to make ANY decision
  const ticketConfidence = ticketExtraction.requiredFieldsConfidence;
  const licenseConfidence = licenseExtraction?.requiredFieldsConfidence || 0;
  const meetsThreshold = ticketExtraction.success && (!licenseExtraction || licenseExtraction.success);

  const confidenceInfo = {
    ticketConfidence,
    licenseConfidence,
    meetsThreshold,
  };

  // If required fields are below confidence threshold, send to manual review
  if (!meetsThreshold) {
    return {
      eligible: null,
      status: 'manual_review_required',
      rejectionCode: 'LOW_CONFIDENCE',
      rejectionReason:
        'We could not read all required information from your documents with sufficient confidence. ' +
        'A member of our team will review your submission and contact you within 2 business days.',
      requiresManualReview: true,
      warnings,
      confidenceInfo,
    };
  }

  // Check for parking ticket
  const rawText = ticketExtraction.rawText.toLowerCase();
  const violationDesc = ticketExtraction.fields.violationDescription?.value?.toLowerCase() || '';
  const parkingKeywords = ['parking', 'meter', 'no parking', 'fire lane', 'handicap parking', 'double parking'];

  if (parkingKeywords.some((kw) => violationDesc.includes(kw) || rawText.includes(kw))) {
    return {
      eligible: false,
      status: 'auto_rejected',
      rejectionCode: 'PARKING_TICKET',
      rejectionReason: 'Parking tickets are not eligible for this service.',
      requiresManualReview: false,
      confidenceInfo,
    };
  }

  // Check CDL - but only if we're confident about the license data
  if (licenseExtraction) {
    const cdlCheck = isCDLLicense(licenseExtraction);

    if (cdlCheck.isCDL && cdlCheck.confidence >= 80) {
      return {
        eligible: false,
        status: 'auto_rejected',
        rejectionCode: 'CDL_VEHICLE',
        rejectionReason:
          'CDL-related tickets require specialized representation. Please contact us directly for assistance.',
        requiresManualReview: false,
        cdlDetected: true,
        confidenceInfo,
      };
    }

    // If CDL check is uncertain (detected but low confidence), flag for review
    if (cdlCheck.isCDL && cdlCheck.confidence < 80) {
      return {
        eligible: null,
        status: 'manual_review_required',
        rejectionCode: 'MANUAL_REVIEW_REQUIRED',
        rejectionReason:
          'We need to verify some details about your license. ' +
          'A member of our team will review your submission and contact you within 2 business days.',
        requiresManualReview: true,
        warnings: [...warnings, 'License type could not be confidently determined'],
        confidenceInfo,
      };
    }
  }

  // Check for commercial vehicle in ticket text
  const commercialCheck = isCommercialVehicleTicket(ticketExtraction.rawText);
  if (commercialCheck.isCommercial && commercialCheck.confidence >= 75) {
    return {
      eligible: false,
      status: 'auto_rejected',
      rejectionCode: 'CDL_VEHICLE',
      rejectionReason:
        'Commercial vehicle tickets require specialized representation. Please contact us directly for assistance.',
      requiresManualReview: false,
      cdlDetected: true,
      confidenceInfo,
    };
  }

  // Get speed over - only if confident
  const speedOverField = ticketExtraction.fields.speedOver;
  const speedOver = speedOverField?.value ?? null;
  const speedConfidence = speedOverField?.confidence ?? 0;

  // Determine jurisdiction and division from fields
  const jurisdiction = determineJurisdictionFromFields(ticketExtraction);
  const division = determineDivisionFromFields(ticketExtraction);

  // If we can't determine speed with enough confidence, send to manual review
  if (speedOver === null || speedConfidence < CONFIDENCE_THRESHOLD) {
    return {
      eligible: null,
      status: 'manual_review_required',
      rejectionCode: 'MANUAL_REVIEW_REQUIRED',
      rejectionReason:
        'We could not determine the speed violation details from your ticket with sufficient confidence. ' +
        'A member of our team will review your submission and contact you within 2 business days.',
      requiresManualReview: true,
      speedOver: speedOver,
      jurisdiction,
      division,
      warnings,
      confidenceInfo,
    };
  }

  // Apply speed rules by jurisdiction (same as original logic)
  if (jurisdiction === 'CITY_OF_MEMPHIS') {
    if (division === 'DIVISION_1' || division === 'DIVISION_2') {
      if (speedOver > 15) {
        return {
          eligible: false,
          status: 'auto_rejected',
          rejectionCode: 'SPEED_OVER_LIMIT',
          rejectionReason: `Tickets over 15 MPH in Memphis ${formatDivision(division)} are not eligible for our online service. Your ticket shows ${speedOver} MPH over the limit. Please contact us directly for a consultation.`,
          requiresManualReview: false,
          speedOver,
          jurisdiction,
          division,
          confidenceInfo,
        };
      }
    } else if (division === 'DIVISION_3') {
      if (speedOver > 10) {
        return {
          eligible: false,
          status: 'auto_rejected',
          rejectionCode: 'SPEED_OVER_LIMIT',
          rejectionReason: `Tickets over 10 MPH in Memphis Division 3 are not eligible for our online service. Your ticket shows ${speedOver} MPH over the limit. Please contact us directly for a consultation.`,
          requiresManualReview: false,
          speedOver,
          jurisdiction,
          division,
          confidenceInfo,
        };
      }
    }
  } else if (jurisdiction === 'SHELBY_COUNTY' || jurisdiction === 'TN_HIGHWAY_PATROL') {
    if (speedOver > 15) {
      const jurisdictionLabel = jurisdiction === 'SHELBY_COUNTY' ? 'Shelby County' : 'Tennessee Highway Patrol';
      return {
        eligible: false,
        status: 'auto_rejected',
        rejectionCode: 'SPEED_OVER_LIMIT',
        rejectionReason: `${jurisdictionLabel} tickets over 15 MPH are not eligible for our online service. Your ticket shows ${speedOver} MPH over the limit. Please contact us directly for a consultation.`,
        requiresManualReview: false,
        speedOver,
        jurisdiction,
        division,
        confidenceInfo,
      };
    }
  }

  // PASSED ALL CHECKS
  return {
    eligible: true,
    status: 'accepted_for_review',
    requiresManualReview: false,
    speedOver,
    jurisdiction,
    division,
    confidenceInfo,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Screen a ticket using the user-selected jurisdiction dropdown
 *
 * This is the preferred screening method because:
 * 1. Uses explicit user selection instead of OCR guessing
 * 2. More reliable jurisdiction/speed limit determination
 * 3. Simpler logic flow
 *
 * Call this INSTEAD of screenTicket/screenTicketWithConfidence
 * when the user has selected a jurisdiction from the dropdown.
 */
export function screenTicketWithDropdown(input: DropdownScreeningInput): TicketScreeningResult {
  const { courtJurisdiction, speedLimit, actualSpeed, licenseClass, violationDescription } = input;

  // 1. CHECK FOR PARKING TICKETS (from violation description if provided)
  if (violationDescription) {
    const parkingKeywords = ['parking', 'meter', 'no parking', 'fire lane', 'handicap', 'double parking'];
    const violationLower = violationDescription.toLowerCase();
    if (parkingKeywords.some((kw) => violationLower.includes(kw))) {
      return {
        eligible: false,
        status: 'auto_rejected',
        rejectionReason: 'Parking tickets are not eligible for this service. We only handle moving violations such as speeding tickets.',
        rejectionCode: 'PARKING_TICKET',
        requiresManualReview: false,
      };
    }
  }

  // 2. CHECK FOR CDL VEHICLES (from license class if provided)
  if (licenseClass) {
    const classUpper = licenseClass.toUpperCase();
    if (classUpper === 'A' || classUpper === 'B' || classUpper.includes('CDL')) {
      return {
        eligible: false,
        status: 'auto_rejected',
        rejectionReason: 'CDL-related tickets require specialized representation due to the potential impact on your commercial driving privileges. Please contact us directly for a consultation.',
        rejectionCode: 'CDL_VEHICLE',
        requiresManualReview: false,
        cdlDetected: true,
      };
    }
  }

  // 3. CHECK SPEED ELIGIBILITY (if speed data provided)
  if (hasSpeedData(speedLimit, actualSpeed)) {
    const speedOver = calculateSpeedOver(speedLimit!, actualSpeed!);

    if (speedOver !== null && speedOver > 0) {
      const speedCheck = checkSpeedEligibility(courtJurisdiction, speedOver);

      if (!speedCheck.eligible) {
        return {
          eligible: false,
          status: 'auto_rejected',
          rejectionReason: speedCheck.reason!,
          rejectionCode: 'SPEED_OVER_LIMIT',
          requiresManualReview: false,
          speedOver,
        };
      }

      // Speed is within limits
      return {
        eligible: true,
        status: 'accepted_for_review',
        requiresManualReview: false,
        speedOver,
      };
    }
  }

  // 4. PASSED ALL CHECKS (or no speed data to check)
  // Accepted for review - human will verify details
  return {
    eligible: true,
    status: 'accepted_for_review',
    requiresManualReview: false,
    speedOver: null,
  };
}

/**
 * Get the maximum speed over limit for a jurisdiction
 * Useful for displaying limits to users
 */
export function getMaxSpeedOverForJurisdiction(jurisdiction: CourtJurisdiction): number {
  const limits = SPEED_LIMITS_BY_JURISDICTION[jurisdiction];
  return limits?.maxOver ?? 15; // Default to 15 if unknown
}

/**
 * Determine jurisdiction from confidence-based extraction
 */
function determineJurisdictionFromFields(extraction: ExtractionResultWithConfidence): Jurisdiction {
  const courtLocation = (extraction.fields.courtLocation?.value || '').toLowerCase();
  const agency = (extraction.fields.issuingAgency?.value || '').toLowerCase();
  const rawText = extraction.rawText.toLowerCase();

  // Memphis indicators
  const memphisIndicators = ['memphis', 'mpd', 'memphis police', 'city of memphis', '201 poplar'];
  if (memphisIndicators.some((ind) => courtLocation.includes(ind) || agency.includes(ind) || rawText.includes(ind))) {
    return 'CITY_OF_MEMPHIS';
  }

  // Shelby County indicators
  const shelbyIndicators = ['shelby county', 'shelby co', 'scso', 'general sessions'];
  if (shelbyIndicators.some((ind) => courtLocation.includes(ind) || agency.includes(ind) || rawText.includes(ind))) {
    return 'SHELBY_COUNTY';
  }

  // THP indicators
  const thpIndicators = ['highway patrol', 'thp', 'state trooper', 'tn highway'];
  if (thpIndicators.some((ind) => agency.includes(ind) || rawText.includes(ind))) {
    return 'TN_HIGHWAY_PATROL';
  }

  return 'UNKNOWN';
}

/**
 * Determine division from confidence-based extraction
 */
function determineDivisionFromFields(extraction: ExtractionResultWithConfidence): Division {
  const divisionField = extraction.fields.courtDivision?.value?.toUpperCase() || '';
  const rawText = extraction.rawText.toLowerCase();

  // Check field first
  if (divisionField.includes('1') || divisionField === 'I') return 'DIVISION_1';
  if (divisionField.includes('2') || divisionField === 'II') return 'DIVISION_2';
  if (divisionField.includes('3') || divisionField === 'III') return 'DIVISION_3';

  // Fall back to raw text patterns
  if (/division\s*1|div\.?\s*1|div\s+i\b/i.test(rawText)) return 'DIVISION_1';
  if (/division\s*2|div\.?\s*2|div\s+ii\b/i.test(rawText)) return 'DIVISION_2';
  if (/division\s*3|div\.?\s*3|div\s+iii\b/i.test(rawText)) return 'DIVISION_3';

  return 'UNKNOWN';
}

/**
 * Check if ticket is a parking ticket
 */
function isParkingTicket(ticketData: ExtractedTicketData): boolean {
  const parkingKeywords = [
    'parking',
    'expired meter',
    'no parking',
    'overtime parking',
    'parking violation',
    'handicap parking',
    'fire lane',
    'meter violation',
    'park prohibited',
    'double parking',
    'parallel parking',
    'parking meter',
    'street sweeping',
    'permit parking',
  ];

  const violationText = (ticketData.violations?.join(' ') || '').toLowerCase();
  const rawText = (ticketData.rawText || '').toLowerCase();

  return parkingKeywords.some(
    (keyword) => violationText.includes(keyword) || rawText.includes(keyword.replace(' ', ''))
  );
}

/**
 * Check if this is a CDL/commercial vehicle ticket
 */
function isCDLVehicle(ticketData: ExtractedTicketData, licenseData?: ExtractedLicenseData): boolean {
  // Check license class from extracted license data
  if (licenseData?.licenseClass) {
    const licenseClass = licenseData.licenseClass.toUpperCase();
    if (licenseClass.includes('CLASS A') || licenseClass.includes('CLASS B') || licenseClass.includes('CDL')) {
      return true;
    }
  }

  // Check license endorsements for commercial
  if (licenseData?.endorsements?.length) {
    const commercialEndorsements = ['H', 'N', 'P', 'S', 'T', 'X'];
    if (licenseData.endorsements.some((e) => commercialEndorsements.includes(e.toUpperCase()))) {
      return true;
    }
  }

  // Check raw text for CDL indicators
  const rawText = (ticketData.rawText || '').toLowerCase();

  const cdlIndicators = [
    'class a',
    'class b',
    'class c cdl',
    'commercial driver',
    'cdl',
    'commercial license',
    'cmv',
    'commercial motor vehicle',
  ];

  const commercialVehicleTypes = [
    'commercial',
    'semi',
    'tractor',
    '18 wheeler',
    '18-wheeler',
    'box truck',
    'delivery truck',
    'truck tractor',
    'tractor trailer',
    'semi-truck',
    'big rig',
    'commercial vehicle',
    'commercial truck',
  ];

  return (
    cdlIndicators.some((ind) => rawText.includes(ind)) ||
    commercialVehicleTypes.some((type) => rawText.includes(type))
  );
}

/**
 * Extract speed over limit from ticket text
 * Returns null if speed cannot be determined
 */
export function extractSpeedOverLimit(ticketData: ExtractedTicketData): number | null {
  const violationText = (ticketData.violations?.join(' ') || '').toLowerCase();
  const rawText = (ticketData.rawText || '').toLowerCase();
  const combined = `${violationText} ${rawText}`;

  // Pattern: "65 in a 55" or "65 in 55" or "65mph in a 55mph"
  const inAPattern = /(\d+)\s*(?:mph)?\s*in\s*(?:a\s*)?(\d+)/i;
  const inAMatch = combined.match(inAPattern);
  if (inAMatch) {
    const actual = parseInt(inAMatch[1]);
    const limit = parseInt(inAMatch[2]);
    if (actual > limit && actual < 200 && limit < 100) {
      return actual - limit;
    }
  }

  // Pattern: "65/55" or "65 / 55"
  const slashPattern = /(\d{2,3})\s*\/\s*(\d{2,3})/;
  const slashMatch = combined.match(slashPattern);
  if (slashMatch) {
    const actual = parseInt(slashMatch[1]);
    const limit = parseInt(slashMatch[2]);
    if (actual > limit && actual < 200 && limit < 100) {
      return actual - limit;
    }
  }

  // Pattern: "10 over" or "10 mph over" or "10mph over the limit"
  const overPattern = /(\d+)\s*(?:mph\s*)?over/i;
  const overMatch = combined.match(overPattern);
  if (overMatch) {
    const over = parseInt(overMatch[1]);
    if (over > 0 && over < 100) {
      return over;
    }
  }

  // Pattern: "exceeding speed limit by 10" or "10 mph excess speed"
  const exceedPattern = /(?:exceeding|excess)\s*(?:speed\s*)?(?:limit\s*)?(?:by\s*)?(\d+)/i;
  const exceedMatch = combined.match(exceedPattern);
  if (exceedMatch) {
    const over = parseInt(exceedMatch[1]);
    if (over > 0 && over < 100) {
      return over;
    }
  }

  return null; // Couldn't determine
}

/**
 * Determine jurisdiction from ticket data
 */
export function determineJurisdiction(ticketData: ExtractedTicketData): Jurisdiction {
  const courtLocation = (ticketData.courtLocation || '').toLowerCase();
  const rawText = (ticketData.rawText || '').toLowerCase();
  const violationLocation = (ticketData.violationLocation || '').toLowerCase();

  // Memphis indicators
  const memphisIndicators = [
    'memphis',
    'mpd',
    'memphis police',
    'city of memphis',
    'memphis city court',
    '201 poplar',
  ];
  if (memphisIndicators.some((ind) => courtLocation.includes(ind) || rawText.includes(ind))) {
    return 'CITY_OF_MEMPHIS';
  }

  // Shelby County indicators
  const shelbyIndicators = [
    'shelby county',
    'shelby co',
    'scso',
    'shelby county sheriff',
    'general sessions',
  ];
  if (shelbyIndicators.some((ind) => courtLocation.includes(ind) || rawText.includes(ind))) {
    return 'SHELBY_COUNTY';
  }

  // THP indicators
  const thpIndicators = [
    'tennessee highway patrol',
    'thp',
    'state trooper',
    'highway patrol',
    'tn highway',
  ];
  if (thpIndicators.some((ind) => rawText.includes(ind))) {
    return 'TN_HIGHWAY_PATROL';
  }

  // Try to infer from location
  if (violationLocation.includes('memphis') || violationLocation.includes('mpd')) {
    return 'CITY_OF_MEMPHIS';
  }

  return 'UNKNOWN';
}

/**
 * Determine court division from ticket data
 */
export function determineDivision(ticketData: ExtractedTicketData): Division {
  const courtLocation = (ticketData.courtLocation || '').toLowerCase();
  const rawText = (ticketData.rawText || '').toLowerCase();
  const combined = `${courtLocation} ${rawText}`;

  // Division patterns
  const div1Patterns = [/division\s*1/i, /div\.?\s*1/i, /div\s+i\b/i, /division\s+i\b/i];
  const div2Patterns = [/division\s*2/i, /div\.?\s*2/i, /div\s+ii\b/i, /division\s+ii\b/i];
  const div3Patterns = [/division\s*3/i, /div\.?\s*3/i, /div\s+iii\b/i, /division\s+iii\b/i];

  if (div1Patterns.some((p) => p.test(combined))) {
    return 'DIVISION_1';
  }
  if (div2Patterns.some((p) => p.test(combined))) {
    return 'DIVISION_2';
  }
  if (div3Patterns.some((p) => p.test(combined))) {
    return 'DIVISION_3';
  }

  return 'UNKNOWN';
}

/**
 * Format division for display
 */
function formatDivision(division: Division): string {
  switch (division) {
    case 'DIVISION_1':
      return 'Division 1';
    case 'DIVISION_2':
      return 'Division 2';
    case 'DIVISION_3':
      return 'Division 3';
    default:
      return 'City Court';
  }
}

/**
 * Get human-readable jurisdiction label
 */
export function getJurisdictionLabel(jurisdiction: Jurisdiction): string {
  switch (jurisdiction) {
    case 'CITY_OF_MEMPHIS':
      return 'City of Memphis';
    case 'SHELBY_COUNTY':
      return 'Shelby County';
    case 'TN_HIGHWAY_PATROL':
      return 'Tennessee Highway Patrol';
    default:
      return 'Unknown Jurisdiction';
  }
}
