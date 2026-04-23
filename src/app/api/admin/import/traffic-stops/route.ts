import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseTrafficStopsCSV, calculateStats, type MPDTrafficStop } from '@/lib/csv-import';
import {
  addEnforcementRecords,
  getEnforcementStats,
  type EnforcementRecord,
} from '@/lib/db/enforcement-store';

const AUTH_COOKIE_NAME = 'tft_admin_auth';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const maxDuration = 60;

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

function categorizeViolation(eventType: string): string {
  const v = (eventType || '').toLowerCase();
  if (v.includes('speed') || v.includes('mph')) return 'speed';
  if (v.includes('light') || v.includes('equipment') || v.includes('brake') || v.includes('mirror')) return 'equipment';
  if (v.includes('registration') || v.includes('tag') || v.includes('plate')) return 'registration';
  if (v.includes('license') || v.includes('dl') || v.includes("driver's")) return 'license';
  if (v.includes('insurance') || v.includes('sr-22') || v.includes('financial')) return 'insurance';
  return 'other';
}

function toEnforcementRecord(stop: MPDTrafficStop): Omit<EnforcementRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const dt = stop.reportedDatetime;
  const date = dt.toISOString().split('T')[0];
  const time = dt.toTimeString().slice(0, 5); // HH:MM
  const violation = stop.eventType || 'Traffic Stop';
  return {
    source: 'mpd',
    date,
    time,
    location: stop.location,
    lat: stop.latitude || undefined,
    lng: stop.longitude || undefined,
    violationType: violation,
    violationCategory: categorizeViolation(violation),
    agency: 'MPD',
    ward: stop.mpdWard ? String(stop.mpdWard) : undefined,
    precinct: stop.mpdPrecinct || undefined,
    eventNumber: stop.eventNumber || undefined,
    dispositionCode: stop.dispositionCode || undefined,
    zipCode: stop.zipCode || undefined,
    rawData: {
      OBJECTID: stop.objectId,
      'Event Number': stop.eventNumber,
      'Event Type': stop.eventType,
      Reported_Datetime: dt.toISOString(),
      'Disposition Code': stop.dispositionCode,
      Location: stop.location,
      Latitude: stop.latitude,
      Longitude: stop.longitude,
      'ZIP Code': stop.zipCode,
      'Council District': stop.councilDistrict,
      'Super District': stop.superDistrict,
      Tract: stop.tract,
      'Tract Name': stop.tractName,
      'Planning District': stop.planningDistrict,
      'MPD Precinct': stop.mpdPrecinct,
      'MPD Ward': stop.mpdWard,
    },
  };
}

/**
 * POST /api/admin/import/traffic-stops
 *
 * CSV upload of MPD traffic stops. Inserts into Supabase enforcement_records (source='mpd').
 * Appends to existing data — does NOT clear. If you need a clean replace, clear via the
 * admin sync UI first.
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
        { status: 400 },
      );
    }

    const content = await file.text();
    const stops = parseTrafficStopsCSV(content);
    if (stops.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in CSV' },
        { status: 400 },
      );
    }

    const stats = calculateStats(stops);

    const dates = stops
      .map((s) => s.reportedDatetime.getTime())
      .filter((d) => !isNaN(d));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const records = stops.map(toEnforcementRecord);
    const inserted = await addEnforcementRecords(records);

    return NextResponse.json({
      success: true,
      imported: inserted,
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
    });
  } catch (error) {
    console.error('[import/traffic-stops] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/import/traffic-stops
 * Returns current aggregated stats so the Import Data page can show a summary.
 * (History of individual CSV uploads is not tracked — all imports land in
 * enforcement_records alongside the weekly sync.)
 */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const s = await getEnforcementStats('mpd');
    return NextResponse.json({
      history: [],
      currentStats: {
        totalRecords: s.totalRecords,
        lastUpdated: s.lastUpdated,
        byPrecinct: s.stats.byPrecinct,
        byZipCode: s.stats.byZipCode,
        byYear: s.stats.byYear,
      },
    });
  } catch (error) {
    console.error('[import/traffic-stops] stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load import stats' },
      { status: 500 },
    );
  }
}
