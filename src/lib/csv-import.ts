/**
 * CSV Import utilities for MPD Traffic Stops data
 */

import { parse } from 'csv-parse/sync';

export interface MPDTrafficStop {
  objectId: number;
  eventNumber: string;
  eventType: string;
  reportedDatetime: Date;
  dispositionCode: string;
  location: string;
  latitude: number;
  longitude: number;
  zipCode: string;
  councilDistrict: number | null;
  superDistrict: number | null;
  tract: string;
  tractName: string;
  planningDistrict: string;
  mpdPrecinct: string;
  mpdWard: number | null;
}

interface RawCSVRow {
  OBJECTID: string;
  'Event Number': string;
  'Event Type': string;
  Reported_Datetime: string;
  'Disposition Code': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'ZIP Code': string;
  'Council District': string;
  'Super District': string;
  Tract: string;
  'Tract Name': string;
  'Planning District': string;
  'MPD Precinct': string;
  'MPD Ward': string;
}

/**
 * Parse MPD Traffic Stops CSV data
 */
export function parseTrafficStopsCSV(csvContent: string): MPDTrafficStop[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle BOM character
  }) as RawCSVRow[];

  return records.map((row) => ({
    objectId: parseInt(row.OBJECTID) || 0,
    eventNumber: row['Event Number'] || '',
    eventType: row['Event Type'] || 'Traffic Stop',
    reportedDatetime: parseDateTime(row.Reported_Datetime),
    dispositionCode: row['Disposition Code'] || '',
    location: cleanLocation(row.Location),
    latitude: parseFloat(row.Latitude) || 0,
    longitude: parseFloat(row.Longitude) || 0,
    zipCode: row['ZIP Code'] || '',
    councilDistrict: parseInt(row['Council District']) || null,
    superDistrict: parseInt(row['Super District']) || null,
    tract: row.Tract || '',
    tractName: row['Tract Name'] || '',
    planningDistrict: row['Planning District'] || '',
    mpdPrecinct: row['MPD Precinct'] || '',
    mpdWard: parseInt(row['MPD Ward']) || null,
  }));
}

/**
 * Parse datetime from "1/1/2021 10:33:19 AM" format
 */
function parseDateTime(dateStr: string): Date {
  if (!dateStr) return new Date();

  try {
    // Format: M/D/YYYY H:MM:SS AM/PM
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch {
    // Fall through to manual parsing
  }

  // Manual parsing fallback
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let [, month, day, year, hours, minutes, seconds, ampm] = match;
    let hour = parseInt(hours);

    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    }

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour,
      parseInt(minutes),
      parseInt(seconds)
    );
  }

  return new Date();
}

/**
 * Clean up location string
 */
function cleanLocation(location: string): string {
  if (!location) return '';

  // Remove the coordinate suffix like "MEMPHIS:EST LL(-89.9813,35.1185)"
  return location
    .replace(/MEMPHIS:EST\s*LL\([^)]+\)/i, '')
    .replace(/MEMPHIS:\s*\w+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get disposition code description
 */
export function getDispositionDescription(code: string): string {
  const dispositions: Record<string, string> = {
    'CITATION': 'Citation Issued',
    'ADV': 'Advisory/Warning',
    'ARREST': 'Arrest Made',
    'VERBAL': 'Verbal Warning',
    'WRITTEN': 'Written Warning',
    'VOID': 'Voided',
    'OTHER': 'Other',
  };
  return dispositions[code?.toUpperCase()] || code || 'Unknown';
}

/**
 * Aggregate statistics from traffic stops
 */
export interface TrafficStopStats {
  total: number;
  byCitation: number;
  byWarning: number;
  byPrecinct: Record<string, number>;
  byWard: Record<number, number>;
  byZipCode: Record<string, number>;
  byPlanningDistrict: Record<string, number>;
  byMonth: Record<string, number>;
  byDayOfWeek: Record<number, number>;
  byHour: Record<number, number>;
}

export function calculateStats(stops: MPDTrafficStop[]): TrafficStopStats {
  const stats: TrafficStopStats = {
    total: stops.length,
    byCitation: 0,
    byWarning: 0,
    byPrecinct: {},
    byWard: {},
    byZipCode: {},
    byPlanningDistrict: {},
    byMonth: {},
    byDayOfWeek: {},
    byHour: {},
  };

  for (const stop of stops) {
    // Disposition
    if (stop.dispositionCode === 'CITATION') {
      stats.byCitation++;
    } else if (stop.dispositionCode === 'ADV' || stop.dispositionCode.includes('WARN')) {
      stats.byWarning++;
    }

    // By precinct
    if (stop.mpdPrecinct) {
      stats.byPrecinct[stop.mpdPrecinct] = (stats.byPrecinct[stop.mpdPrecinct] || 0) + 1;
    }

    // By ward
    if (stop.mpdWard) {
      stats.byWard[stop.mpdWard] = (stats.byWard[stop.mpdWard] || 0) + 1;
    }

    // By ZIP
    if (stop.zipCode) {
      stats.byZipCode[stop.zipCode] = (stats.byZipCode[stop.zipCode] || 0) + 1;
    }

    // By planning district
    if (stop.planningDistrict) {
      stats.byPlanningDistrict[stop.planningDistrict] =
        (stats.byPlanningDistrict[stop.planningDistrict] || 0) + 1;
    }

    // By month (YYYY-MM format)
    const monthKey = `${stop.reportedDatetime.getFullYear()}-${String(stop.reportedDatetime.getMonth() + 1).padStart(2, '0')}`;
    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;

    // By day of week (0 = Sunday)
    const dow = stop.reportedDatetime.getDay();
    stats.byDayOfWeek[dow] = (stats.byDayOfWeek[dow] || 0) + 1;

    // By hour
    const hour = stop.reportedDatetime.getHours();
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
  }

  return stats;
}

/**
 * Filter stops by date range
 */
export function filterByDateRange(
  stops: MPDTrafficStop[],
  startDate?: Date,
  endDate?: Date
): MPDTrafficStop[] {
  return stops.filter((stop) => {
    if (startDate && stop.reportedDatetime < startDate) return false;
    if (endDate && stop.reportedDatetime > endDate) return false;
    return true;
  });
}

/**
 * Filter stops by location criteria
 */
export function filterByLocation(
  stops: MPDTrafficStop[],
  criteria: {
    zipCode?: string;
    precinct?: string;
    ward?: number;
    planningDistrict?: string;
  }
): MPDTrafficStop[] {
  return stops.filter((stop) => {
    if (criteria.zipCode && stop.zipCode !== criteria.zipCode) return false;
    if (criteria.precinct && stop.mpdPrecinct !== criteria.precinct) return false;
    if (criteria.ward && stop.mpdWard !== criteria.ward) return false;
    if (criteria.planningDistrict && stop.planningDistrict !== criteria.planningDistrict) return false;
    return true;
  });
}
