/**
 * GET /api/cron/sync-traffic
 *
 * Weekly cron job to sync MPD traffic stops from Memphis Data Hub
 * Runs every Monday at 6 AM CST
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncMPDData } from '@/lib/socrata';

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the request is from Vercel Cron
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log('[Cron] Starting weekly traffic data sync...');

  try {
    // Sync last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const result = await syncMPDData({
      startDate,
      onProgress: (message, count) => {
        console.log(`[Cron] ${message}: ${count} records`);
      },
    });

    if (result.success) {
      console.log(`[Cron] Sync completed: ${result.recordsProcessed} records`);
      return NextResponse.json({
        success: true,
        message: `Synced ${result.recordsProcessed} traffic stops`,
        recordsProcessed: result.recordsProcessed,
      });
    } else {
      console.error('[Cron] Sync failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Cron] Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    }, { status: 500 });
  }
}
