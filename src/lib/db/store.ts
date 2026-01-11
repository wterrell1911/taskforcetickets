// Simple file-based store for development
// Replace with real database in production

import { promises as fs } from 'fs';
import path from 'path';
import { Database, SyncLogEntry, ImportLogEntry, TrafficStopsDatabase } from './schema';
import { EnforcementRecord, ManualEntryBatch, IntakeAnalytics } from '@/types/admin';
import { MPDTrafficStop, calculateStats } from '@/lib/csv-import';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'analytics.json');
const TRAFFIC_STOPS_FILE = path.join(DATA_DIR, 'traffic-stops.json');

// Initialize empty database
const EMPTY_DB: Database = {
  enforcement_records: [],
  manual_entry_batches: [],
  intake_analytics: [],
  sync_log: [],
  import_log: [],
};

const EMPTY_TRAFFIC_DB: TrafficStopsDatabase = {
  stops: [],
  lastUpdated: '',
  totalRecords: 0,
  stats: {
    byPrecinct: {},
    byZipCode: {},
    byYear: {},
  },
};

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

// Read database
async function readDb(): Promise<Database> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist, return empty db
    return EMPTY_DB;
  }
}

// Write database
async function writeDb(db: Database): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Enforcement Records
export async function getEnforcementRecords(filters?: {
  source?: string;
  startDate?: string;
  endDate?: string;
  zone?: string;
}): Promise<EnforcementRecord[]> {
  const db = await readDb();
  let records = db.enforcement_records;

  const { source, startDate, endDate, zone } = filters || {};
  if (source) {
    records = records.filter(r => r.source === source);
  }
  if (startDate) {
    records = records.filter(r => r.date >= startDate);
  }
  if (endDate) {
    records = records.filter(r => r.date <= endDate);
  }
  if (zone) {
    records = records.filter(r => r.ward === zone || r.precinct === zone);
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addEnforcementRecords(records: Omit<EnforcementRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
  const db = await readDb();
  const now = new Date().toISOString();

  const newRecords: EnforcementRecord[] = records.map(r => ({
    ...r,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  db.enforcement_records.push(...newRecords);
  await writeDb(db);
  return newRecords.length;
}

export async function clearEnforcementRecords(source?: string): Promise<number> {
  const db = await readDb();
  const originalCount = db.enforcement_records.length;

  if (source) {
    db.enforcement_records = db.enforcement_records.filter(r => r.source !== source);
  } else {
    db.enforcement_records = [];
  }

  await writeDb(db);
  return originalCount - db.enforcement_records.length;
}

// Manual Entry Batches
export async function getManualEntryBatches(source?: string): Promise<ManualEntryBatch[]> {
  const db = await readDb();
  let batches = db.manual_entry_batches;

  if (source) {
    batches = batches.filter(b => b.source === source);
  }

  return batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addManualEntryBatch(batch: Omit<ManualEntryBatch, 'id' | 'createdAt'>): Promise<ManualEntryBatch> {
  const db = await readDb();

  const newBatch: ManualEntryBatch = {
    ...batch,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  db.manual_entry_batches.push(newBatch);
  await writeDb(db);
  return newBatch;
}

// Intake Analytics
export async function getIntakeAnalytics(filters?: {
  startDate?: string;
  endDate?: string;
  zone?: string;
}): Promise<IntakeAnalytics[]> {
  const db = await readDb();
  let records = db.intake_analytics;

  const { startDate, endDate, zone } = filters || {};
  if (startDate) {
    records = records.filter(r => r.createdAt >= startDate);
  }
  if (endDate) {
    records = records.filter(r => r.createdAt <= endDate);
  }
  if (zone) {
    records = records.filter(r => r.zone === zone);
  }

  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addIntakeAnalytics(record: Omit<IntakeAnalytics, 'id' | 'createdAt'>): Promise<IntakeAnalytics> {
  const db = await readDb();

  const newRecord: IntakeAnalytics = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  db.intake_analytics.push(newRecord);
  await writeDb(db);
  return newRecord;
}

// Sync Log
export async function createSyncLog(source: string): Promise<SyncLogEntry> {
  const db = await readDb();

  const entry: SyncLogEntry = {
    id: generateId(),
    source,
    startedAt: new Date().toISOString(),
    recordsProcessed: 0,
    status: 'running',
  };

  db.sync_log.push(entry);
  await writeDb(db);
  return entry;
}

export async function updateSyncLog(id: string, updates: Partial<SyncLogEntry>): Promise<void> {
  const db = await readDb();
  const index = db.sync_log.findIndex(e => e.id === id);

  if (index >= 0) {
    db.sync_log[index] = { ...db.sync_log[index], ...updates };
    await writeDb(db);
  }
}

export async function getLatestSync(source: string): Promise<SyncLogEntry | undefined> {
  const db = await readDb();
  return db.sync_log
    .filter(e => e.source === source)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

// Analytics Aggregations
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

  const enforcement = await getEnforcementRecords({ startDate: cutoff });
  const intake = await getIntakeAnalytics({ startDate: cutoff });

  // Group by zone
  const enforcementByZone: Record<string, number> = {};
  const intakeByZone: Record<string, number> = {};

  enforcement.forEach(r => {
    const zone = r.ward || r.precinct || 'Unknown';
    enforcementByZone[zone] = (enforcementByZone[zone] || 0) + 1;
  });

  intake.forEach(r => {
    const zone = r.zone || 'Unknown';
    intakeByZone[zone] = (intakeByZone[zone] || 0) + 1;
  });

  // Combine zones
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

export async function getTrendData(days: number = 90, groupBy: 'day' | 'week' = 'day'): Promise<{
  date: string;
  enforcement: number;
  intake: number;
}[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  const enforcement = await getEnforcementRecords({ startDate: cutoff });
  const intake = await getIntakeAnalytics({ startDate: cutoff });

  const enforcementByDate: Record<string, number> = {};
  const intakeByDate: Record<string, number> = {};

  enforcement.forEach(r => {
    const date = groupBy === 'week' ? getWeekStart(r.date) : r.date;
    enforcementByDate[date] = (enforcementByDate[date] || 0) + 1;
  });

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

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

export async function getOffenseDistribution(): Promise<{
  category: string;
  enforcementCount: number;
  enforcementPercent: number;
  intakeCount: number;
  intakePercent: number;
  gap: number;
}[]> {
  const enforcement = await getEnforcementRecords();
  const intake = await getIntakeAnalytics();

  const enforcementByCategory: Record<string, number> = {};
  const intakeByCategory: Record<string, number> = {};

  enforcement.forEach(r => {
    const cat = r.violationCategory || 'other';
    enforcementByCategory[cat] = (enforcementByCategory[cat] || 0) + 1;
  });

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

// ============================================
// Traffic Stops (MPD CSV Import)
// ============================================

// Read traffic stops database
async function readTrafficStopsDb(): Promise<TrafficStopsDatabase> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(TRAFFIC_STOPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return EMPTY_TRAFFIC_DB;
  }
}

// Write traffic stops database
async function writeTrafficStopsDb(db: TrafficStopsDatabase): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TRAFFIC_STOPS_FILE, JSON.stringify(db));
}

// Store traffic stops from CSV import
export async function storeTrafficStops(stops: MPDTrafficStop[]): Promise<number> {
  const stats = calculateStats(stops);

  // Aggregate by year
  const byYear: Record<number, number> = {};
  for (const stop of stops) {
    const year = stop.reportedDatetime.getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  }

  const db: TrafficStopsDatabase = {
    stops,
    lastUpdated: new Date().toISOString(),
    totalRecords: stops.length,
    stats: {
      byPrecinct: stats.byPrecinct,
      byZipCode: stats.byZipCode,
      byYear,
    },
  };

  await writeTrafficStopsDb(db);
  return stops.length;
}

// Get traffic stop statistics
export async function getTrafficStopStats(): Promise<{
  totalRecords: number;
  lastUpdated: string;
  byPrecinct: Record<string, number>;
  byZipCode: Record<string, number>;
  byYear: Record<number, number>;
} | null> {
  const db = await readTrafficStopsDb();
  if (!db.lastUpdated) return null;

  return {
    totalRecords: db.totalRecords,
    lastUpdated: db.lastUpdated,
    byPrecinct: db.stats.byPrecinct,
    byZipCode: db.stats.byZipCode,
    byYear: db.stats.byYear,
  };
}

// Query traffic stops with filters
export async function queryTrafficStops(filters?: {
  zipCode?: string;
  precinct?: string;
  ward?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ stops: MPDTrafficStop[]; total: number }> {
  const db = await readTrafficStopsDb();
  let stops = db.stops;

  if (filters) {
    if (filters.zipCode) {
      stops = stops.filter(s => s.zipCode === filters.zipCode);
    }
    if (filters.precinct) {
      stops = stops.filter(s => s.mpdPrecinct === filters.precinct);
    }
    if (filters.ward) {
      stops = stops.filter(s => s.mpdWard === filters.ward);
    }
    if (filters.startDate) {
      stops = stops.filter(s => new Date(s.reportedDatetime) >= filters.startDate!);
    }
    if (filters.endDate) {
      stops = stops.filter(s => new Date(s.reportedDatetime) <= filters.endDate!);
    }
  }

  const total = stops.length;

  // Apply pagination
  if (filters?.offset) {
    stops = stops.slice(filters.offset);
  }
  if (filters?.limit) {
    stops = stops.slice(0, filters.limit);
  }

  return { stops, total };
}

// Get unique precincts
export async function getPrecincts(): Promise<string[]> {
  const db = await readTrafficStopsDb();
  return Object.keys(db.stats.byPrecinct).sort();
}

// Get unique ZIP codes
export async function getZipCodes(): Promise<string[]> {
  const db = await readTrafficStopsDb();
  return Object.keys(db.stats.byZipCode).sort();
}

// ============================================
// Import Log
// ============================================

export async function createImportLog(params: {
  filename: string;
  recordCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
}): Promise<ImportLogEntry> {
  const db = await readDb();

  const entry: ImportLogEntry = {
    id: generateId(),
    ...params,
    importedAt: new Date().toISOString(),
    status: 'completed',
  };

  db.import_log = db.import_log || [];
  db.import_log.push(entry);
  await writeDb(db);

  return entry;
}

export async function getImportHistory(): Promise<ImportLogEntry[]> {
  const db = await readDb();
  return (db.import_log || []).sort((a, b) =>
    b.importedAt.localeCompare(a.importedAt)
  );
}
