import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseTrafficStopsCSV, calculateStats } from '@/lib/csv-import';

const AUTH_COOKIE_NAME = 'tft_admin_auth';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

/**
 * Verify admin authentication
 */
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

/**
 * POST /api/admin/import/traffic-stops
 * Import MPD Traffic Stops from CSV
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse CSV
    const stops = parseTrafficStopsCSV(content);

    if (stops.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in CSV' },
        { status: 400 }
      );
    }

    // Calculate statistics
    const stats = calculateStats(stops);

    // Get date range
    const dates = stops.map((s) => s.reportedDatetime.getTime()).filter((d) => !isNaN(d));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Store in database
    const { storeTrafficStops, createImportLog } = await import('@/lib/db/store');

    const importLog = await createImportLog({
      filename: file.name,
      recordCount: stops.length,
      dateRangeStart: minDate.toISOString(),
      dateRangeEnd: maxDate.toISOString(),
    });

    // Store the stops
    const stored = await storeTrafficStops(stops);

    return NextResponse.json({
      success: true,
      imported: stored,
      total: stops.length,
      dateRange: {
        start: minDate.toISOString(),
        end: maxDate.toISOString(),
      },
      stats: {
        total: stats.total,
        citations: stats.byCitation,
        warnings: stats.byWarning,
        precincts: Object.keys(stats.byPrecinct).length,
        zipCodes: Object.keys(stats.byZipCode).length,
      },
      importId: importLog.id,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import/traffic-stops
 * Get import history and current stats
 */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getImportHistory, getTrafficStopStats } = await import('@/lib/db/store');

    const [history, stats] = await Promise.all([
      getImportHistory(),
      getTrafficStopStats(),
    ]);

    return NextResponse.json({
      history,
      currentStats: stats,
    });
  } catch (error) {
    console.error('Failed to get import info:', error);
    return NextResponse.json(
      { error: 'Failed to get import information' },
      { status: 500 }
    );
  }
}
