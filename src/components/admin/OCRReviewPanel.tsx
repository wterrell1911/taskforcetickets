'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ExtractedTicketData,
  ExtractedLicenseData,
  ExtractedSupportingDocData,
} from '@/lib/ocr/ocr-provider';

interface OCRReviewPanelProps {
  documentType: 'ticket' | 'license' | 'supporting';
  imageUrl: string | null;
  extractedData: ExtractedTicketData | ExtractedLicenseData | ExtractedSupportingDocData | null;
  verifiedData?: Record<string, string>;
  onVerifiedDataChange: (data: Record<string, string>) => void;
  lowConfidenceThreshold?: number;
}

export function OCRReviewPanel({
  documentType,
  imageUrl,
  extractedData,
  verifiedData = {},
  onVerifiedDataChange,
  lowConfidenceThreshold = 70,
}: OCRReviewPanelProps) {
  const [imageZoom, setImageZoom] = useState(1);
  const [showRawText, setShowRawText] = useState(false);

  const isLowConfidence = extractedData && extractedData.confidence < lowConfidenceThreshold;
  const hasWarnings = extractedData && extractedData.extractionWarnings.length > 0;

  const handleFieldChange = (field: string, value: string) => {
    onVerifiedDataChange({ ...verifiedData, [field]: value });
  };

  const getFieldValue = (field: string, extractedValue: string | null): string => {
    return verifiedData[field] ?? extractedValue ?? '';
  };

  const isFieldEdited = (field: string, extractedValue: string | null): boolean => {
    return verifiedData[field] !== undefined && verifiedData[field] !== extractedValue;
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left Side: Document Image */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">Original Document</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
              className="p-2 rounded hover:bg-[#F8F8F8] transition-colors"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-sm text-[#4A4A4A]">{Math.round(imageZoom * 100)}%</span>
            <button
              onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
              className="p-2 rounded hover:bg-[#F8F8F8] transition-colors"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={() => setImageZoom(1)}
              className="p-2 rounded hover:bg-[#F8F8F8] transition-colors text-sm"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#F8F8F8] rounded-lg">
          {imageUrl ? (
            <div className="p-4 flex items-center justify-center min-h-[400px]">
              <img
                src={imageUrl}
                alt="Document"
                style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center' }}
                className="max-w-full transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#4A4A4A]">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No image available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Extracted Data Form */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">Extracted Data</h3>
            {extractedData && (
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'text-sm',
                  isLowConfidence ? 'text-[#CF2A27]' : 'text-emerald-600'
                )}>
                  {Math.round(extractedData.confidence)}% confidence
                </span>
                {hasWarnings && (
                  <span className="text-sm text-[#FFD100]">
                    ({extractedData.extractionWarnings.length} warning{extractedData.extractionWarnings.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
          >
            {showRawText ? 'Show Form' : 'Show Raw Text'}
          </button>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="mb-4 p-3 bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-lg">
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">Extraction Warnings:</p>
            <ul className="text-sm text-[#4A4A4A] space-y-1">
              {extractedData!.extractionWarnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#FFD100] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {showRawText && extractedData ? (
            <pre className="text-xs text-[#4A4A4A] bg-[#F8F8F8] p-4 rounded-lg whitespace-pre-wrap overflow-auto h-full">
              {extractedData.rawText}
            </pre>
          ) : extractedData ? (
            <div className="space-y-4">
              {documentType === 'ticket' && (
                <TicketDataForm
                  data={extractedData as ExtractedTicketData}
                  verifiedData={verifiedData}
                  onFieldChange={handleFieldChange}
                  getFieldValue={getFieldValue}
                  isFieldEdited={isFieldEdited}
                  isLowConfidence={isLowConfidence || false}
                />
              )}
              {documentType === 'license' && (
                <LicenseDataForm
                  data={extractedData as ExtractedLicenseData}
                  verifiedData={verifiedData}
                  onFieldChange={handleFieldChange}
                  getFieldValue={getFieldValue}
                  isFieldEdited={isFieldEdited}
                  isLowConfidence={isLowConfidence || false}
                />
              )}
              {documentType === 'supporting' && (
                <SupportingDataForm
                  data={extractedData as ExtractedSupportingDocData}
                  verifiedData={verifiedData}
                  onFieldChange={handleFieldChange}
                  getFieldValue={getFieldValue}
                  isFieldEdited={isFieldEdited}
                  isLowConfidence={isLowConfidence || false}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#4A4A4A]">
              <p>No OCR data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  field: string;
  value: string;
  isEdited: boolean;
  isLowConfidence: boolean;
  onChange: (field: string, value: string) => void;
  type?: 'text' | 'date' | 'time';
  placeholder?: string;
}

function FormField({
  label,
  field,
  value,
  isEdited,
  isLowConfidence,
  onChange,
  type = 'text',
  placeholder,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
        {label}
        {isEdited && (
          <span className="ml-2 text-xs text-emerald-600">(edited)</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] transition-colors',
          isLowConfidence && !value
            ? 'border-[#FFD100] bg-[#FFD100]/5'
            : isEdited
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-[#E5E5E5]'
        )}
      />
    </div>
  );
}

interface DataFormProps {
  verifiedData: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  getFieldValue: (field: string, extractedValue: string | null) => string;
  isFieldEdited: (field: string, extractedValue: string | null) => boolean;
  isLowConfidence: boolean;
}

function TicketDataForm({
  data,
  onFieldChange,
  getFieldValue,
  isFieldEdited,
  isLowConfidence,
}: DataFormProps & { data: ExtractedTicketData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Court Date"
          field="courtDate"
          value={getFieldValue('courtDate', data.courtDate)}
          isEdited={isFieldEdited('courtDate', data.courtDate)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
          type="text"
        />
        <FormField
          label="Court Time"
          field="courtTime"
          value={getFieldValue('courtTime', data.courtTime)}
          isEdited={isFieldEdited('courtTime', data.courtTime)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      <FormField
        label="Court Location"
        field="courtLocation"
        value={getFieldValue('courtLocation', data.courtLocation)}
        isEdited={isFieldEdited('courtLocation', data.courtLocation)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <FormField
        label="Citation Number"
        field="citationNumber"
        value={getFieldValue('citationNumber', data.citationNumber)}
        isEdited={isFieldEdited('citationNumber', data.citationNumber)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <FormField
        label="Violation Location"
        field="violationLocation"
        value={getFieldValue('violationLocation', data.violationLocation)}
        isEdited={isFieldEdited('violationLocation', data.violationLocation)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Violation Date"
          field="violationDate"
          value={getFieldValue('violationDate', data.violationDate)}
          isEdited={isFieldEdited('violationDate', data.violationDate)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="Violation Time"
          field="violationTime"
          value={getFieldValue('violationTime', data.violationTime)}
          isEdited={isFieldEdited('violationTime', data.violationTime)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Officer Name"
          field="officerName"
          value={getFieldValue('officerName', data.officerName)}
          isEdited={isFieldEdited('officerName', data.officerName)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="Officer Badge #"
          field="officerBadge"
          value={getFieldValue('officerBadge', data.officerBadge)}
          isEdited={isFieldEdited('officerBadge', data.officerBadge)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      <FormField
        label="Fine Amount"
        field="fineAmount"
        value={getFieldValue('fineAmount', data.fineAmount)}
        isEdited={isFieldEdited('fineAmount', data.fineAmount)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <div>
        <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
          Violations
        </label>
        <div className="space-y-2">
          {(data.violations.length > 0 ? data.violations : ['']).map((violation, i) => (
            <input
              key={i}
              type="text"
              value={getFieldValue(`violation_${i}`, violation)}
              onChange={(e) => onFieldChange(`violation_${i}`, e.target.value)}
              placeholder={`Violation ${i + 1}`}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]',
                isLowConfidence && !violation
                  ? 'border-[#FFD100] bg-[#FFD100]/5'
                  : 'border-[#E5E5E5]'
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
          Statute Numbers
        </label>
        <div className="flex flex-wrap gap-2">
          {data.statuteNumbers.length > 0 ? (
            data.statuteNumbers.map((statute, i) => (
              <span key={i} className="px-2 py-1 bg-[#F8F8F8] rounded text-sm">
                {statute}
              </span>
            ))
          ) : (
            <span className="text-sm text-[#4A4A4A]">None extracted</span>
          )}
        </div>
      </div>
    </>
  );
}

function LicenseDataForm({
  data,
  onFieldChange,
  getFieldValue,
  isFieldEdited,
  isLowConfidence,
}: DataFormProps & { data: ExtractedLicenseData }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <FormField
          label="First Name"
          field="firstName"
          value={getFieldValue('firstName', data.firstName)}
          isEdited={isFieldEdited('firstName', data.firstName)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="Middle Name"
          field="middleName"
          value={getFieldValue('middleName', data.middleName)}
          isEdited={isFieldEdited('middleName', data.middleName)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="Last Name"
          field="lastName"
          value={getFieldValue('lastName', data.lastName)}
          isEdited={isFieldEdited('lastName', data.lastName)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      <FormField
        label="License Number"
        field="licenseNumber"
        value={getFieldValue('licenseNumber', data.licenseNumber)}
        isEdited={isFieldEdited('licenseNumber', data.licenseNumber)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Date of Birth"
          field="dateOfBirth"
          value={getFieldValue('dateOfBirth', data.dateOfBirth)}
          isEdited={isFieldEdited('dateOfBirth', data.dateOfBirth)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="License Class"
          field="licenseClass"
          value={getFieldValue('licenseClass', data.licenseClass)}
          isEdited={isFieldEdited('licenseClass', data.licenseClass)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Issue Date"
          field="issueDate"
          value={getFieldValue('issueDate', data.issueDate)}
          isEdited={isFieldEdited('issueDate', data.issueDate)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="Expiration Date"
          field="expirationDate"
          value={getFieldValue('expirationDate', data.expirationDate)}
          isEdited={isFieldEdited('expirationDate', data.expirationDate)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      <FormField
        label="Address"
        field="address"
        value={getFieldValue('address', data.address)}
        isEdited={isFieldEdited('address', data.address)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          label="City"
          field="city"
          value={getFieldValue('city', data.city)}
          isEdited={isFieldEdited('city', data.city)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="State"
          field="state"
          value={getFieldValue('state', data.state)}
          isEdited={isFieldEdited('state', data.state)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
        <FormField
          label="ZIP Code"
          field="zipCode"
          value={getFieldValue('zipCode', data.zipCode)}
          isEdited={isFieldEdited('zipCode', data.zipCode)}
          isLowConfidence={isLowConfidence}
          onChange={onFieldChange}
        />
      </div>

      {data.restrictions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
            Restrictions
          </label>
          <div className="flex flex-wrap gap-2">
            {data.restrictions.map((restriction, i) => (
              <span key={i} className="px-2 py-1 bg-[#F8F8F8] rounded text-sm">
                {restriction}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.endorsements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
            Endorsements
          </label>
          <div className="flex flex-wrap gap-2">
            {data.endorsements.map((endorsement, i) => (
              <span key={i} className="px-2 py-1 bg-emerald-100 rounded text-sm">
                {endorsement}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function SupportingDataForm({
  data,
  onFieldChange,
  getFieldValue,
  isFieldEdited,
  isLowConfidence,
}: DataFormProps & { data: ExtractedSupportingDocData }) {
  return (
    <>
      <div className="mb-4">
        <span className="text-sm text-[#4A4A4A]">Document Type: </span>
        <span className="font-medium capitalize">{data.documentSubtype || 'Unknown'}</span>
      </div>

      {data.documentSubtype === 'insurance' && (
        <>
          <FormField
            label="Insurance Company"
            field="insuranceCompany"
            value={getFieldValue('insuranceCompany', data.insuranceCompany)}
            isEdited={isFieldEdited('insuranceCompany', data.insuranceCompany)}
            isLowConfidence={isLowConfidence}
            onChange={onFieldChange}
          />

          <FormField
            label="Policy Number"
            field="policyNumber"
            value={getFieldValue('policyNumber', data.policyNumber)}
            isEdited={isFieldEdited('policyNumber', data.policyNumber)}
            isLowConfidence={isLowConfidence}
            onChange={onFieldChange}
          />

          <FormField
            label="Insured Name"
            field="insuredName"
            value={getFieldValue('insuredName', data.insuredName)}
            isEdited={isFieldEdited('insuredName', data.insuredName)}
            isLowConfidence={isLowConfidence}
            onChange={onFieldChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Effective Date"
              field="effectiveDate"
              value={getFieldValue('effectiveDate', data.effectiveDate)}
              isEdited={isFieldEdited('effectiveDate', data.effectiveDate)}
              isLowConfidence={isLowConfidence}
              onChange={onFieldChange}
            />
            <FormField
              label="Expiration Date"
              field="expirationDate"
              value={getFieldValue('expirationDate', data.expirationDate)}
              isEdited={isFieldEdited('expirationDate', data.expirationDate)}
              isLowConfidence={isLowConfidence}
              onChange={onFieldChange}
            />
          </div>
        </>
      )}

      {data.documentSubtype === 'registration' && (
        <>
          <FormField
            label="Plate Number"
            field="plateNumber"
            value={getFieldValue('plateNumber', data.plateNumber)}
            isEdited={isFieldEdited('plateNumber', data.plateNumber)}
            isLowConfidence={isLowConfidence}
            onChange={onFieldChange}
          />

          <FormField
            label="Owner Name"
            field="insuredName"
            value={getFieldValue('insuredName', data.insuredName)}
            isEdited={isFieldEdited('insuredName', data.insuredName)}
            isLowConfidence={isLowConfidence}
            onChange={onFieldChange}
          />

          <FormField
            label="Expiration Date"
            field="expirationDate"
            value={getFieldValue('expirationDate', data.expirationDate)}
            isEdited={isFieldEdited('expirationDate', data.expirationDate)}
            isLowConfidence={isLowConfidence}
            onChange={onFieldChange}
          />
        </>
      )}

      <FormField
        label="Vehicle Info"
        field="vehicleInfo"
        value={getFieldValue('vehicleInfo', data.vehicleInfo)}
        isEdited={isFieldEdited('vehicleInfo', data.vehicleInfo)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />

      <FormField
        label="VIN Number"
        field="vinNumber"
        value={getFieldValue('vinNumber', data.vinNumber)}
        isEdited={isFieldEdited('vinNumber', data.vinNumber)}
        isLowConfidence={isLowConfidence}
        onChange={onFieldChange}
      />
    </>
  );
}
