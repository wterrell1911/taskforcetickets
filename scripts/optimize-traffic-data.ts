/**
 * Optimize traffic stops data by creating a separate stats file
 * This allows the dashboard to load quickly without loading all 730K records
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface TrafficStopsDatabase {
  stops: unknown[];
  lastUpdated: string;
  totalRecords: number;
  stats: {
    byPrecinct: Record<string, number>;
    byZipCode: Record<string, number>;
    byYear: Record<number, number>;
    byDisposition: Record<string, number>;
    byPlanningDistrict: Record<string, number>;
  };
}

interface OptimizedStats {
  lastUpdated: string;
  totalRecords: number;
  stats: TrafficStopsDatabase['stats'];
  topPrecincts: Array<{ name: string; count: number }>;
  topZipCodes: Array<{ zip: string; count: number }>;
  topDistricts: Array<{ name: string; count: number }>;
  yearlyTrend: Array<{ year: number; count: number }>;
  citationRate: number;
  warningRate: number;
}

async function optimize() {
  const dataDir = path.join(process.cwd(), 'data');
  const inputPath = path.join(dataDir, 'traffic-stops.json');
  const statsPath = path.join(dataDir, 'traffic-stats.json');

  console.log('📖 Reading traffic stops data...');
  const raw = await readFile(inputPath, 'utf-8');
  const db: TrafficStopsDatabase = JSON.parse(raw);

  console.log(`📊 Processing ${db.totalRecords.toLocaleString()} records...`);

  // Calculate rates
  const citations = db.stats.byDisposition['CITATION'] || 0;
  const warnings = db.stats.byDisposition['ADV'] || 0;
  const total = db.totalRecords;

  const optimized: OptimizedStats = {
    lastUpdated: db.lastUpdated,
    totalRecords: db.totalRecords,
    stats: db.stats,
    topPrecincts: Object.entries(db.stats.byPrecinct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count })),
    topZipCodes: Object.entries(db.stats.byZipCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([zip, count]) => ({ zip, count })),
    topDistricts: Object.entries(db.stats.byPlanningDistrict)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count })),
    yearlyTrend: Object.entries(db.stats.byYear)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year),
    citationRate: Math.round((citations / total) * 1000) / 10,
    warningRate: Math.round((warnings / total) * 1000) / 10,
  };

  console.log('💾 Writing optimized stats...');
  await writeFile(statsPath, JSON.stringify(optimized, null, 2));

  console.log(`\n✅ Optimized stats saved to: ${statsPath}`);
  console.log(`📦 Stats file size: ${(JSON.stringify(optimized).length / 1024).toFixed(1)} KB`);

  // Print summary
  console.log('\n📈 QUICK STATS:');
  console.log(`  Total Records: ${optimized.totalRecords.toLocaleString()}`);
  console.log(`  Citation Rate: ${optimized.citationRate}%`);
  console.log(`  Warning Rate: ${optimized.warningRate}%`);
  console.log(`  Precincts: ${Object.keys(db.stats.byPrecinct).length}`);
  console.log(`  ZIP Codes: ${Object.keys(db.stats.byZipCode).length}`);
}

optimize().catch(console.error);
