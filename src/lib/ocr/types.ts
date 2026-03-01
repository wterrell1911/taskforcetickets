/**
 * OCR Confidence Scoring Types
 *
 * Provides structured confidence tracking for OCR extractions
 * to enable reliable eligibility decisions.
 */

export const CONFIDENCE_THRESHOLD = 70; // Minimum 70% to auto-process

export const REQUIRED_TICKET_FIELDS = ['courtDate', 'violationDescription'] as const;
export const REQUIRED_LICENSE_FIELDS = ['fullName', 'licenseNumber', 'expirationDate'] as const;

/**
 * Individual field extraction result with confidence score
 */
export interface FieldExtraction<T = string> {
  value: T | null;
  confidence: number; // 0-100
  source: 'ocr' | 'manual' | 'inferred';
}

/**
 * Extended extraction result with confidence scoring
 */
export interface ExtractionResultWithConfidence {
  success: boolean;
  overallConfidence: number;
  requiredFieldsConfidence: number;
  requiresManualReview: boolean;
  fields: ExtractedFieldsWithConfidence;
  rawText: string;
  warnings: string[];
}

/**
 * All extractable fields with confidence tracking
 */
export interface ExtractedFieldsWithConfidence {
  // Ticket fields
  courtDate?: FieldExtraction;
  courtTime?: FieldExtraction;
  courtLocation?: FieldExtraction;
  courtDivision?: FieldExtraction;
  citationNumber?: FieldExtraction;
  violationCode?: FieldExtraction;
  violationDescription?: FieldExtraction;
  speedLimit?: FieldExtraction<number>;
  actualSpeed?: FieldExtraction<number>;
  speedOver?: FieldExtraction<number>;
  violationLocation?: FieldExtraction;
  officerName?: FieldExtraction;
  officerBadge?: FieldExtraction;
  issuingAgency?: FieldExtraction;

  // License fields
  fullName?: FieldExtraction;
  firstName?: FieldExtraction;
  lastName?: FieldExtraction;
  middleName?: FieldExtraction;
  licenseNumber?: FieldExtraction;
  licenseClass?: FieldExtraction;
  expirationDate?: FieldExtraction;
  dateOfBirth?: FieldExtraction;
  address?: FieldExtraction;
  city?: FieldExtraction;
  state?: FieldExtraction;
  zipCode?: FieldExtraction;
  restrictions?: FieldExtraction<string[]>;
  endorsements?: FieldExtraction<string[]>;
}

/**
 * Helper to create a successful field extraction
 */
export function createFieldExtraction<T = string>(
  value: T | null,
  confidence: number,
  source: 'ocr' | 'manual' | 'inferred' = 'ocr'
): FieldExtraction<T> {
  return { value, confidence, source };
}

/**
 * Helper to create a failed/empty field extraction
 */
export function emptyFieldExtraction<T = string>(): FieldExtraction<T> {
  return { value: null, confidence: 0, source: 'ocr' };
}

/**
 * Calculate average confidence from an array of field extractions
 */
export function calculateAverageConfidence(
  fields: (FieldExtraction | undefined)[]
): number {
  const validFields = fields.filter((f): f is FieldExtraction => f !== undefined);
  if (validFields.length === 0) return 0;

  const sum = validFields.reduce((acc, f) => acc + f.confidence, 0);
  return Math.round(sum / validFields.length);
}

/**
 * Check if required fields meet confidence threshold
 */
export function checkRequiredFieldsConfidence(
  fields: ExtractedFieldsWithConfidence,
  requiredFields: readonly string[]
): { meetsThreshold: boolean; averageConfidence: number; missingFields: string[] } {
  const fieldExtractions: FieldExtraction[] = [];
  const missingFields: string[] = [];

  for (const fieldName of requiredFields) {
    const field = fields[fieldName as keyof ExtractedFieldsWithConfidence] as FieldExtraction | undefined;
    if (field) {
      fieldExtractions.push(field);
      if (!field.value || field.confidence < CONFIDENCE_THRESHOLD) {
        missingFields.push(fieldName);
      }
    } else {
      missingFields.push(fieldName);
    }
  }

  const averageConfidence = calculateAverageConfidence(fieldExtractions);

  return {
    meetsThreshold: averageConfidence >= CONFIDENCE_THRESHOLD && missingFields.length === 0,
    averageConfidence,
    missingFields,
  };
}

/**
 * CDL check result
 */
export interface CDLCheckResult {
  isCDL: boolean;
  confidence: number;
  reason: string;
}

/**
 * License classes - only A, B, C are CDL
 */
export const CDL_CLASSES = ['A', 'B', 'C'] as const;
export const REGULAR_CLASSES = ['D', 'M'] as const;

/**
 * CDL endorsement codes
 */
export const CDL_ENDORSEMENTS = ['H', 'N', 'P', 'S', 'T', 'X'] as const;
