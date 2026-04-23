import { NextRequest, NextResponse } from 'next/server';
import { fetchAllEnforcementRecords } from '@/lib/db/enforcement-store';

export const maxDuration = 60;

interface EnforcementRow {
  date: string;
  time: string | null;
  precinct: string | null;
  zip_code: string | null;
  disposition_code: string | null;
  raw_data: Record<string, unknown> | null;
}

function planningDistrictOf(rawData: Record<string, unknown> | null): string | null {
  if (!rawData) return null;
  return (
    (rawData.Planning_District as string | undefined) ??
    (rawData['Planning District'] as string | undefined) ??
    null
  );
}

function yearOf(date: string): number {
  return parseInt(date.slice(0, 4), 10);
}

function monthOf(date: string): string {
  return date.slice(0, 7); // YYYY-MM
}

function hourOf(time: string | null): number | null {
  if (!time) return null;
  const [hh] = time.split(':');
  const h = parseInt(hh, 10);
  return isNaN(h) ? null : h;
}

function dowOf(date: string): number {
  // Parse as UTC date to keep day-of-week stable regardless of server timezone
  const d = new Date(`${date}T00:00:00Z`);
  return d.getUTCDay();
}

interface QueryResult {
  totalFiltered: number;
  byYear: Record<number, number>;
  byMonth: Record<string, number>;
  byPrecinct: Record<string, number>;
  byZipCode: Record<string, number>;
  byDisposition: Record<string, number>;
  byPlanningDistrict: Record<string, number>;
  byDayOfWeek: Record<number, number>;
  byHour: Record<number, number>;
  comparison?: {
    year1: number;
    year2: number;
    year1Count: number;
    year2Count: number;
    change: number;
    changePercent: number;
    byPrecinct: Array<{
      precinct: string;
      year1: number;
      year2: number;
      change: number;
      changePercent: number;
    }>;
    byMonth: Array<{
      month: number;
      year1: number;
      year2: number;
      change: number;
    }>;
  };
}

/**
 * POST /api/admin/traffic-stops/query
 * Query traffic stops with filters and get aggregated results.
 * Reads from Supabase enforcement_records (source='mpd').
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      years,
      precincts,
      zipCodes,
      dispositions,
      planningDistricts,
      compareYears,
    }: {
      years?: number[];
      precincts?: string[];
      zipCodes?: string[];
      dispositions?: string[];
      planningDistricts?: string[];
      compareYears?: number[];
    } = body;

    const allRows = await fetchAllEnforcementRecords<EnforcementRow>(
      'mpd',
      'date, time, precinct, zip_code, disposition_code, raw_data',
    );

    // Apply filters (done in-memory after fetch — simpler than chaining conditional SQL)
    const filtered = allRows.filter((r) => {
      if (years && years.length > 0) {
        if (!years.includes(yearOf(r.date))) return false;
      }
      if (precincts && precincts.length > 0) {
        if (!r.precinct || !precincts.includes(r.precinct)) return false;
      }
      if (zipCodes && zipCodes.length > 0) {
        if (!r.zip_code || !zipCodes.includes(r.zip_code)) return false;
      }
      if (dispositions && dispositions.length > 0) {
        if (!r.disposition_code || !dispositions.includes(r.disposition_code)) return false;
      }
      if (planningDistricts && planningDistricts.length > 0) {
        const pd = planningDistrictOf(r.raw_data);
        if (!pd || !planningDistricts.includes(pd)) return false;
      }
      return true;
    });

    const result: QueryResult = {
      totalFiltered: filtered.length,
      byYear: {},
      byMonth: {},
      byPrecinct: {},
      byZipCode: {},
      byDisposition: {},
      byPlanningDistrict: {},
      byDayOfWeek: {},
      byHour: {},
    };

    for (const r of filtered) {
      const year = yearOf(r.date);
      const month = monthOf(r.date);
      const dow = dowOf(r.date);
      const hour = hourOf(r.time);

      if (!isNaN(year)) result.byYear[year] = (result.byYear[year] || 0) + 1;
      result.byMonth[month] = (result.byMonth[month] || 0) + 1;
      result.byDayOfWeek[dow] = (result.byDayOfWeek[dow] || 0) + 1;
      if (hour !== null) result.byHour[hour] = (result.byHour[hour] || 0) + 1;

      if (r.precinct) result.byPrecinct[r.precinct] = (result.byPrecinct[r.precinct] || 0) + 1;
      if (r.zip_code) result.byZipCode[r.zip_code] = (result.byZipCode[r.zip_code] || 0) + 1;
      if (r.disposition_code) {
        result.byDisposition[r.disposition_code] = (result.byDisposition[r.disposition_code] || 0) + 1;
      }
      const pd = planningDistrictOf(r.raw_data);
      if (pd) result.byPlanningDistrict[pd] = (result.byPlanningDistrict[pd] || 0) + 1;
    }

    // Year-over-year comparison operates on the unfiltered dataset to match the prior behavior
    if (compareYears && compareYears.length === 2) {
      const [year1, year2] = [...compareYears].sort((a, b) => a - b);

      const year1Rows = allRows.filter((r) => yearOf(r.date) === year1);
      const year2Rows = allRows.filter((r) => yearOf(r.date) === year2);

      const precinctComparison: Record<string, { year1: number; year2: number }> = {};
      for (const r of year1Rows) {
        if (r.precinct) {
          precinctComparison[r.precinct] ??= { year1: 0, year2: 0 };
          precinctComparison[r.precinct].year1++;
        }
      }
      for (const r of year2Rows) {
        if (r.precinct) {
          precinctComparison[r.precinct] ??= { year1: 0, year2: 0 };
          precinctComparison[r.precinct].year2++;
        }
      }

      const monthComparison: Record<number, { year1: number; year2: number }> = {};
      for (let m = 1; m <= 12; m++) monthComparison[m] = { year1: 0, year2: 0 };

      for (const r of year1Rows) {
        const m = parseInt(r.date.slice(5, 7), 10);
        if (m >= 1 && m <= 12) monthComparison[m].year1++;
      }
      for (const r of year2Rows) {
        const m = parseInt(r.date.slice(5, 7), 10);
        if (m >= 1 && m <= 12) monthComparison[m].year2++;
      }

      const year1Count = year1Rows.length;
      const year2Count = year2Rows.length;
      const change = year2Count - year1Count;
      const changePercent = year1Count > 0 ? Math.round((change / year1Count) * 1000) / 10 : 0;

      result.comparison = {
        year1,
        year2,
        year1Count,
        year2Count,
        change,
        changePercent,
        byPrecinct: Object.entries(precinctComparison)
          .map(([precinct, d]) => ({
            precinct,
            year1: d.year1,
            year2: d.year2,
            change: d.year2 - d.year1,
            changePercent:
              d.year1 > 0 ? Math.round(((d.year2 - d.year1) / d.year1) * 1000) / 10 : 0,
          }))
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
        byMonth: Object.entries(monthComparison)
          .map(([month, d]) => ({
            month: parseInt(month, 10),
            year1: d.year1,
            year2: d.year2,
            change: d.year2 - d.year1,
          }))
          .sort((a, b) => a.month - b.month),
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[traffic-stops/query] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 },
    );
  }
}
