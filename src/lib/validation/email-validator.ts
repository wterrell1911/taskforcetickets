/**
 * Email Validation Service using UserCheck API
 * Validates emails and blocks disposable/fake email providers
 * 
 * API: https://usercheck.com
 * Free tier: No API key needed for basic validation
 */

// Known disposable email domains (backup list if API fails)
const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com', 'tempmail.com', 'throwawaymail.com', 'mailinator.com',
  'guerrillamail.com', 'sharklasers.com', 'guerrillamail.info', 'grr.la',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org',
  '10minutemail.com', '10minutemail.net', 'minutemail.net', 'temp-mail.org',
  'fakeinbox.com', 'trashmail.com', 'trashmail.net', 'mailnesia.com',
  'maildrop.cc', 'getnada.com', 'emailondeck.com', 'dispostable.com',
  'tempail.com', 'tempr.email', 'discard.email', 'dropmail.me',
  'mohmal.com', 'crazymailing.com', 'spamgourmet.com', 'mytemp.email',
  'burnermail.io', 'throwaway.email', 'jetable.org', 'spambox.us',
  'mailcatch.com', 'fakemailgenerator.com', 'emailfake.com', 'tempmailaddress.com',
  'tempmailo.com', 'emailtemporario.com.br', 'anonymbox.com', 'courriel.fr.nf',
  'einrot.com', 'getairmail.com', 'harakirimail.com', 'inboxkitten.com',
  'mail-temp.com', 'mailforspam.com', 'mailnator.com', 'mintemail.com',
  'moakt.com', 'nada.email', 'receiveee.com', 'tempmailbox.com',
  'tempsky.com', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
]);

// Common typo domains to suggest corrections
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outlool.com': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
};

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'DISPOSABLE' | 'MX_NOT_FOUND' | 'BLOCKLISTED' | 'TYPO_DETECTED';
  suggestion?: string; // For typo corrections
  isDisposable?: boolean;
  hasMxRecords?: boolean;
  domain?: string;
}

/**
 * Validate email format using regex
 */
function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email
 */
function getDomain(email: string): string {
  const parts = email.toLowerCase().trim().split('@');
  return parts[1] || '';
}

/**
 * Check if domain has a common typo and suggest correction
 */
function checkForTypo(email: string): string | null {
  const domain = getDomain(email);
  const suggestion = DOMAIN_TYPOS[domain];
  if (suggestion) {
    const localPart = email.split('@')[0];
    return `${localPart}@${suggestion}`;
  }
  return null;
}

/**
 * Check domain against known disposable email list (fallback)
 */
function isKnownDisposable(email: string): boolean {
  const domain = getDomain(email);
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Validate email using UserCheck API
 * Falls back to local validation if API fails
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const domain = getDomain(normalizedEmail);

  // Basic format validation
  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      valid: false,
      email: normalizedEmail,
      error: 'Please enter a valid email address',
      errorCode: 'INVALID_FORMAT',
      domain,
    };
  }

  // Check for common typos first
  const typoSuggestion = checkForTypo(normalizedEmail);
  if (typoSuggestion) {
    return {
      valid: false,
      email: normalizedEmail,
      error: `Did you mean ${typoSuggestion}?`,
      errorCode: 'TYPO_DETECTED',
      suggestion: typoSuggestion,
      domain,
    };
  }

  // Try UserCheck API for comprehensive validation
  try {
    const response = await fetch(
      `https://api.usercheck.com/email/${encodeURIComponent(normalizedEmail)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Short timeout to avoid blocking form submission too long
        signal: AbortSignal.timeout(3000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // UserCheck response structure
      const isDisposable = data.disposable === true;
      const hasMx = data.mx === true;
      const isBlocked = data.blocklist === true;

      if (isDisposable) {
        return {
          valid: false,
          email: normalizedEmail,
          error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.',
          errorCode: 'DISPOSABLE',
          isDisposable: true,
          hasMxRecords: hasMx,
          domain,
        };
      }

      if (isBlocked) {
        return {
          valid: false,
          email: normalizedEmail,
          error: 'This email address cannot be used. Please try a different email.',
          errorCode: 'BLOCKLISTED',
          isDisposable: false,
          hasMxRecords: hasMx,
          domain,
        };
      }

      if (!hasMx) {
        return {
          valid: false,
          email: normalizedEmail,
          error: 'This email domain does not appear to accept emails. Please check the address.',
          errorCode: 'MX_NOT_FOUND',
          isDisposable: false,
          hasMxRecords: false,
          domain,
        };
      }

      // Email passes all checks
      return {
        valid: true,
        email: normalizedEmail,
        isDisposable: false,
        hasMxRecords: true,
        domain,
      };
    }
  } catch (error) {
    // API failed - fall back to local validation
    console.warn('UserCheck API unavailable, using local validation:', error);
  }

  // Fallback: Check against local disposable domain list
  if (isKnownDisposable(normalizedEmail)) {
    return {
      valid: false,
      email: normalizedEmail,
      error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.',
      errorCode: 'DISPOSABLE',
      isDisposable: true,
      domain,
    };
  }

  // If we can't verify via API and it's not in our blocklist, allow it
  return {
    valid: true,
    email: normalizedEmail,
    isDisposable: false,
    domain,
  };
}

/**
 * Quick synchronous check (no API call) - for real-time feedback
 */
export function quickEmailCheck(email: string): { valid: boolean; error?: string; suggestion?: string } {
  const normalizedEmail = email.toLowerCase().trim();

  if (!isValidEmailFormat(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  const typoSuggestion = checkForTypo(normalizedEmail);
  if (typoSuggestion) {
    return { valid: false, error: `Did you mean ${typoSuggestion}?`, suggestion: typoSuggestion };
  }

  if (isKnownDisposable(normalizedEmail)) {
    return { valid: false, error: 'Temporary email addresses are not allowed' };
  }

  return { valid: true };
}
