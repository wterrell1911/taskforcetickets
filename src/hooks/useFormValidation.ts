/**
 * Hook for real-time form validation
 */

import { useState, useCallback, useRef } from 'react';
import { quickEmailCheck } from '@/lib/validation/email-validator';
import { quickPhoneCheck } from '@/lib/validation/phone-validator';

interface ValidationState {
  email: { valid: boolean | null; error?: string; suggestion?: string; checking: boolean };
  phone: { valid: boolean | null; error?: string; formatted?: string; checking: boolean };
}

interface UseFormValidationReturn {
  validation: ValidationState;
  validateEmail: (email: string) => void;
  validatePhone: (phone: string) => void;
  validateEmailAsync: (email: string) => Promise<void>;
  validatePhoneAsync: (phone: string) => Promise<void>;
  resetValidation: () => void;
}

const initialState: ValidationState = {
  email: { valid: null, checking: false },
  phone: { valid: null, checking: false },
};

export function useFormValidation(): UseFormValidationReturn {
  const [validation, setValidation] = useState<ValidationState>(initialState);
  const debounceRef = useRef<{ email?: NodeJS.Timeout; phone?: NodeJS.Timeout }>({});

  // Quick synchronous email check (for real-time feedback)
  const validateEmail = useCallback((email: string) => {
    if (!email) {
      setValidation((prev) => ({
        ...prev,
        email: { valid: null, checking: false },
      }));
      return;
    }

    const result = quickEmailCheck(email);
    setValidation((prev) => ({
      ...prev,
      email: {
        valid: result.valid,
        error: result.error,
        suggestion: result.suggestion,
        checking: false,
      },
    }));
  }, []);

  // Quick synchronous phone check (for real-time feedback)
  const validatePhone = useCallback((phone: string) => {
    if (!phone) {
      setValidation((prev) => ({
        ...prev,
        phone: { valid: null, checking: false },
      }));
      return;
    }

    const result = quickPhoneCheck(phone);
    setValidation((prev) => ({
      ...prev,
      phone: {
        valid: result.valid,
        error: result.error,
        formatted: result.formatted,
        checking: false,
      },
    }));
  }, []);

  // Async email validation (API call - for form submission)
  const validateEmailAsync = useCallback(async (email: string) => {
    if (!email) return;

    // Clear any pending debounce
    if (debounceRef.current.email) {
      clearTimeout(debounceRef.current.email);
    }

    setValidation((prev) => ({
      ...prev,
      email: { ...prev.email, checking: true },
    }));

    try {
      const response = await fetch('/api/validation/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setValidation((prev) => ({
        ...prev,
        email: {
          valid: data.valid,
          error: data.error,
          suggestion: data.suggestion,
          checking: false,
        },
      }));
    } catch (error) {
      console.error('Email validation error:', error);
      // On error, fall back to local validation
      validateEmail(email);
    }
  }, [validateEmail]);

  // Async phone validation (API call - for form submission)
  const validatePhoneAsync = useCallback(async (phone: string) => {
    if (!phone) return;

    // Clear any pending debounce
    if (debounceRef.current.phone) {
      clearTimeout(debounceRef.current.phone);
    }

    setValidation((prev) => ({
      ...prev,
      phone: { ...prev.phone, checking: true },
    }));

    try {
      const response = await fetch('/api/validation/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      setValidation((prev) => ({
        ...prev,
        phone: {
          valid: data.valid,
          error: data.error,
          formatted: data.formatted,
          checking: false,
        },
      }));
    } catch (error) {
      console.error('Phone validation error:', error);
      // On error, fall back to local validation
      validatePhone(phone);
    }
  }, [validatePhone]);

  const resetValidation = useCallback(() => {
    setValidation(initialState);
  }, []);

  return {
    validation,
    validateEmail,
    validatePhone,
    validateEmailAsync,
    validatePhoneAsync,
    resetValidation,
  };
}
