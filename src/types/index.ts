import type {
  ExtractedTicketData,
  ExtractedLicenseData,
  ExtractedSupportingDocData,
} from '@/lib/ocr/ocr-provider';
import type { CourtJurisdiction } from '@/lib/constants/jurisdictions';

// Simplified offense categories - 3 pricing tiers
export type OffenseCategory =
  | 'paperwork'       // $100 - Failure to show insurance, registration, no license on person
  | 'minor'           // $150 - Under 15 over, seatbelt, expired tags, equipment
  | 'standard'        // $200 - 15-29 over, no insurance proof, expired license
  | 'major'           // $500 - 30+ over, reckless, serious moving violations
  | 'non_dismissible'; // Requires consultation

export interface PricingTier {
  category: OffenseCategory;
  label: string;
  description: string;
  price: number;
  dismissible: boolean;
  moneyBackGuarantee?: boolean;
}

/**
 * Document upload with OCR extraction results
 */
export interface DocumentUpload {
  file: File;
  preview?: string;
  ocrProcessing: boolean;
  ocrProgress: number;
  ocrStatus: string;
  ocrComplete: boolean;
  ocrError?: string;
}

export interface TicketDocumentUpload extends DocumentUpload {
  extractedData?: ExtractedTicketData;
}

export interface LicenseDocumentUpload extends DocumentUpload {
  extractedData?: ExtractedLicenseData;
}

export interface SupportingDocumentUpload extends DocumentUpload {
  extractedData?: ExtractedSupportingDocData;
}

export interface IntakeFormData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Ticket Details
  courtDate: string;
  courtJurisdiction: CourtJurisdiction | '';
  offenseCategory: OffenseCategory | '';
  ticketNumber?: string;
  issuingOfficer?: string;
  citationLocation?: string;

  // Uploaded Documents (simple file references for backward compatibility)
  ticketImage: File | null;
  driversLicense: File | null;
  supportingDocument: File | null;

  // OCR-enhanced document uploads
  ticketUpload?: TicketDocumentUpload;
  licenseUpload?: LicenseDocumentUpload;
  supportingUpload?: SupportingDocumentUpload;

  // Legal Acknowledgments
  understoodNotClient: boolean;
  understoodCourtCosts: boolean;
  understoodDeadline: boolean;
  agreedToTerms: boolean;

  // Manual entry mode (when OCR fails)
  useManualEntry?: boolean;
  manualEntryData?: {
    // Ticket info
    courtDate: string;
    courtJurisdiction: CourtJurisdiction | '';
    courtLocation: string;
    courtDivision: string;
    citationNumber: string;
    violationDescription: string;
    speedLimit: string;
    actualSpeed: string;
    violationLocation: string;
    // License info
    fullName: string;
    licenseNumber: string;
    licenseClass: string;
    expirationDate: string;
    dateOfBirth: string;
    address: string;
  };
}

export interface Submission {
  id: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'refunded';
  formData: IntakeFormData;
  price: number;
  paymentIntentId?: string;
  courtDate: Date;
  disposition?: string;
  // OCR extraction data for admin review
  ticketExtraction?: ExtractedTicketData;
  licenseExtraction?: ExtractedLicenseData;
  supportingExtraction?: ExtractedSupportingDocData;
  // Admin-verified/corrected data
  verifiedData?: {
    courtDate?: string;
    courtLocation?: string;
    citationNumber?: string;
    violations?: string[];
    clientName?: string;
    licenseNumber?: string;
  };
}

/**
 * Case status enum for tracking case lifecycle
 */
export type CaseStatus =
  | 'pending_review'  // Initial submission, awaiting admin review
  | 'accepted'        // Admin accepted, representation begins
  | 'needs_info'      // Admin requested additional information
  | 'in_progress'     // Case being handled
  | 'dismissed'       // Case resolved - ticket dismissed
  | 'not_dismissed'   // Case resolved - ticket not dismissed (triggers refund)
  | 'rejected'        // Admin rejected submission
  | 'refunded';       // Refund processed

/**
 * Full case record as stored in database
 */
export interface Case {
  id: string;

  // Status tracking
  status: CaseStatus;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddressEncrypted?: string;

  // License info (encrypted in DB)
  licenseNumberEncrypted?: string;
  licenseNumberMasked?: string;
  licenseExpiration?: string;
  dateOfBirthEncrypted?: string;

  // Citation info
  citationNumber?: string;
  courtDate: string;
  courtTime?: string;
  courtLocation?: string;
  courtJurisdiction?: CourtJurisdiction;
  violationCodes: string[];
  violationDescription?: string;
  violationLocation?: string;
  violationDatetime?: string;
  officerName?: string;
  officerBadge?: string;

  // Pricing
  offenseTier: OffenseCategory;
  amountCharged: number; // cents

  // Documents (storage paths)
  ticketDocumentPath?: string;
  licenseDocumentPath?: string;
  supportingDocumentPath?: string;
  documentsDeleted: boolean;
  documentsDeletedAt?: string;

  // OCR data
  ocrRawText?: string;
  ocrConfidence?: number;
  ocrExtractionWarnings: string[];

  // Legal agreement
  termsAcceptedAt: string;
  termsVersion: string;
  privacyAcceptedAt: string;
  deadlineAcknowledged: boolean;

  // Payment
  stripePaymentIntentId?: string;
  paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paidAt?: string;

  // LawPay payment fields
  lawpayPaymentRequestId?: string;
  lawpayChargeId?: string;
  lawpayRefundId?: string;
  lawpayPaymentMethod?: 'card' | 'echeck' | 'pay_later';
  paymentFailureReason?: string;
  moneyBackEligible?: boolean;

  // Timeline
  createdAt: string;
  acceptedAt?: string;
  disposedAt?: string;
  dispositionType?: 'dismissed' | 'not_dismissed';
  refundIssuedAt?: string;

  // Admin
  assignedAttorney?: string;
  internalNotes?: string;

  // Analytics (kept after document deletion)
  violationZipCode?: string;
  violationWard?: string;

  // Review incentive
  reviewRequestedAt?: string;
  reviewSubmittedAt?: string;
  reviewIncentivePaid: boolean;
  reviewIncentivePaidAt?: string;
}

/**
 * Case summary for list views
 */
export interface CaseSummary {
  id: string;
  customerName: string;
  customerEmail: string;
  courtDate: string;
  offenseTier: OffenseCategory;
  amountCharged: number;
  status: CaseStatus;
  createdAt: string;
  hasOcrData: boolean;
  ocrConfidence: number | null;
}

/**
 * Current terms version - update when terms change
 */
export const CURRENT_TERMS_VERSION = '2025-01-01';

export type FormStep = 'contact' | 'ticket' | 'documents' | 'manual_entry' | 'review' | 'payment';

// Re-export OCR types for convenience
export type { ExtractedTicketData, ExtractedLicenseData, ExtractedSupportingDocData };

// Re-export jurisdiction types
export type { CourtJurisdiction };
export { COURT_OPTIONS, SPEED_LIMITS_BY_JURISDICTION } from '@/lib/constants/jurisdictions';
