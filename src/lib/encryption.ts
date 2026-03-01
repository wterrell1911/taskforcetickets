/**
 * Encryption utilities for sensitive data storage
 *
 * Uses AES-256-CBC encryption for sensitive fields like:
 * - Driver's license numbers
 * - Full addresses
 * - Date of birth
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * Get the encryption key from environment
 * Must be a 32-byte (64 character) hex string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 64) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string using AES-256-CBC
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format "iv:encryptedData"
 */
export function encryptSensitiveField(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return IV and encrypted data together
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with encryptSensitiveField
 *
 * @param encryptedText - Encrypted string in format "iv:encryptedData"
 * @returns Decrypted plain text
 */
export function decryptSensitiveField(encryptedText: string): string {
  if (!encryptedText) return '';

  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask a license number for display
 * Shows only the last 4 characters
 *
 * @param fullNumber - Full license number
 * @returns Masked license number (e.g., "****5678")
 */
export function maskLicenseNumber(fullNumber: string): string {
  if (!fullNumber) return '';
  if (fullNumber.length <= 4) return '****';

  const lastFour = fullNumber.slice(-4);
  const maskLength = fullNumber.length - 4;
  return '*'.repeat(maskLength) + lastFour;
}

/**
 * Mask a date of birth for display
 * Shows only the year
 *
 * @param dob - Date of birth in YYYY-MM-DD or MM/DD/YYYY format
 * @returns Masked DOB showing only year
 */
export function maskDateOfBirth(dob: string): string {
  if (!dob) return '';

  // Handle both formats
  if (dob.includes('-')) {
    // YYYY-MM-DD format
    const year = dob.split('-')[0];
    return `**/**/${year}`;
  } else if (dob.includes('/')) {
    // MM/DD/YYYY format
    const year = dob.split('/')[2];
    return `**/**/${year}`;
  }

  return '**/**/****';
}

/**
 * Hash a string using SHA-256
 * Useful for creating non-reversible identifiers
 *
 * @param text - Text to hash
 * @returns SHA-256 hash as hex string
 */
export function hashString(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random encryption key (for setup purposes)
 * Should be run once and stored in environment variable
 *
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate that an encryption key is properly formatted
 *
 * @param key - Key to validate
 * @returns true if valid
 */
export function isValidEncryptionKey(key: string): boolean {
  if (!key || key.length !== 64) return false;

  // Check if it's valid hex
  return /^[0-9a-fA-F]{64}$/.test(key);
}

/**
 * Safely encrypt data, returning null if encryption fails
 * Use this for optional fields
 */
export function safeEncrypt(text: string | null | undefined): string | null {
  if (!text) return null;

  try {
    return encryptSensitiveField(text);
  } catch {
    console.error('Encryption failed');
    return null;
  }
}

/**
 * Safely decrypt data, returning null if decryption fails
 * Use this to handle corrupted or invalid encrypted data
 */
export function safeDecrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;

  try {
    return decryptSensitiveField(encryptedText);
  } catch {
    console.error('Decryption failed');
    return null;
  }
}
