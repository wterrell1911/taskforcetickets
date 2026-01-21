import { NextRequest, NextResponse } from 'next/server';
import { syncMPDData } from '@/lib/socrata';
import { getLatestSync } from '@/lib/db/enforcement-store';

// Increase timeout for sync operations (requires Vercel Pro for >10s)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body;

    const result = await syncMPDData({
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const latestSync = await getLatestSync('mpd');
    return NextResponse.json({
      lastSync: latestSync || null,
    });
  } catch (error) {
    return NextResponse.json({
      lastSync: null,
      error: error instanceof Error ? error.message : 'Failed to get sync status',
    });
  }
}
