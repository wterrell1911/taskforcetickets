/**
 * OCR Module - Factory and Exports
 *
 * Usage:
 *   import { getOCRProvider, extractDocumentData } from '@/lib/ocr';
 *
 *   const provider = getOCRProvider();
 *   const result = await provider.extractText(imageBuffer);
 *   const extracted = await extractDocumentData(result, 'ticket');
 */

export * from './ocr-provider';
export * from './types';
export { TesseractProvider, getTesseractProvider } from './tesseract-provider';
export { GoogleVisionProvider, getGoogleVisionProvider } from './google-vision-provider';
export { preprocessImage, analyzeImage } from './image-preprocessing';
export { extractTicketData } from './extractors/ticket-extractor';
export { extractLicenseData } from './extractors/license-extractor';
export { extractSupportingDocData } from './extractors/supporting-doc-extractor';
export {
  extractTicketDataWithConfidence,
  extractLicenseDataWithConfidence,
  extractWithPatterns,
  extractSpeedWithConfidence,
} from './extractors/extract-with-confidence';
export {
  calculateExtractionConfidence,
  checkTicketDataConfidence,
  checkLicenseDataConfidence,
  checkCombinedConfidence,
  shouldProceedWithEligibility,
  type ConfidenceCheckResult,
} from './calculate-confidence';

import { OCRProvider, OCRResult, DocumentType, ExtractedData } from './ocr-provider';
import { ExtractionResultWithConfidence } from './types';
import { getTesseractProvider } from './tesseract-provider';
import { getGoogleVisionProvider } from './google-vision-provider';
import { extractTicketData } from './extractors/ticket-extractor';
import { extractLicenseData } from './extractors/license-extractor';
import { extractSupportingDocData } from './extractors/supporting-doc-extractor';
import {
  extractTicketDataWithConfidence,
  extractLicenseDataWithConfidence,
} from './extractors/extract-with-confidence';

/**
 * Get the configured OCR provider based on environment variable
 *
 * Set OCR_PROVIDER=tesseract (default) or OCR_PROVIDER=google-vision
 */
export function getOCRProvider(): OCRProvider {
  const providerName = process.env.NEXT_PUBLIC_OCR_PROVIDER || process.env.OCR_PROVIDER || 'tesseract';

  switch (providerName.toLowerCase()) {
    case 'google-vision':
    case 'googlevision':
    case 'vision':
      const gvProvider = getGoogleVisionProvider();
      if (!gvProvider.isAvailable()) {
        console.warn('Google Vision not configured, falling back to Tesseract');
        return getTesseractProvider();
      }
      return gvProvider;

    case 'tesseract':
    default:
      return getTesseractProvider();
  }
}

/**
 * Extract structured data from OCR result based on document type
 */
export async function extractDocumentData(
  ocrResult: OCRResult,
  documentType: DocumentType
): Promise<ExtractedData> {
  switch (documentType) {
    case 'ticket':
      return extractTicketData(ocrResult);
    case 'license':
      return extractLicenseData(ocrResult);
    case 'supporting':
      return extractSupportingDocData(ocrResult);
    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }
}

/**
 * Convenience function to process an image and extract data in one step
 */
export async function processDocument(
  imageData: Buffer | Blob | string,
  documentType: DocumentType,
  onProgress?: (progress: number, status: string) => void
): Promise<{ ocrResult: OCRResult; extractedData: ExtractedData }> {
  const provider = getOCRProvider();

  onProgress?.(0, 'Starting OCR...');

  await provider.initialize();

  const ocrResult = await provider.extractText(imageData, (progress, status) => {
    // Map OCR progress to 0-80%
    onProgress?.(Math.round(progress * 0.8), status);
  });

  onProgress?.(85, 'Extracting document fields...');

  const extractedData = await extractDocumentData(ocrResult, documentType);

  onProgress?.(100, 'Complete');

  return { ocrResult, extractedData };
}

/**
 * Process a document with confidence scoring
 *
 * This is the preferred method for eligibility decisions as it tracks
 * extraction confidence and determines if manual review is needed.
 */
export async function processDocumentWithConfidence(
  imageData: Buffer | Blob | string,
  documentType: 'ticket' | 'license',
  onProgress?: (progress: number, status: string) => void
): Promise<{ ocrResult: OCRResult; extractedData: ExtractionResultWithConfidence }> {
  const provider = getOCRProvider();

  onProgress?.(0, 'Starting OCR...');

  await provider.initialize();

  const ocrResult = await provider.extractText(imageData, (progress, status) => {
    // Map OCR progress to 0-80%
    onProgress?.(Math.round(progress * 0.8), status);
  });

  onProgress?.(85, 'Extracting document fields with confidence tracking...');

  let extractedData: ExtractionResultWithConfidence;

  if (documentType === 'ticket') {
    extractedData = extractTicketDataWithConfidence(ocrResult);
  } else {
    extractedData = extractLicenseDataWithConfidence(ocrResult);
  }

  onProgress?.(100, extractedData.requiresManualReview ? 'Review needed' : 'Complete');

  return { ocrResult, extractedData };
}
