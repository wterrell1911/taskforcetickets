import { NextRequest, NextResponse } from 'next/server';
import { syncMPDData } from '@/lib/socrata';

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
  // Get sync status
  const { getLatestSync } = await import('@/lib/db/store');
  const latestSync = await getLatestSync('mpd');

  return NextResponse.json({
    lastSync: latestSync || null,
  });
}
