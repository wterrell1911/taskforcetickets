import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface TrafficStop {
  objectId: number;
  eventNumber: string;
  reportedDatetime: string;
  dispositionCode: string;
  location: string;
  latitude: number;
  longitude: number;
  zipCode: string;
  planningDistrict: string;
  mpdPrecinct: string;
  mpdWard: number | null;
}

interface TrafficStopsDatabase {
  stops: TrafficStop[];
  lastUpdated: string;
  totalRecords: number;
}

let cachedData: TrafficStopsDatabase | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

async function getTrafficData(): Promise<TrafficStopsDatabase> {
  const now = Date.now();
  if (cachedData && now - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  const dataPath = path.join(process.cwd(), 'data', 'traffic-stops.json');
  const raw = await fs.readFile(dataPath, 'utf-8');
  cachedData = JSON.parse(raw);
  cacheTime = now;
  return cachedData!;
}

/**
 * POST /api/admin/traffic-stops/query
 * Query traffic stops with filters and get aggregated results
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
      groupBy = 'month', // month, precinct, zipCode, disposition, planningDistrict
    } = body;

    const db = await getTrafficData();
    let stops = db.stops;

    // Apply filters
    if (years && years.length > 0) {
      stops = stops.filter((s) => {
        const year = new Date(s.reportedDatetime).getFullYear();
        return years.includes(year);
      });
    }

    if (precincts && precincts.length > 0) {
      stops = stops.filter((s) => precincts.includes(s.mpdPrecinct));
    }

    if (zipCodes && zipCodes.length > 0) {
      stops = stops.filter((s) => zipCodes.includes(s.zipCode));
    }

    if (dispositions && dispositions.length > 0) {
      stops = stops.filter((s) => dispositions.includes(s.dispositionCode));
    }

    if (planningDistricts && planningDistricts.length > 0) {
      stops = stops.filter((s) => planningDistricts.includes(s.planningDistrict));
    }

    // Calculate aggregations
    const result: {
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
    } = {
      totalFiltered: stops.length,
      byYear: {},
      byMonth: {},
      byPrecinct: {},
      byZipCode: {},
      byDisposition: {},
      byPlanningDistrict: {},
      byDayOfWeek: {},
      byHour: {},
    };

    // Aggregate
    for (const stop of stops) {
      const date = new Date(stop.reportedDatetime);
      const year = date.getFullYear();
      const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dow = date.getDay();
      const hour = date.getHours();

      result.byYear[year] = (result.byYear[year] || 0) + 1;
      result.byMonth[month] = (result.byMonth[month] || 0) + 1;
      result.byDayOfWeek[dow] = (result.byDayOfWeek[dow] || 0) + 1;
      result.byHour[hour] = (result.byHour[hour] || 0) + 1;

      if (stop.mpdPrecinct) {
        result.byPrecinct[stop.mpdPrecinct] = (result.byPrecinct[stop.mpdPrecinct] || 0) + 1;
      }
      if (stop.zipCode) {
        result.byZipCode[stop.zipCode] = (result.byZipCode[stop.zipCode] || 0) + 1;
      }
      if (stop.dispositionCode) {
        result.byDisposition[stop.dispositionCode] = (result.byDisposition[stop.dispositionCode] || 0) + 1;
      }
      if (stop.planningDistrict) {
        result.byPlanningDistrict[stop.planningDistrict] = (result.byPlanningDistrict[stop.planningDistrict] || 0) + 1;
      }
    }

    // Year-over-year comparison
    if (compareYears && compareYears.length === 2) {
      const [year1, year2] = compareYears.sort((a: number, b: number) => a - b);

      const year1Stops = db.stops.filter((s) => {
        const y = new Date(s.reportedDatetime).getFullYear();
        return y === year1;
      });
      const year2Stops = db.stops.filter((s) => {
        const y = new Date(s.reportedDatetime).getFullYear();
        return y === year2;
      });

      // By precinct comparison
      const precinctComparison: Record<string, { year1: number; year2: number }> = {};
      for (const s of year1Stops) {
        if (s.mpdPrecinct) {
          precinctComparison[s.mpdPrecinct] = precinctComparison[s.mpdPrecinct] || { year1: 0, year2: 0 };
          precinctComparison[s.mpdPrecinct].year1++;
        }
      }
      for (const s of year2Stops) {
        if (s.mpdPrecinct) {
          precinctComparison[s.mpdPrecinct] = precinctComparison[s.mpdPrecinct] || { year1: 0, year2: 0 };
          precinctComparison[s.mpdPrecinct].year2++;
        }
      }

      // By month comparison (1-12)
      const monthComparison: Record<number, { year1: number; year2: number }> = {};
      for (let m = 1; m <= 12; m++) {
        monthComparison[m] = { year1: 0, year2: 0 };
      }
      for (const s of year1Stops) {
        const m = new Date(s.reportedDatetime).getMonth() + 1;
        monthComparison[m].year1++;
      }
      for (const s of year2Stops) {
        const m = new Date(s.reportedDatetime).getMonth() + 1;
        monthComparison[m].year2++;
      }

      const year1Count = year1Stops.length;
      const year2Count = year2Stops.length;
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
          .map(([precinct, data]) => ({
            precinct,
            year1: data.year1,
            year2: data.year2,
            change: data.year2 - data.year1,
            changePercent: data.year1 > 0 ? Math.round(((data.year2 - data.year1) / data.year1) * 1000) / 10 : 0,
          }))
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
        byMonth: Object.entries(monthComparison)
          .map(([month, data]) => ({
            month: parseInt(month),
            year1: data.year1,
            year2: data.year2,
            change: data.year2 - data.year1,
          }))
          .sort((a, b) => a.month - b.month),
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}
