'use client';

import { useState } from 'react';
import { COURT_OPTIONS, CourtJurisdiction } from '@/types';

export interface ManualEntryData {
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
}

interface ManualEntryFormProps {
  onSubmit: (data: ManualEntryData) => void;
  onCancel?: () => void;
  ocrData?: Partial<ManualEntryData>; // Pre-fill what OCR did capture
  showMessage?: boolean;
}

export function ManualEntryForm({ onSubmit, onCancel, ocrData, showMessage = true }: ManualEntryFormProps) {
  const [formData, setFormData] = useState<ManualEntryData>({
    courtDate: ocrData?.courtDate || '',
    courtJurisdiction: ocrData?.courtJurisdiction || '',
    courtLocation: ocrData?.courtLocation || '',
    courtDivision: ocrData?.courtDivision || '',
    citationNumber: ocrData?.citationNumber || '',
    violationDescription: ocrData?.violationDescription || '',
    speedLimit: ocrData?.speedLimit || '',
    actualSpeed: ocrData?.actualSpeed || '',
    violationLocation: ocrData?.violationLocation || '',
    fullName: ocrData?.fullName || '',
    licenseNumber: ocrData?.licenseNumber || '',
    licenseClass: ocrData?.licenseClass || 'D',
    expirationDate: ocrData?.expirationDate || '',
    dateOfBirth: ocrData?.dateOfBirth || '',
    address: ocrData?.address || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required ticket fields
    if (!formData.courtDate) {
      newErrors.courtDate = 'Court date is required';
    }
    if (!formData.courtJurisdiction) {
      newErrors.courtJurisdiction = 'Court/Jurisdiction is required';
    }
    if (!formData.violationDescription) {
      newErrors.violationDescription = 'Violation description is required';
    }

    // Required license fields
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
    }
    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Expiration date is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {showMessage && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
          <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            We need a little help
          </h3>
          <p className="text-amber-800 text-sm">
            We couldn&apos;t read all the information from your documents automatically. Please fill in the details
            below. Any information we did capture has been pre-filled for you.
          </p>
        </div>
      )}

      {/* Ticket Information */}
      <div>
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-3">
          <span className="w-8 h-8 bg-[#FFD100] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold text-sm">
            1
          </span>
          Ticket Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Court Date <span className="text-[#CF2A27]">*</span>
            </label>
            <input
              type="date"
              name="courtDate"
              value={formData.courtDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.courtDate ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            />
            {errors.courtDate && <p className="text-[#CF2A27] text-xs mt-1">{errors.courtDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Court/Jurisdiction <span className="text-[#CF2A27]">*</span>
            </label>
            <select
              name="courtJurisdiction"
              value={formData.courtJurisdiction}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.courtJurisdiction ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            >
              <option value="">Select where your ticket is from...</option>
              {COURT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.courtJurisdiction && <p className="text-[#CF2A27] text-xs mt-1">{errors.courtJurisdiction}</p>}
            <p className="text-xs text-[#4A4A4A] mt-1">Check your ticket for the court name or issuing agency</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">Citation/Ticket Number</label>
            <input
              type="text"
              name="citationNumber"
              value={formData.citationNumber}
              onChange={handleChange}
              placeholder="e.g., 12345678"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">Court Location</label>
            <input
              type="text"
              name="courtLocation"
              value={formData.courtLocation}
              onChange={handleChange}
              placeholder="e.g., 201 Poplar Ave"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Violation/Charge <span className="text-[#CF2A27]">*</span>
            </label>
            <input
              type="text"
              name="violationDescription"
              value={formData.violationDescription}
              onChange={handleChange}
              placeholder="e.g., Speeding 72 in a 55"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.violationDescription ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            />
            {errors.violationDescription && (
              <p className="text-[#CF2A27] text-xs mt-1">{errors.violationDescription}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">Speed Limit (if speeding)</label>
            <input
              type="number"
              name="speedLimit"
              value={formData.speedLimit}
              onChange={handleChange}
              placeholder="e.g., 55"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">Your Speed (if speeding)</label>
            <input
              type="number"
              name="actualSpeed"
              value={formData.actualSpeed}
              onChange={handleChange}
              placeholder="e.g., 72"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">Location of Violation</label>
            <input
              type="text"
              name="violationLocation"
              value={formData.violationLocation}
              onChange={handleChange}
              placeholder="e.g., Poplar Ave near Highland"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            />
          </div>
        </div>
      </div>

      {/* License Information */}
      <div>
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-3">
          <span className="w-8 h-8 bg-[#FFD100] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold text-sm">
            2
          </span>
          Driver&apos;s License Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Full Name (as shown on license) <span className="text-[#CF2A27]">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g., John Michael Smith"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.fullName ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            />
            {errors.fullName && <p className="text-[#CF2A27] text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              License Number <span className="text-[#CF2A27]">*</span>
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="e.g., 123456789"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.licenseNumber ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            />
            {errors.licenseNumber && <p className="text-[#CF2A27] text-xs mt-1">{errors.licenseNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              License Class <span className="text-[#CF2A27]">*</span>
            </label>
            <select
              name="licenseClass"
              value={formData.licenseClass}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            >
              <option value="D">Class D (Regular)</option>
              <option value="M">Class M (Motorcycle)</option>
              <option value="A">Class A (CDL)</option>
              <option value="B">Class B (CDL)</option>
              <option value="C">Class C (CDL)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Expiration Date <span className="text-[#CF2A27]">*</span>
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.expirationDate ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            />
            {errors.expirationDate && <p className="text-[#CF2A27] text-xs mt-1">{errors.expirationDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Date of Birth <span className="text-[#CF2A27]">*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] ${
                errors.dateOfBirth ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
              }`}
            />
            {errors.dateOfBirth && <p className="text-[#CF2A27] text-xs mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">Address (as shown on license)</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main St, Memphis, TN 38103"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
            />
          </div>
        </div>
      </div>

      {/* CDL Warning */}
      {['A', 'B', 'C'].includes(formData.licenseClass) && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-amber-800">CDL License Selected</p>
              <p className="text-sm text-amber-700 mt-1">
                CDL-related tickets require specialized representation. If this is correct, your case will be reviewed
                by our team and we will contact you directly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 border-2 border-[#E5E5E5] text-[#4A4A4A] font-semibold rounded-xl hover:bg-[#F8F8F8] transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-4 bg-[#FFD100] text-[#1A1A1A] font-bold text-lg rounded-xl hover:brightness-105 transition-all"
        >
          Continue to Review
        </button>
      </div>
    </form>
  );
}
