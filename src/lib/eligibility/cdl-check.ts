/**
 * CDL Detection Utilities
 *
 * CRITICAL: Only flag as CDL if EXPLICITLY stated.
 * Do NOT assume CDL from:
 * - Inability to read the license
 * - Partial text matches
 * - Vehicle type guesses
 *
 * CDL licenses will have one of:
 * - "COMMERCIAL DRIVER LICENSE" text
 * - CLASS A, CLASS B, or CLASS C (NOT CLASS D)
 * - CDL endorsement codes: H, N, P, T, X, S
 *
 * Regular licenses have:
 * - "DRIVER LICENSE" (without COMMERCIAL)
 * - CLASS D or CLASS M (motorcycle)
 */

import {
  ExtractionResultWithConfidence,
  CDLCheckResult,
  CDL_CLASSES,
  CDL_ENDORSEMENTS,
} from '../ocr/types';

/**
 * Check if a license is CDL based on extracted data
 *
 * DEFAULT IS NOT CDL - we only return true if we have explicit evidence
 */
export function isCDLLicense(extractionResult: ExtractionResultWithConfidence): CDLCheckResult {
  const rawText = extractionResult.rawText.toUpperCase();
  const licenseClass = extractionResult.fields.licenseClass?.value?.toUpperCase();
  const classConfidence = extractionResult.fields.licenseClass?.confidence || 0;

  // Check for explicit "COMMERCIAL DRIVER LICENSE" text (highest confidence)
  if (
    rawText.includes('COMMERCIAL DRIVER LICENSE') ||
    rawText.includes('COMMERCIAL DRIVER LIC') ||
    rawText.includes('COMMERCIAL DL')
  ) {
    return {
      isCDL: true,
      confidence: 95,
      reason: 'License explicitly states COMMERCIAL DRIVER LICENSE',
    };
  }

  // Check license class - only A, B, C are CDL
  if (licenseClass && (CDL_CLASSES as readonly string[]).includes(licenseClass)) {
    // Only flag as CDL if we're confident about the class
    if (classConfidence >= 80) {
      return {
        isCDL: true,
        confidence: classConfidence,
        reason: `License class ${licenseClass} is a CDL class`,
      };
    }

    // If class extraction is uncertain, don't assume CDL
    return {
      isCDL: false,
      confidence: 50,
      reason: `License class ${licenseClass} detected but with low confidence (${classConfidence}%) - not assuming CDL`,
    };
  }

  // Check for CDL endorsements (H, N, P, S, T, X)
  const endorsements = extractionResult.fields.endorsements?.value;
  if (endorsements && Array.isArray(endorsements)) {
    const cdlEndorsements = endorsements.filter((e) =>
      (CDL_ENDORSEMENTS as readonly string[]).includes(e.toUpperCase())
    );

    if (cdlEndorsements.length > 0) {
      const endorsementConfidence = extractionResult.fields.endorsements?.confidence || 0;
      if (endorsementConfidence >= 75) {
        return {
          isCDL: true,
          confidence: endorsementConfidence,
          reason: `CDL endorsements found: ${cdlEndorsements.join(', ')}`,
        };
      }
    }
  }

  // Check raw text for CDL indicator patterns (with caution)
  const explicitCDLPatterns = [
    /\bCDL\b/,
    /COMMERCIAL\s*DRIVER/i,
    /COMMERCIAL\s*VEHICLE\s*OPERATOR/i,
  ];

  for (const pattern of explicitCDLPatterns) {
    if (pattern.test(rawText)) {
      return {
        isCDL: true,
        confidence: 70,
        reason: `CDL indicator found in text: ${pattern.source}`,
      };
    }
  }

  // DEFAULT: NOT CDL
  // If we found CLASS D specifically, we're confident it's NOT CDL
  if (licenseClass === 'D' && classConfidence >= 70) {
    return {
      isCDL: false,
      confidence: 90,
      reason: 'License class D is a regular (non-CDL) license',
    };
  }

  // If we found CLASS M (motorcycle), it's not CDL
  if (licenseClass === 'M' && classConfidence >= 70) {
    return {
      isCDL: false,
      confidence: 90,
      reason: 'License class M is a motorcycle license (non-CDL)',
    };
  }

  // If we can't determine class clearly, default to NOT CDL
  // with lower confidence - let manual review sort it out
  return {
    isCDL: false,
    confidence: 50,
    reason: 'No CDL indicators found - assuming regular license',
  };
}

/**
 * Check if ticket indicates commercial vehicle involvement
 *
 * Only returns true if EXPLICITLY stated in ticket text
 * Does not guess based on vehicle type or size
 */
export function isCommercialVehicleTicket(ticketText: string): {
  isCommercial: boolean;
  confidence: number;
  reason: string;
} {
  const upperText = ticketText.toUpperCase();

  // Explicit commercial indicators
  const commercialPatterns = [
    { pattern: /\bCDL\b/, reason: 'CDL mentioned in ticket' },
    { pattern: /COMMERCIAL\s*(?:MOTOR\s*)?VEHICLE/i, reason: 'Commercial vehicle mentioned' },
    { pattern: /\bCMV\b/, reason: 'CMV (Commercial Motor Vehicle) mentioned' },
    { pattern: /COMMERCIAL\s*DRIVER/i, reason: 'Commercial driver mentioned' },
  ];

  for (const { pattern, reason } of commercialPatterns) {
    if (pattern.test(upperText)) {
      return {
        isCommercial: true,
        confidence: 85,
        reason,
      };
    }
  }

  // Vehicle type indicators - only if explicitly stated as commercial
  const vehicleTypePatterns = [
    { pattern: /SEMI[-\s]?TRUCK/i, reason: 'Semi-truck mentioned' },
    { pattern: /TRACTOR[-\s]?TRAILER/i, reason: 'Tractor-trailer mentioned' },
    { pattern: /18[-\s]?WHEELER/i, reason: '18-wheeler mentioned' },
    { pattern: /TRUCK[-\s]?TRACTOR/i, reason: 'Truck-tractor mentioned' },
  ];

  for (const { pattern, reason } of vehicleTypePatterns) {
    if (pattern.test(upperText)) {
      return {
        isCommercial: true,
        confidence: 70, // Lower confidence - could be personal ownership
        reason,
      };
    }
  }

  // Default: NOT commercial
  return {
    isCommercial: false,
    confidence: 75,
    reason: 'No commercial vehicle indicators found',
  };
}
