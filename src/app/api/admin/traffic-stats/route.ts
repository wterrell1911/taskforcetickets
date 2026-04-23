import { NextResponse } from 'next/server';
import { getEnforcementStats } from '@/lib/db/enforcement-store';

/**
 * GET /api/admin/traffic-stats
 * Returns aggregated traffic stop statistics for dashboard.
 * Reads from Supabase enforcement_records (source='mpd').
 */
export async function GET() {
  try {
    const stats = await getEnforcementStats('mpd');

    if (stats.totalRecords === 0) {
      return NextResponse.json({
        totalRecords: 0,
        lastUpdated: null,
        message: 'No traffic data yet. Run the weekly MPD sync or upload a CSV.',
        stats: stats.stats,
      });
    }

    return NextResponse.json({
      totalRecords: stats.totalRecords,
      lastUpdated: stats.lastUpdated,
      dateRange: stats.dateRange,
      stats: stats.stats,
    });
  } catch (error) {
    console.error('[traffic-stats] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load stats' },
      { status: 500 },
    );
  }
}
