/**
 * Supabase client configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return url;
}

/**
 * Get Supabase anon key from environment
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }
  return key;
}

/**
 * Public Supabase client for client-side operations
 * Limited permissions based on RLS policies
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return supabaseInstance;
}

// Export for backward compatibility
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};

/**
 * Admin Supabase client for server-side operations
 * Has full access, bypasses RLS - use only on server!
 */
export function getAdminClient(): SupabaseClient {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  adminClientInstance = createClient(getSupabaseUrl(), supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  INTAKE_DOCUMENTS: 'intake-documents',
  PROCESSED_THUMBNAILS: 'processed-thumbnails',
} as const;

/**
 * Upload a file to Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param file - File to upload
 * @returns Object with path and error (if any)
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ path: string | null; error: Error | null }> {
  const admin = getAdminClient();

  const { error } = await admin.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Upload error:', error);
    return { path: null, error: new Error(error.message) };
  }

  return { path, error: null };
}

/**
 * Get a signed URL for a private file
 * URLs expire after the specified duration
 *
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param expiresIn - Seconds until URL expires (default 1 hour)
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const admin = getAdminClient();

  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete files from storage
 *
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths to delete
 * @returns Object with success status and any errors
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<{ success: boolean; errors: string[] }> {
  const admin = getAdminClient();
  const errors: string[] = [];

  const { error } = await admin.storage.from(bucket).remove(paths);

  if (error) {
    console.error('Delete error:', error);
    errors.push(error.message);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique file path for uploads
 *
 * @param caseId - Case UUID
 * @param documentType - Type of document (ticket, license, supporting)
 * @param originalFilename - Original filename
 * @returns Unique file path
 */
export function generateFilePath(
  caseId: string,
  documentType: 'ticket' | 'license' | 'supporting',
  originalFilename: string
): string {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || 'jpg';
  return `${caseId}/${documentType}_${timestamp}.${extension}`;
}
