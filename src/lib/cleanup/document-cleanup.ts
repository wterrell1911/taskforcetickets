/**
 * Document cleanup utility
 *
 * Deletes original uploaded documents after the retention period
 * following case disposition. Keeps anonymized case data for analytics.
 */

import { getAdminClient, deleteFiles, STORAGE_BUCKETS } from '@/lib/db/supabase';

interface CleanupResult {
  casesProcessed: number;
  documentsDeleted: number;
  errors: string[];
}

/**
 * Default retention period in days after case disposition
 */
const DEFAULT_RETENTION_DAYS = 30;

/**
 * Run document cleanup for cases past retention period
 *
 * @param retentionDays - Days to retain documents after disposition (default: 30)
 * @returns Cleanup result with counts and any errors
 */
export async function runDocumentCleanup(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<CleanupResult> {
  const supabase = getAdminClient();
  const result: CleanupResult = {
    casesProcessed: 0,
    documentsDeleted: 0,
    errors: [],
  };

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find cases with documents that need cleanup
    const { data: expiredCases, error: queryError } = await supabase
      .from('cases')
      .select('id, ticket_document_path, license_document_path, supporting_document_path, disposed_at')
      .not('disposed_at', 'is', null)
      .lt('disposed_at', cutoffDate.toISOString())
      .eq('documents_deleted', false);

    if (queryError) {
      result.errors.push(`Query error: ${queryError.message}`);
      return result;
    }

    if (!expiredCases || expiredCases.length === 0) {
      console.log('No cases require document cleanup');
      return result;
    }

    console.log(`Found ${expiredCases.length} cases for document cleanup`);

    // Process each case
    for (const caseItem of expiredCases) {
      const documentsToDelete: string[] = [];

      if (caseItem.ticket_document_path) {
        documentsToDelete.push(caseItem.ticket_document_path);
      }
      if (caseItem.license_document_path) {
        documentsToDelete.push(caseItem.license_document_path);
      }
      if (caseItem.supporting_document_path) {
        documentsToDelete.push(caseItem.supporting_document_path);
      }

      if (documentsToDelete.length === 0) {
        // No documents to delete, just mark as deleted
        await markDocumentsDeleted(supabase, caseItem.id, []);
        result.casesProcessed++;
        continue;
      }

      // Delete documents from storage
      const deleteResult = await deleteFiles(STORAGE_BUCKETS.INTAKE_DOCUMENTS, documentsToDelete);

      if (!deleteResult.success) {
        result.errors.push(`Failed to delete documents for case ${caseItem.id}: ${deleteResult.errors.join(', ')}`);
        continue;
      }

      // Mark case as documents deleted
      await markDocumentsDeleted(supabase, caseItem.id, documentsToDelete);

      // Log the cleanup
      await logCleanup(supabase, caseItem.id, documentsToDelete, retentionDays);

      result.casesProcessed++;
      result.documentsDeleted += documentsToDelete.length;
    }

    console.log(`Cleanup complete: ${result.casesProcessed} cases, ${result.documentsDeleted} documents deleted`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Cleanup error: ${message}`);
    return result;
  }
}

/**
 * Mark a case's documents as deleted
 */
async function markDocumentsDeleted(
  supabase: ReturnType<typeof getAdminClient>,
  caseId: string,
  deletedPaths: string[]
): Promise<void> {
  await supabase
    .from('cases')
    .update({
      documents_deleted: true,
      documents_deleted_at: new Date().toISOString(),
      ticket_document_path: null,
      license_document_path: null,
      supporting_document_path: null,
    })
    .eq('id', caseId);
}

/**
 * Log the cleanup action for auditing
 */
async function logCleanup(
  supabase: ReturnType<typeof getAdminClient>,
  caseId: string,
  deletedPaths: string[],
  retentionDays: number
): Promise<void> {
  await supabase.from('document_cleanup_logs').insert({
    case_id: caseId,
    documents_deleted: deletedPaths,
    retention_days: retentionDays,
  });
}

/**
 * Delete license documents early (7 days after acceptance)
 * License images contain sensitive PII that should be deleted sooner
 */
export async function runLicenseCleanup(): Promise<CleanupResult> {
  const supabase = getAdminClient();
  const result: CleanupResult = {
    casesProcessed: 0,
    documentsDeleted: 0,
    errors: [],
  };

  try {
    // Calculate cutoff date (7 days after acceptance)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    // Find accepted cases with license documents older than 7 days
    const { data: cases, error: queryError } = await supabase
      .from('cases')
      .select('id, license_document_path, accepted_at')
      .not('accepted_at', 'is', null)
      .lt('accepted_at', cutoffDate.toISOString())
      .not('license_document_path', 'is', null);

    if (queryError) {
      result.errors.push(`Query error: ${queryError.message}`);
      return result;
    }

    if (!cases || cases.length === 0) {
      console.log('No license documents require early cleanup');
      return result;
    }

    console.log(`Found ${cases.length} license documents for early cleanup`);

    for (const caseItem of cases) {
      if (!caseItem.license_document_path) continue;

      const deleteResult = await deleteFiles(
        STORAGE_BUCKETS.INTAKE_DOCUMENTS,
        [caseItem.license_document_path]
      );

      if (!deleteResult.success) {
        result.errors.push(`Failed to delete license for case ${caseItem.id}`);
        continue;
      }

      // Update case to remove license path
      await supabase
        .from('cases')
        .update({ license_document_path: null })
        .eq('id', caseItem.id);

      result.casesProcessed++;
      result.documentsDeleted++;
    }

    console.log(`License cleanup complete: ${result.documentsDeleted} documents deleted`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`License cleanup error: ${message}`);
    return result;
  }
}
