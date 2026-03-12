/**
 * Validation Services
 * Centralized validation utilities for form data
 */

export {
  validateEmail,
  quickEmailCheck,
  type EmailValidationResult,
} from './email-validator';

export {
  validatePhone,
  quickPhoneCheck,
  getLineTypeLabel,
  type PhoneValidationResult,
  type LineType,
} from './phone-validator';

export {
  getAddressSuggestions,
  validateAddress,
  parseAddressLine,
  formatValidatedAddress,
  formatAddressWithCounty,
  type AddressSuggestion,
  type ValidatedAddress,
  type AddressValidationResult,
  type AutocompleteResult,
} from './address-validator';

/**
 * Validate all contact fields at once
 * Used for form submission validation
 */
export interface ContactValidationResult {
  valid: boolean;
  errors: {
    email?: string;
    phone?: string;
    address?: string;
  };
  data?: {
    email: { valid: boolean; isDisposable?: boolean };
    phone: { valid: boolean; lineType?: string };
    address?: { valid: boolean; county?: string };
  };
}

import { validateEmail } from './email-validator';
import { validatePhone } from './phone-validator';
import { validateAddress } from './address-validator';

/**
 * Validate all contact information in parallel
 */
export async function validateContact(
  email: string,
  phone: string,
  address?: { street: string; city?: string; state?: string; zipCode?: string }
): Promise<ContactValidationResult> {
  const validations = await Promise.all([
    validateEmail(email),
    validatePhone(phone),
    address ? validateAddress(address.street, address.city, address.state, address.zipCode) : null,
  ]);

  const [emailResult, phoneResult, addressResult] = validations;
  const errors: ContactValidationResult['errors'] = {};

  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  if (!phoneResult.valid) {
    errors.phone = phoneResult.error;
  }

  if (addressResult && !addressResult.valid) {
    errors.address = addressResult.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      email: {
        valid: emailResult.valid,
        isDisposable: emailResult.isDisposable,
      },
      phone: {
        valid: phoneResult.valid,
        lineType: phoneResult.lineType,
      },
      address: addressResult ? {
        valid: addressResult.valid,
        county: addressResult.address?.county,
      } : undefined,
    },
  };
}
