import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { syncMPDData } from '@/lib/socrata';
import { getLatestSync } from '@/lib/db/enforcement-store';

// Increase timeout for sync operations (requires Vercel Pro for >10s)
export const maxDuration = 60;

const AUTH_COOKIE_NAME = 'tft_admin_auth';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
