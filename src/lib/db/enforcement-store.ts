/**
 * Enforcement Records Store (Supabase)
 *
 * Stores traffic stop data in Supabase for production use
 */

import { getAdminClient } from './supabase';
import { IntakeAnalytics } from '@/types/admin';

export interface EnforcementRecord {
  id?: string;
  source: string;
  date: string;
  time?: string;
  location?: string;
  lat?: number;
  lng?: number;
  violationType?: string;
  violationCategory?: string;
  agency?: string;
  ward?: string;
  precinct?: string;
  eventNumber?: string;
  dispositionCode?: string;
  zipCode?: string;
  rawData?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

interface SyncLog {
  id: string;
  source: string;
  started_at: string;
  completed_at?: string;
  records_processed: number;
  status: string;
  error?: string;
}

/**
 * Get enforcement records with optional filters
 */
export async function getEnforcementRecords(filters?: {
  source?: string;
  startDate?: string;
  endDate?: string;
  precinct?: string;
  limit?: number;
}): Promise<EnforcementRecord[]> {
  const supabase = getAdminClient();

  let query = supabase
    .from('enforcement_records')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.precinct) {
    query = query.eq('precinct', filters.precinct);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching enforcement records:', error);
    throw error;
  }

  return (data || []).map(mapDbToRecord);
}

/**
 * Add enforcement records in batches
 */
export async function addEnforcementRecords(
  records: Omit<EnforcementRecord, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
  const supabase = getAdminClient();

  // Convert to DB format
  const dbRecords = records.map(mapRecordToDb);

  // Insert in batches of 1000
  const BATCH_SIZE = 1000;
  let totalInserted = 0;

  for (let i = 0; i < dbRecords.length; i += BATCH_SIZE) {
    const batch = dbRecords.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('enforcement_records')
      .insert(batch);

    if (error) {
      console.error('Error inserting batch:', error);
      throw error;
    }

    totalInserted += batch.length;
  }

  return totalInserted;
}

/**
 * Clear enforcement records by source
 */
export async function clearEnforcementRecords(source?: string): Promise<number> {
  const supabase = getAdminClient();

  // Get count first
  let countQuery = supabase.from('enforcement_records').select('id', { count: 'exact' });
  if (source) {
    countQuery = countQuery.eq('source', source);
  }
  const { count } = await countQuery;

  // Delete records
  let deleteQuery = supabase.from('enforcement_records').delete();
  if (source) {
    deleteQuery = deleteQuery.eq('source', source);
  } else {
    // Must have a WHERE clause, so delete where id is not null (all records)
    deleteQuery = deleteQuery.not('id', 'is', null);
  }

  const { error } = await deleteQuery;

  if (error) {
    console.error('Error clearing records:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Create a sync log entry
 */
export async function createSyncLog(source: string): Promise<SyncLog> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('sync_logs')
    .insert({
      source,
      status: 'running',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating sync log:', error);
    throw error;
  }

  return data;
}

/**
 * Update a sync log entry
 */
export async function updateSyncLog(
  id: string,
  updates: {
    completedAt?: string;
    recordsProcessed?: number;
    status?: string;
    error?: string;
  }
): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('sync_logs')
    .update({
      completed_at: updates.completedAt,
      records_processed: updates.recordsProcessed,
      status: updates.status,
      error: updates.error,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating sync log:', error);
    throw error;
  }
}

/**
 * Get latest sync for a source
 */
export async function getLatestSync(source: string): Promise<SyncLog | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('source', source)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest sync:', error);
  }

  return data || null;
}

/**
 * Aggregate stats for the admin dashboard.
 * Pulls all records for the source in one query and aggregates in-memory.
 * For ~15k rows this is a few hundred ms; if the table grows past ~100k,
 * switch to SQL GROUP BY via a Postgres RPC.
 */
export interface EnforcementStats {
  totalRecords: number;
  lastUpdated: string | null;
  dateRange: { start: string | null; end: string | null };
  stats: {
    byPrecinct: Record<string, number>;
    byZipCode: Record<string, number>;
    byYear: Record<number, number>;
    byMonth: Record<string, number>;
    byDisposition: Record<string, number>;
    byPlanningDistrict: Record<string, number>;
  };
}

/**
 * Fetch all rows for a source, paginating past PostgREST's default 1000-row cap.
 * Shape of each row matches `columns` passed in.
 */
export async function fetchAllEnforcementRecords<T>(
  source: string,
  columns: string,
): Promise<T[]> {
  const supabase = getAdminClient();
  const PAGE_SIZE = 1000;
  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('enforcement_records')
      .select(columns)
      .eq('source', source)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const batch = (data ?? []) as T[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function getEnforcementStats(source: string = 'mpd'): Promise<EnforcementStats> {
  const rows = await fetchAllEnforcementRecords<{
    date: string | null;
    precinct: string | null;
    zip_code: string | null;
    disposition_code: string | null;
    raw_data: Record<string, unknown> | null;
    updated_at: string | null;
  }>(source, 'date, precinct, zip_code, disposition_code, raw_data, updated_at');
  const stats: EnforcementStats = {
    totalRecords: rows.length,
    lastUpdated: null,
    dateRange: { start: null, end: null },
    stats: {
      byPrecinct: {},
      byZipCode: {},
      byYear: {},
      byMonth: {},
      byDisposition: {},
      byPlanningDistrict: {},
    },
  };

  let latestUpdated: string | null = null;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const r of rows) {
    const precinct = r.precinct as string | null;
    const zip = r.zip_code as string | null;
    const disposition = r.disposition_code as string | null;
    const date = r.date as string | null;
    const rawData = (r.raw_data ?? {}) as Record<string, unknown>;
    const updatedAt = r.updated_at as string | null;

    if (precinct) stats.stats.byPrecinct[precinct] = (stats.stats.byPrecinct[precinct] || 0) + 1;
    if (zip) stats.stats.byZipCode[zip] = (stats.stats.byZipCode[zip] || 0) + 1;
    if (disposition) stats.stats.byDisposition[disposition] = (stats.stats.byDisposition[disposition] || 0) + 1;

    // raw_data from sync uses "Planning_District"; from CSV import it uses "Planning District"
    const planningDistrict =
      (rawData.Planning_District as string | undefined) ??
      (rawData['Planning District'] as string | undefined) ??
      null;
    if (planningDistrict) {
      stats.stats.byPlanningDistrict[planningDistrict] =
        (stats.stats.byPlanningDistrict[planningDistrict] || 0) + 1;
    }

    if (date) {
      const year = parseInt(date.slice(0, 4), 10);
      const month = date.slice(0, 7);
      if (!isNaN(year)) stats.stats.byYear[year] = (stats.stats.byYear[year] || 0) + 1;
      stats.stats.byMonth[month] = (stats.stats.byMonth[month] || 0) + 1;
      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
    }

    if (updatedAt && (!latestUpdated || updatedAt > latestUpdated)) {
      latestUpdated = updatedAt;
    }
  }

  stats.lastUpdated = latestUpdated;
  stats.dateRange = { start: minDate, end: maxDate };
  return stats;
}

/**
 * Get record count by date range
 */
export async function getRecordCount(startDate?: string, endDate?: string): Promise<number> {
  const supabase = getAdminClient();

  let query = supabase.from('enforcement_records').select('id', { count: 'exact' });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error getting count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Intake analytics (cases we've submitted).
 *
 * No intake/cases table is wired into this store yet, so this returns an empty
 * set. Callers treat intake volume as 0 (conversion rates default to 0) so the
 * enforcement-side numbers still render. Mirrors the shape of the old mock store.
 */
export async function getIntakeAnalytics(_filters?: {
  startDate?: string;
  endDate?: string;
  zone?: string;
}): Promise<IntakeAnalytics[]> {
  void _filters;
  return [];
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

/**
 * Zone analysis: enforcement volume vs. intake volume per zone, with an
 * opportunity score. Zone maps to the real `ward`/`precinct` columns. Reuses
 * fetchAllEnforcementRecords so all rows (not a 1000-row page) are aggregated.
 */
export async function getZoneAnalysis(days: number = 90): Promise<{
  zone: string;
  enforcementVolume: number;
  intakeVolume: number;
  conversionRate: number;
  opportunityScore: number;
}[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  const rows = await fetchAllEnforcementRecords<{
    date: string | null;
    ward: string | null;
    precinct: string | null;
  }>('mpd', 'date, ward, precinct');
  const intake = await getIntakeAnalytics({ startDate: cutoff });

  const enforcementByZone: Record<string, number> = {};
  const intakeByZone: Record<string, number> = {};

  for (const r of rows) {
    if (r.date && r.date < cutoff) continue;
    const zone = r.ward || r.precinct || 'Unknown';
    enforcementByZone[zone] = (enforcementByZone[zone] || 0) + 1;
  }

  intake.forEach(r => {
    const zone = r.zone || 'Unknown';
    intakeByZone[zone] = (intakeByZone[zone] || 0) + 1;
  });

  const allZones = new Set([...Object.keys(enforcementByZone), ...Object.keys(intakeByZone)]);

  return Array.from(allZones).map(zone => {
    const enforcementVolume = enforcementByZone[zone] || 0;
    const intakeVolume = intakeByZone[zone] || 0;
    const conversionRate = enforcementVolume > 0 ? (intakeVolume / enforcementVolume) * 100 : 0;
    // Opportunity score: high enforcement + low conversion = high opportunity
    const opportunityScore = enforcementVolume * (1 - conversionRate / 100);

    return {
      zone,
      enforcementVolume,
      intakeVolume,
      conversionRate: Math.round(conversionRate * 100) / 100,
      opportunityScore: Math.round(opportunityScore),
    };
  }).sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/**
 * Trend data: enforcement vs. intake counts over time, grouped by day or week.
 */
export async function getTrendData(days: number = 90, groupBy: 'day' | 'week' = 'day'): Promise<{
  date: string;
  enforcement: number;
  intake: number;
}[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  const rows = await fetchAllEnforcementRecords<{ date: string | null }>('mpd', 'date');
  const intake = await getIntakeAnalytics({ startDate: cutoff });

  const enforcementByDate: Record<string, number> = {};
  const intakeByDate: Record<string, number> = {};

  for (const r of rows) {
    if (!r.date || r.date < cutoff) continue;
    const date = groupBy === 'week' ? getWeekStart(r.date) : r.date;
    enforcementByDate[date] = (enforcementByDate[date] || 0) + 1;
  }

  intake.forEach(r => {
    const date = groupBy === 'week' ? getWeekStart(r.createdAt.split('T')[0]) : r.createdAt.split('T')[0];
    intakeByDate[date] = (intakeByDate[date] || 0) + 1;
  });

  const allDates = new Set([...Object.keys(enforcementByDate), ...Object.keys(intakeByDate)]);

  return Array.from(allDates)
    .sort()
    .map(date => ({
      date,
      enforcement: enforcementByDate[date] || 0,
      intake: intakeByDate[date] || 0,
    }));
}

/**
 * Offense distribution: enforcement vs. intake share by violation category,
 * with the gap between the two.
 */
export async function getOffenseDistribution(): Promise<{
  category: string;
  enforcementCount: number;
  enforcementPercent: number;
  intakeCount: number;
  intakePercent: number;
  gap: number;
}[]> {
  const rows = await fetchAllEnforcementRecords<{ violation_category: string | null }>(
    'mpd',
    'violation_category',
  );
  const intake = await getIntakeAnalytics();

  const enforcementByCategory: Record<string, number> = {};
  const intakeByCategory: Record<string, number> = {};

  for (const r of rows) {
    const cat = r.violation_category || 'other';
    enforcementByCategory[cat] = (enforcementByCategory[cat] || 0) + 1;
  }

  intake.forEach(r => {
    const cat = r.violationCategory || 'other';
    intakeByCategory[cat] = (intakeByCategory[cat] || 0) + 1;
  });

  const totalEnforcement = Object.values(enforcementByCategory).reduce((a, b) => a + b, 0);
  const totalIntake = Object.values(intakeByCategory).reduce((a, b) => a + b, 0);

  const categories = ['speed', 'equipment', 'registration', 'license', 'insurance', 'other'];

  return categories.map(category => {
    const enforcementCount = enforcementByCategory[category] || 0;
    const intakeCount = intakeByCategory[category] || 0;
    const enforcementPercent = totalEnforcement > 0 ? (enforcementCount / totalEnforcement) * 100 : 0;
    const intakePercent = totalIntake > 0 ? (intakeCount / totalIntake) * 100 : 0;

    return {
      category,
      enforcementCount,
      enforcementPercent: Math.round(enforcementPercent * 10) / 10,
      intakeCount,
      intakePercent: Math.round(intakePercent * 10) / 10,
      gap: Math.round((enforcementPercent - intakePercent) * 10) / 10,
    };
  });
}

/**
 * Friendly labels for the MPD Disposition_Code values. Only high-confidence
 * codes are labelled; unknown codes fall back to the raw code so nothing is
 * mislabelled. (The source dataset has no per-stop violation/charge, so the
 * disposition — the outcome of the stop — is the only real "type" available.)
 */
const DISPOSITION_LABELS: Record<string, string> = {
  CITATION: 'Citation (ticket issued)',
  ADV: 'Advised (warning)',
  CTSY: 'Courtesy (warning)',
  ARREST: 'Arrest',
  TOW: 'Vehicle towed',
  REPORT: 'Report filed',
  CITYORD: 'City ordinance',
  'DRIVE OFF': 'Drove off',
  JUV: 'Juvenile',
  MEMO: 'Memo',
};

export interface OutcomeDistribution {
  code: string;
  label: string;
  count: number;
  percent: number;
}

/**
 * Outcome distribution: groups stops by Disposition_Code (citation vs warning
 * vs arrest, etc.). Replaces the offense-category distribution, which was
 * always 100% "other" because the source data carries no violation type.
 * One row per disposition code, sorted by count descending.
 */
export async function getOutcomeDistribution(): Promise<OutcomeDistribution[]> {
  const rows = await fetchAllEnforcementRecords<{ disposition_code: string | null }>(
    'mpd',
    'disposition_code',
  );

  const byCode: Record<string, number> = {};
  for (const r of rows) {
    const code = (r.disposition_code || 'UNKNOWN').toUpperCase();
    byCode[code] = (byCode[code] || 0) + 1;
  }

  const total = Object.values(byCode).reduce((a, b) => a + b, 0);

  return Object.entries(byCode)
    .map(([code, count]) => ({
      code,
      label: DISPOSITION_LABELS[code] || code,
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// Helper functions to map between DB and app formats
function mapDbToRecord(db: Record<string, unknown>): EnforcementRecord {
  return {
    id: db.id as string,
    source: db.source as string,
    date: db.date as string,
    time: db.time as string | undefined,
    location: db.location as string | undefined,
    lat: db.lat as number | undefined,
    lng: db.lng as number | undefined,
    violationType: db.violation_type as string | undefined,
    violationCategory: db.violation_category as string | undefined,
    agency: db.agency as string | undefined,
    ward: db.ward as string | undefined,
    precinct: db.precinct as string | undefined,
    eventNumber: db.event_number as string | undefined,
    dispositionCode: db.disposition_code as string | undefined,
    zipCode: db.zip_code as string | undefined,
    rawData: db.raw_data as Record<string, unknown> | undefined,
    createdAt: db.created_at as string | undefined,
    updatedAt: db.updated_at as string | undefined,
  };
}

function mapRecordToDb(record: Omit<EnforcementRecord, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
  return {
    source: record.source,
    date: record.date,
    time: record.time,
    location: record.location,
    lat: record.lat,
    lng: record.lng,
    violation_type: record.violationType,
    violation_category: record.violationCategory,
    agency: record.agency,
    ward: record.ward,
    precinct: record.precinct,
    event_number: record.eventNumber,
    disposition_code: record.dispositionCode,
    zip_code: record.zipCode,
    raw_data: record.rawData,
  };
}
