'use client';

import { IntakeFormData, TicketDocumentUpload, LicenseDocumentUpload, SupportingDocumentUpload } from '@/types';
import { OCRFileUpload } from './OCRFileUpload';
import { OCRResult, ExtractedData, ExtractedTicketData, ExtractedLicenseData, ExtractedSupportingDocData } from '@/lib/ocr/ocr-provider';

interface DocumentsStepProps {
  data: IntakeFormData;
  onChange: (data: Partial<IntakeFormData>) => void;
  errors: Record<string, string>;
}

export function DocumentsStep({ data, onChange, errors }: DocumentsStepProps) {
  // Handle ticket OCR completion - auto-fill form fields
  const handleTicketOCRComplete = (result: OCRResult, extractedData: ExtractedData) => {
    const ticketData = extractedData as ExtractedTicketData;

    // Create upload object with extracted data
    const ticketUpload: TicketDocumentUpload = {
      file: data.ticketImage!,
      ocrProcessing: false,
      ocrProgress: 100,
      ocrStatus: 'Complete',
      ocrComplete: true,
      extractedData: ticketData,
    };

    // Auto-fill form fields from OCR if not already set
    const updates: Partial<IntakeFormData> = {
      ticketUpload,
    };

    // Auto-fill court date if extracted and not already set
    if (ticketData.courtDate && !data.courtDate) {
      // Convert MM/DD/YYYY to YYYY-MM-DD for date input
      const [month, day, year] = ticketData.courtDate.split('/');
      if (month && day && year) {
        updates.courtDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Auto-fill ticket number if extracted
    if (ticketData.citationNumber && !data.ticketNumber) {
      updates.ticketNumber = ticketData.citationNumber;
    }

    // Auto-fill citation location if extracted
    if (ticketData.violationLocation && !data.citationLocation) {
      updates.citationLocation = ticketData.violationLocation;
    }

    // Auto-fill officer if extracted
    if (ticketData.officerName && !data.issuingOfficer) {
      updates.issuingOfficer = ticketData.officerName;
    }

    onChange(updates);
  };

  // Handle license OCR completion
  const handleLicenseOCRComplete = (result: OCRResult, extractedData: ExtractedData) => {
    const licenseData = extractedData as ExtractedLicenseData;

    const licenseUpload: LicenseDocumentUpload = {
      file: data.driversLicense!,
      ocrProcessing: false,
      ocrProgress: 100,
      ocrStatus: 'Complete',
      ocrComplete: true,
      extractedData: licenseData,
    };

    // Auto-fill name fields if not already set
    const updates: Partial<IntakeFormData> = {
      licenseUpload,
    };

    if (licenseData.firstName && !data.firstName) {
      updates.firstName = licenseData.firstName;
    }

    if (licenseData.lastName && !data.lastName) {
      updates.lastName = licenseData.lastName;
    }

    onChange(updates);
  };

  // Handle supporting doc OCR completion
  const handleSupportingOCRComplete = (result: OCRResult, extractedData: ExtractedData) => {
    const supportingData = extractedData as ExtractedSupportingDocData;

    const supportingUpload: SupportingDocumentUpload = {
      file: data.supportingDocument!,
      ocrProcessing: false,
      ocrProgress: 100,
      ocrStatus: 'Complete',
      ocrComplete: true,
      extractedData: supportingData,
    };

    onChange({ supportingUpload });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">Upload Documents</h2>
        <p className="text-[#4A4A4A]">
          Please upload clear, legible photos or scans of the required documents.
          <span className="text-[#FFD100] font-medium"> We&apos;ll automatically extract key information.</span>
        </p>
      </div>

      <div className="p-5 bg-[#F8F8F8] rounded-xl border border-[#E5E5E5]">
        <h3 className="font-semibold text-[#1A1A1A] mb-3">Tips for Best Results</h3>
        <ul className="text-sm text-[#4A4A4A] space-y-2">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Ensure all text is clearly readable
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Include the entire document in the photo
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Avoid shadows and glare
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Use good lighting
          </li>
        </ul>
      </div>

      <div className="space-y-6">
        <OCRFileUpload
          label="Traffic Ticket / Citation"
          description="Photo of your traffic ticket or citation (optional if you have the ticket number)"
          documentType="ticket"
          value={data.ticketImage}
          onChange={(file) => onChange({ ticketImage: file })}
          onOCRComplete={handleTicketOCRComplete}
          error={errors.ticketImage}
        />

        <OCRFileUpload
          label="Valid Driver's License"
          description="Photo of your current, valid driver's license"
          documentType="license"
          value={data.driversLicense}
          onChange={(file) => onChange({ driversLicense: file })}
          onOCRComplete={handleLicenseOCRComplete}
          required
          error={errors.driversLicense}
        />

        <OCRFileUpload
          label="Supporting Document"
          description="Proof of insurance, registration, or other relevant document (optional)"
          documentType="supporting"
          value={data.supportingDocument}
          onChange={(file) => onChange({ supportingDocument: file })}
          onOCRComplete={handleSupportingOCRComplete}
          error={errors.supportingDocument}
        />
      </div>

      <div className="p-5 bg-[#F8F8F8] rounded-xl border border-[#E5E5E5]">
        <h3 className="font-semibold text-[#1A1A1A] mb-2">Document Security</h3>
        <p className="text-sm text-[#4A4A4A]">
          Your documents are encrypted and stored securely. We only retain them for the duration
          of your case plus any legally required retention period.
        </p>
      </div>

      {/* Manual entry fallback */}
      <div className="text-center pt-4 border-t border-[#E5E5E5]">
        <p className="text-sm text-[#4A4A4A] mb-2">Having trouble with document uploads?</p>
        <button
          type="button"
          onClick={() => onChange({ useManualEntry: true })}
          className="text-[#1A1A1A] font-medium underline hover:text-[#FFD100] transition-colors text-sm"
        >
          Enter information manually instead
        </button>
      </div>
    </div>
  );
}
