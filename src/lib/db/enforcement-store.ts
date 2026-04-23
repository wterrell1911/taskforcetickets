/**
 * Enforcement Records Store (Supabase)
 *
 * Stores traffic stop data in Supabase for production use
 */

import { getAdminClient } from './supabase';

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

export async function getEnforcementStats(source: string = 'mpd'): Promise<EnforcementStats> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('enforcement_records')
    .select('date, precinct, zip_code, disposition_code, raw_data, updated_at')
    .eq('source', source);

  if (error) {
    console.error('[enforcement-stats] query failed:', error);
    throw error;
  }

  const rows = data ?? [];
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
