/**
 * Script to import MPD Traffic Stops CSV directly from file
 * Run with: npx ts-node scripts/import-traffic-stops.ts <path-to-csv>
 */

import { createReadStream } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { parse } from 'csv-parse';
import path from 'path';

interface MPDTrafficStop {
  objectId: number;
  eventNumber: string;
  eventType: string;
  reportedDatetime: string; // Store as ISO string for JSON
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

interface TrafficStopsDatabase {
  stops: MPDTrafficStop[];
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

function parseDateTime(dateStr: string): Date {
  if (!dateStr) return new Date();
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch {
    // Fall through
  }
  return new Date();
}

function cleanLocation(location: string): string {
  if (!location) return '';
  return location
    .replace(/MEMPHIS:EST\s*LL\([^)]+\)/i, '')
    .replace(/MEMPHIS:\s*\w+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function importCSV(csvPath: string) {
  console.log(`\n📂 Reading CSV from: ${csvPath}\n`);

  const stops: MPDTrafficStop[] = [];
  const stats = {
    byPrecinct: {} as Record<string, number>,
    byZipCode: {} as Record<string, number>,
    byYear: {} as Record<number, number>,
    byDisposition: {} as Record<string, number>,
    byPlanningDistrict: {} as Record<string, number>,
  };

  let processed = 0;
  let skipped = 0;

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: true,
      on_record: (record) => record, // Process each record
    })
  );

  for await (const row of parser) {
    processed++;

    if (processed % 100000 === 0) {
      console.log(`  Processed ${processed.toLocaleString()} records...`);
    }

    try {
      const datetime = parseDateTime(row['Reported_Datetime']);
      const year = datetime.getFullYear();

      const stop: MPDTrafficStop = {
        objectId: parseInt(row['OBJECTID']) || 0,
        eventNumber: row['Event Number'] || '',
        eventType: row['Event Type'] || 'Traffic Stop',
        reportedDatetime: datetime.toISOString(),
        dispositionCode: row['Disposition Code'] || '',
        location: cleanLocation(row['Location']),
        latitude: parseFloat(row['Latitude']) || 0,
        longitude: parseFloat(row['Longitude']) || 0,
        zipCode: row['ZIP Code'] || '',
        councilDistrict: parseInt(row['Council District']) || null,
        superDistrict: parseInt(row['Super District']) || null,
        tract: row['Tract'] || '',
        tractName: row['Tract Name'] || '',
        planningDistrict: row['Planning District'] || '',
        mpdPrecinct: row['MPD Precinct'] || '',
        mpdWard: parseInt(row['MPD Ward']) || null,
      };

      stops.push(stop);

      // Aggregate stats
      if (stop.mpdPrecinct) {
        stats.byPrecinct[stop.mpdPrecinct] = (stats.byPrecinct[stop.mpdPrecinct] || 0) + 1;
      }
      if (stop.zipCode) {
        stats.byZipCode[stop.zipCode] = (stats.byZipCode[stop.zipCode] || 0) + 1;
      }
      if (year > 2000 && year < 2100) {
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
      if (stop.dispositionCode) {
        stats.byDisposition[stop.dispositionCode] = (stats.byDisposition[stop.dispositionCode] || 0) + 1;
      }
      if (stop.planningDistrict) {
        stats.byPlanningDistrict[stop.planningDistrict] = (stats.byPlanningDistrict[stop.planningDistrict] || 0) + 1;
      }
    } catch (err) {
      skipped++;
    }
  }

  console.log(`\n✅ Processed ${processed.toLocaleString()} records`);
  console.log(`⏭️  Skipped ${skipped.toLocaleString()} invalid records`);
  console.log(`📊 Valid records: ${stops.length.toLocaleString()}\n`);

  // Create database object
  const db: TrafficStopsDatabase = {
    stops,
    lastUpdated: new Date().toISOString(),
    totalRecords: stops.length,
    stats,
  };

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  await mkdir(dataDir, { recursive: true });

  // Write to file
  const outputPath = path.join(dataDir, 'traffic-stops.json');
  console.log(`💾 Writing to ${outputPath}...`);
  await writeFile(outputPath, JSON.stringify(db));

  // Print summary
  console.log('\n📈 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total Records: ${stops.length.toLocaleString()}`);

  console.log('\n📅 By Year:');
  Object.entries(stats.byYear)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([year, count]) => {
      console.log(`  ${year}: ${count.toLocaleString()}`);
    });

  console.log('\n🚔 Top 10 Precincts:');
  Object.entries(stats.byPrecinct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([precinct, count]) => {
      console.log(`  ${precinct}: ${count.toLocaleString()}`);
    });

  console.log('\n📮 Top 10 ZIP Codes:');
  Object.entries(stats.byZipCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([zip, count]) => {
      console.log(`  ${zip}: ${count.toLocaleString()}`);
    });

  console.log('\n📋 Dispositions:');
  Object.entries(stats.byDisposition)
    .sort((a, b) => b[1] - a[1])
    .forEach(([disposition, count]) => {
      const pct = ((count / stops.length) * 100).toFixed(1);
      console.log(`  ${disposition}: ${count.toLocaleString()} (${pct}%)`);
    });

  console.log('\n🏘️ Top 10 Planning Districts:');
  Object.entries(stats.byPlanningDistrict)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([district, count]) => {
      console.log(`  ${district}: ${count.toLocaleString()}`);
    });

  console.log('\n✅ Import complete!');
  console.log(`📁 Data saved to: ${outputPath}`);
  console.log(`📦 File size: ${(JSON.stringify(db).length / 1024 / 1024).toFixed(1)} MB\n`);
}

// Run the import
const csvPath = process.argv[2] || '/Volumes/Seagate Por/MPD_Traffic_Stops_421407502442538066.csv';
importCSV(csvPath).catch(console.error);
