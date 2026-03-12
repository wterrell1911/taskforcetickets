'use client';

import { useCallback, useEffect } from 'react';
import { IntakeFormData } from '@/types';
import { useFormValidation } from '@/hooks/useFormValidation';

interface ContactStepProps {
  data: IntakeFormData;
  onChange: (data: Partial<IntakeFormData>) => void;
  errors: Record<string, string>;
}

export function ContactStep({ data, onChange, errors }: ContactStepProps) {
  const { validation, validateEmail, validatePhone, validateEmailAsync, validatePhoneAsync } = useFormValidation();

  // Real-time validation on blur
  const handleEmailBlur = useCallback(() => {
    if (data.email) {
      validateEmailAsync(data.email);
    }
  }, [data.email, validateEmailAsync]);

  const handlePhoneBlur = useCallback(() => {
    if (data.phone) {
      validatePhoneAsync(data.phone);
    }
  }, [data.phone, validatePhoneAsync]);

  // Quick validation as user types
  useEffect(() => {
    if (data.email.length > 5) {
      validateEmail(data.email);
    }
  }, [data.email, validateEmail]);

  useEffect(() => {
    if (data.phone.length > 5) {
      validatePhone(data.phone);
    }
  }, [data.phone, validatePhone]);

  // Accept email suggestion
  const handleAcceptSuggestion = useCallback(() => {
    if (validation.email.suggestion) {
      onChange({ email: validation.email.suggestion });
    }
  }, [validation.email.suggestion, onChange]);

  // Get combined error (form error or validation error)
  const getEmailError = () => {
    if (errors.email) return errors.email;
    if (validation.email.valid === false && validation.email.error) {
      return validation.email.error;
    }
    return null;
  };

  const getPhoneError = () => {
    if (errors.phone) return errors.phone;
    if (validation.phone.valid === false && validation.phone.error) {
      return validation.phone.error;
    }
    return null;
  };

  const emailError = getEmailError();
  const phoneError = getPhoneError();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">Contact Information</h2>
        <p className="text-[#4A4A4A]">
          We&apos;ll use this information to keep you updated on your case.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            First Name <span className="text-[#CF2A27]">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={`w-full px-4 py-4 rounded-xl border ${
              errors.firstName ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
            } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-2 text-sm text-[#CF2A27]">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            Last Name <span className="text-[#CF2A27]">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={`w-full px-4 py-4 rounded-xl border ${
              errors.lastName ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
            } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="mt-2 text-sm text-[#CF2A27]">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Email Address <span className="text-[#CF2A27]">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-4 rounded-xl border ${
              emailError ? 'border-[#CF2A27]' : validation.email.valid ? 'border-emerald-500' : 'border-[#E5E5E5]'
            } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors pr-12`}
            placeholder="john@example.com"
          />
          {/* Validation indicator */}
          {validation.email.checking && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-[#4A4A4A]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {!validation.email.checking && validation.email.valid && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {!validation.email.checking && validation.email.valid === false && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="h-5 w-5 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        {emailError && (
          <div className="mt-2">
            <p className="text-sm text-[#CF2A27]">{emailError}</p>
            {validation.email.suggestion && (
              <button
                type="button"
                onClick={handleAcceptSuggestion}
                className="mt-1 text-sm text-[#1A1A1A] underline hover:no-underline"
              >
                Use {validation.email.suggestion}
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Phone Number <span className="text-[#CF2A27]">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            id="phone"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            onBlur={handlePhoneBlur}
            className={`w-full px-4 py-4 rounded-xl border ${
              phoneError ? 'border-[#CF2A27]' : validation.phone.valid ? 'border-emerald-500' : 'border-[#E5E5E5]'
            } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors pr-12`}
            placeholder="(901) 555-0123"
          />
          {/* Validation indicator */}
          {validation.phone.checking && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-[#4A4A4A]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {!validation.phone.checking && validation.phone.valid && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {!validation.phone.checking && validation.phone.valid === false && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="h-5 w-5 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        {phoneError && <p className="mt-2 text-sm text-[#CF2A27]">{phoneError}</p>}
        {validation.phone.formatted && validation.phone.valid && data.phone !== validation.phone.formatted && (
          <p className="mt-1 text-xs text-[#4A4A4A]">
            Will be formatted as: {validation.phone.formatted}
          </p>
        )}
      </div>

      {/* Info about validation */}
      <div className="p-4 bg-[#F8F8F8] rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#4A4A4A] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-[#4A4A4A]">
            <p>We verify your contact information to ensure you receive important updates about your case.</p>
            <p className="mt-1">Please use a permanent email address (not temporary or disposable).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
