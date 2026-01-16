'use client';

import { useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DocumentType, ExtractedData, OCRResult } from '@/lib/ocr/ocr-provider';

interface OCRFileUploadProps {
  label: string;
  description: string;
  documentType: DocumentType;
  accept?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  onOCRComplete?: (result: OCRResult, extractedData: ExtractedData) => void;
  onOCRError?: (error: string) => void;
  required?: boolean;
  error?: string;
  showExtractedData?: boolean;
}

export function OCRFileUpload({
  label,
  description,
  documentType,
  accept = 'image/*,.pdf',
  value,
  onChange,
  onOCRComplete,
  onOCRError,
  required,
  error,
  showExtractedData = true,
}: OCRFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  // Reset state when file changes
  useEffect(() => {
    if (!value) {
      setPreview(null);
      setExtractedData(null);
      setOcrError(null);
      setOcrProgress(0);
      setOcrStatus('');
    }
  }, [value]);

  const processOCR = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        // Skip OCR for non-image files (PDFs would need different handling)
        return;
      }

      setOcrProcessing(true);
      setOcrProgress(0);
      setOcrStatus('Initializing OCR...');
      setOcrError(null);

      try {
        // Dynamically import to avoid SSR issues
        const { processDocument } = await import('@/lib/ocr');

        // Convert File to base64 for OCR processing
        const base64 = await fileToBase64(file);

        const { ocrResult, extractedData: extracted } = await processDocument(
          base64,
          documentType,
          (progress, status) => {
            setOcrProgress(progress);
            setOcrStatus(status);
          }
        );

        setExtractedData(extracted);
        onOCRComplete?.(ocrResult, extracted);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
        setOcrError(errorMessage);
        onOCRError?.(errorMessage);
      } finally {
        setOcrProcessing(false);
      }
    },
    [documentType, onOCRComplete, onOCRError]
  );

  const handleFile = useCallback(
    async (file: File | null) => {
      onChange(file);

      if (file && file.type.startsWith('image/')) {
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Start OCR processing
        processOCR(file);
      } else {
        setPreview(null);
        setExtractedData(null);
      }
    },
    [onChange, processOCR]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleFile(null);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-[#1A1A1A]">
        {label}
        {required && <span className="text-[#CF2A27] ml-1">*</span>}
      </label>

      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer',
          isDragging && 'border-[#FFD100] bg-[#FFD100]/5',
          error && 'border-[#CF2A27] bg-[#CF2A27]/5',
          !isDragging && !error && 'border-[#E5E5E5] hover:border-[#1A1A1A]/30'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={ocrProcessing}
        />

        {value ? (
          <div className="space-y-4">
            {/* File info and preview */}
            <div className="flex items-start gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-[#E5E5E5]"
                />
              ) : (
                <div className="w-24 h-24 bg-[#F8F8F8] rounded-lg flex items-center justify-center border border-[#E5E5E5]">
                  <svg className="w-10 h-10 text-[#4A4A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A1A1A] truncate">{value.name}</p>
                <p className="text-sm text-[#4A4A4A]">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {!ocrProcessing && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-sm text-[#CF2A27] hover:underline font-medium mt-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* OCR Progress */}
            {ocrProcessing && (
              <div className="bg-[#F8F8F8] rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="animate-spin h-5 w-5 text-[#FFD100]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm text-[#4A4A4A]">{ocrStatus}</span>
                </div>
                <div className="w-full bg-[#E5E5E5] rounded-full h-2">
                  <div
                    className="bg-[#FFD100] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-xs text-[#4A4A4A] mt-1 text-right">{ocrProgress}%</p>
              </div>
            )}

            {/* OCR Error */}
            {ocrError && (
              <div className="bg-[#CF2A27]/10 border border-[#CF2A27]/30 rounded-lg p-3">
                <p className="text-sm text-[#CF2A27]">
                  OCR Error: {ocrError}
                </p>
                <p className="text-xs text-[#4A4A4A] mt-1">
                  The document was uploaded but text extraction failed. You can still proceed.
                </p>
              </div>
            )}

            {/* Extracted Data Preview */}
            {showExtractedData && extractedData && !ocrProcessing && (
              <ExtractedDataPreview data={extractedData} />
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <svg
              className="mx-auto h-12 w-12 text-[#4A4A4A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-sm text-[#4A4A4A]">{description}</p>
            <p className="mt-1 text-xs text-[#4A4A4A]/60">
              Drag and drop or click to upload
            </p>
            <p className="mt-2 text-xs text-[#FFD100] font-medium">
              Text will be automatically extracted
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[#CF2A27]">{error}</p>}
    </div>
  );
}

/**
 * Preview component for extracted data
 */
function ExtractedDataPreview({ data }: { data: ExtractedData }) {
  const [expanded, setExpanded] = useState(false);

  const hasWarnings = data.extractionWarnings.length > 0;
  const confidence = Math.round(data.confidence);
  const isLowConfidence = confidence < 70;

  // Get key fields based on document type
  const keyFields = getKeyFields(data);

  return (
    <div className={cn(
      'rounded-lg border p-4',
      hasWarnings || isLowConfidence
        ? 'bg-[#FFD100]/10 border-[#FFD100]/30'
        : 'bg-emerald-50 border-emerald-200'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasWarnings || isLowConfidence ? (
            <svg className="w-5 h-5 text-[#FFD100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-medium text-[#1A1A1A]">
            Text Extracted ({confidence}% confidence)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Key fields summary */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {keyFields.map((field, i) => (
          <div key={i}>
            <span className="text-[#4A4A4A]">{field.label}: </span>
            <span className={cn(
              'font-medium',
              field.value ? 'text-[#1A1A1A]' : 'text-[#CF2A27]'
            )}>
              {field.value || 'Not found'}
            </span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="mt-3 pt-3 border-t border-[#FFD100]/30">
          <p className="text-xs text-[#4A4A4A] font-medium mb-1">Please verify:</p>
          <ul className="text-xs text-[#4A4A4A] space-y-1">
            {data.extractionWarnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#4A4A4A] font-medium mb-2">Raw extracted text:</p>
          <pre className="text-xs text-[#4A4A4A] bg-white p-3 rounded border border-[#E5E5E5] overflow-auto max-h-40 whitespace-pre-wrap">
            {data.rawText}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Get key fields to display based on document type
 */
function getKeyFields(data: ExtractedData): Array<{ label: string; value: string | null }> {
  if (data.documentType === 'ticket') {
    return [
      { label: 'Court Date', value: data.courtDate },
      { label: 'Citation #', value: data.citationNumber },
      { label: 'Violation', value: data.violations[0] || null },
    ];
  } else if (data.documentType === 'license') {
    return [
      { label: 'Name', value: data.fullName },
      { label: 'License #', value: data.licenseNumber },
      { label: 'DOB', value: data.dateOfBirth },
      { label: 'Expires', value: data.expirationDate },
    ];
  } else {
    return [
      { label: 'Type', value: data.documentSubtype },
      { label: 'Policy/Plate #', value: data.policyNumber || data.plateNumber },
      { label: 'Expires', value: data.expirationDate },
      { label: 'Name', value: data.insuredName },
    ];
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
