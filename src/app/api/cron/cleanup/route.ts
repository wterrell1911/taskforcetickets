import { NextRequest, NextResponse } from 'next/server';
import { runDocumentCleanup, runLicenseCleanup } from '@/lib/cleanup/document-cleanup';

/**
 * Cron job endpoint for document cleanup
 *
 * This should be called by a cron job service (e.g., Vercel Cron, GitHub Actions)
 * Run daily at 2 AM CT
 *
 * Security: Requires CRON_SECRET in Authorization header
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Starting scheduled document cleanup...');

  try {
    // Run license cleanup first (7-day retention)
    const licenseResult = await runLicenseCleanup();

    // Run main document cleanup (30-day retention)
    const documentResult = await runDocumentCleanup(30);

    const summary = {
      licenseCleanup: {
        casesProcessed: licenseResult.casesProcessed,
        documentsDeleted: licenseResult.documentsDeleted,
        errors: licenseResult.errors,
      },
      documentCleanup: {
        casesProcessed: documentResult.casesProcessed,
        documentsDeleted: documentResult.documentsDeleted,
        errors: documentResult.errors,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Cleanup completed:', summary);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for more flexibility
export const POST = GET;
