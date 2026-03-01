/**
 * OCR Confidence Calculator
 *
 * Determines if OCR extraction results are reliable enough
 * to make automated eligibility decisions.
 *
 * KEY PRINCIPLE: If confidence < 70% on required fields,
 * DO NOT make any eligibility decision - send to manual review.
 */

import {
  CONFIDENCE_THRESHOLD,
  REQUIRED_TICKET_FIELDS,
  REQUIRED_LICENSE_FIELDS,
  FieldExtraction,
  ExtractedFieldsWithConfidence,
  ExtractionResultWithConfidence,
} from './types';
import { ExtractedTicketData, ExtractedLicenseData } from './ocr-provider';

export interface ConfidenceCheckResult {
  overallConfidence: number;
  requiresManualReview: boolean;
  missingRequired: string[];
  lowConfidenceFields: string[];
  reason?: string;
}

/**
 * Calculate confidence from extraction result with confidence tracking
 */
export function calculateExtractionConfidence(
  fields: ExtractedFieldsWithConfidence,
  requiredFields: readonly string[]
): ConfidenceCheckResult {
  const fieldEntries = Object.entries(fields).filter(
    ([_, field]) => field !== undefined
  ) as [string, FieldExtraction][];

  if (fieldEntries.length === 0) {
    return {
      overallConfidence: 0,
      requiresManualReview: true,
      missingRequired: [...requiredFields],
      lowConfidenceFields: [],
      reason: 'No fields could be extracted from the document.',
    };
  }

  // Calculate overall confidence
  const totalConfidence = fieldEntries.reduce((sum, [_, field]) => sum + (field.confidence || 0), 0);
  const overallConfidence = Math.round(totalConfidence / fieldEntries.length);

  // Check required fields
  const missingRequired: string[] = [];
  const lowConfidenceFields: string[] = [];

  for (const fieldName of requiredFields) {
    const field = fields[fieldName as keyof ExtractedFieldsWithConfidence] as FieldExtraction | undefined;

    if (!field || !field.value) {
      missingRequired.push(fieldName);
    } else if (field.confidence < CONFIDENCE_THRESHOLD) {
      lowConfidenceFields.push(fieldName);
    }
  }

  // Require manual review if:
  // 1. Overall confidence below threshold
  // 2. Any required field missing
  // 3. Any required field has low confidence
  const requiresManualReview =
    overallConfidence < CONFIDENCE_THRESHOLD ||
    missingRequired.length > 0 ||
    lowConfidenceFields.length > 0;

  let reason: string | undefined;
  if (missingRequired.length > 0) {
    reason = `Could not read required fields: ${missingRequired.join(', ')}`;
  } else if (lowConfidenceFields.length > 0) {
    reason = `Low confidence on fields: ${lowConfidenceFields.join(', ')}`;
  } else if (overallConfidence < CONFIDENCE_THRESHOLD) {
    reason = `Overall document confidence too low (${overallConfidence}%)`;
  }

  return {
    overallConfidence,
    requiresManualReview,
    missingRequired,
    lowConfidenceFields,
    reason,
  };
}

/**
 * Check if basic ExtractedTicketData is usable
 * This is for the older non-confidence OCR results
 */
export function checkTicketDataConfidence(ticketData: ExtractedTicketData | null | undefined): ConfidenceCheckResult {
  if (!ticketData) {
    return {
      overallConfidence: 0,
      requiresManualReview: true,
      missingRequired: [...REQUIRED_TICKET_FIELDS],
      lowConfidenceFields: [],
      reason: 'No ticket data available.',
    };
  }

  const missingRequired: string[] = [];

  // Check required ticket fields
  if (!ticketData.courtDate) missingRequired.push('courtDate');
  if (!ticketData.violations?.length) missingRequired.push('violationDescription');

  // Use the overall confidence from OCR
  const overallConfidence = ticketData.confidence || 0;

  const requiresManualReview =
    overallConfidence < CONFIDENCE_THRESHOLD || missingRequired.length > 0;

  let reason: string | undefined;
  if (missingRequired.length > 0) {
    reason = `Could not read required ticket fields: ${missingRequired.join(', ')}`;
  } else if (overallConfidence < CONFIDENCE_THRESHOLD) {
    reason = `Ticket document confidence too low (${overallConfidence}%)`;
  }

  return {
    overallConfidence,
    requiresManualReview,
    missingRequired,
    lowConfidenceFields: [],
    reason,
  };
}

/**
 * Check if basic ExtractedLicenseData is usable
 * This is for the older non-confidence OCR results
 */
export function checkLicenseDataConfidence(licenseData: ExtractedLicenseData | null | undefined): ConfidenceCheckResult {
  if (!licenseData) {
    return {
      overallConfidence: 0,
      requiresManualReview: true,
      missingRequired: [...REQUIRED_LICENSE_FIELDS],
      lowConfidenceFields: [],
      reason: 'No license data available.',
    };
  }

  const missingRequired: string[] = [];

  // Check required license fields
  const fullName = licenseData.firstName || licenseData.lastName
    ? `${licenseData.firstName || ''} ${licenseData.lastName || ''}`.trim()
    : null;

  if (!fullName) missingRequired.push('fullName');
  if (!licenseData.licenseNumber) missingRequired.push('licenseNumber');
  if (!licenseData.expirationDate) missingRequired.push('expirationDate');

  // Use the overall confidence from OCR
  const overallConfidence = licenseData.confidence || 0;

  const requiresManualReview =
    overallConfidence < CONFIDENCE_THRESHOLD || missingRequired.length > 0;

  let reason: string | undefined;
  if (missingRequired.length > 0) {
    reason = `Could not read required license fields: ${missingRequired.join(', ')}`;
  } else if (overallConfidence < CONFIDENCE_THRESHOLD) {
    reason = `License document confidence too low (${overallConfidence}%)`;
  }

  return {
    overallConfidence,
    requiresManualReview,
    missingRequired,
    lowConfidenceFields: [],
    reason,
  };
}

/**
 * Combined confidence check for both ticket and license
 */
export function checkCombinedConfidence(
  ticketData: ExtractedTicketData | null | undefined,
  licenseData: ExtractedLicenseData | null | undefined
): ConfidenceCheckResult & { ticketResult: ConfidenceCheckResult; licenseResult: ConfidenceCheckResult } {
  const ticketResult = checkTicketDataConfidence(ticketData);
  const licenseResult = checkLicenseDataConfidence(licenseData);

  // Combine results
  const allMissingRequired = [...ticketResult.missingRequired, ...licenseResult.missingRequired];
  const allLowConfidence = [...ticketResult.lowConfidenceFields, ...licenseResult.lowConfidenceFields];

  // Average confidence, but only if both have data
  let overallConfidence = 0;
  if (ticketResult.overallConfidence > 0 && licenseResult.overallConfidence > 0) {
    overallConfidence = Math.round((ticketResult.overallConfidence + licenseResult.overallConfidence) / 2);
  } else if (ticketResult.overallConfidence > 0) {
    overallConfidence = ticketResult.overallConfidence;
  } else if (licenseResult.overallConfidence > 0) {
    overallConfidence = licenseResult.overallConfidence;
  }

  const requiresManualReview = ticketResult.requiresManualReview || licenseResult.requiresManualReview;

  // Build combined reason
  let reason: string | undefined;
  if (ticketResult.reason && licenseResult.reason) {
    reason = `${ticketResult.reason}. ${licenseResult.reason}`;
  } else {
    reason = ticketResult.reason || licenseResult.reason;
  }

  return {
    overallConfidence,
    requiresManualReview,
    missingRequired: allMissingRequired,
    lowConfidenceFields: allLowConfidence,
    reason,
    ticketResult,
    licenseResult,
  };
}

/**
 * Determines if we should proceed with eligibility checking
 * or send to manual review based on extraction results
 */
export function shouldProceedWithEligibility(
  ticketData: ExtractedTicketData | null | undefined,
  licenseData: ExtractedLicenseData | null | undefined,
  hasManualEntryData: boolean = false
): { canProceed: boolean; requiresManualReview: boolean; reason?: string; confidence: number } {
  // If user provided manual entry data, we can proceed
  if (hasManualEntryData) {
    return {
      canProceed: true,
      requiresManualReview: false,
      confidence: 100, // Manual entry is 100% confident
    };
  }

  // Check combined confidence
  const { overallConfidence, requiresManualReview, reason } = checkCombinedConfidence(ticketData, licenseData);

  return {
    canProceed: !requiresManualReview,
    requiresManualReview,
    reason,
    confidence: overallConfidence,
  };
}
