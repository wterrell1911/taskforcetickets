/**
 * OCR Provider Abstraction Layer
 *
 * This interface allows swapping OCR providers (Tesseract.js, Google Cloud Vision, etc.)
 * without changing the extraction logic.
 */

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  rawText: string;
  confidence: number;
  blocks: TextBlock[];
  processingTimeMs: number;
  provider: string;
}

export interface OCRProgressCallback {
  (progress: number, status: string): void;
}

export interface OCRProvider {
  /**
   * Extract text from an image
   * @param imageData - Image as Buffer, Blob, or base64 string
   * @param onProgress - Optional progress callback (0-100)
   */
  extractText(
    imageData: Buffer | Blob | string,
    onProgress?: OCRProgressCallback
  ): Promise<OCRResult>;

  /**
   * Get the name of this provider
   */
  getName(): string;

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): boolean;

  /**
   * Initialize the provider (load models, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Clean up resources
   */
  terminate(): Promise<void>;
}

/**
 * Document types for specialized extraction
 */
export type DocumentType = 'ticket' | 'license' | 'supporting';

/**
 * Base interface for extracted document data
 */
export interface ExtractedDocumentData {
  rawText: string;
  confidence: number;
  extractionWarnings: string[];
  documentType: DocumentType;
}

/**
 * Extracted ticket/citation data
 */
export interface ExtractedTicketData extends ExtractedDocumentData {
  documentType: 'ticket';
  courtDate: string | null;
  courtTime: string | null;
  courtLocation: string | null;
  citationNumber: string | null;
  violations: string[];
  officerName: string | null;
  officerBadge: string | null;
  violationLocation: string | null;
  violationDate: string | null;
  violationTime: string | null;
  fineAmount: string | null;
  statuteNumbers: string[];
}

/**
 * Extracted driver's license data
 */
export interface ExtractedLicenseData extends ExtractedDocumentData {
  documentType: 'license';
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  licenseNumber: string | null;
  dateOfBirth: string | null;
  expirationDate: string | null;
  issueDate: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  licenseClass: string | null;
  restrictions: string[];
  endorsements: string[];
}

/**
 * Extracted supporting document data (insurance, registration, etc.)
 */
export interface ExtractedSupportingDocData extends ExtractedDocumentData {
  documentType: 'supporting';
  documentSubtype: 'insurance' | 'registration' | 'other' | null;
  policyNumber: string | null;
  insuranceCompany: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  vehicleInfo: string | null;
  vinNumber: string | null;
  plateNumber: string | null;
  insuredName: string | null;
}

export type ExtractedData = ExtractedTicketData | ExtractedLicenseData | ExtractedSupportingDocData;
