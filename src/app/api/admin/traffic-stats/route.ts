import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/admin/traffic-stats
 * Returns optimized traffic stop statistics for dashboard
 */
export async function GET() {
  try {
    const statsPath = path.join(process.cwd(), 'data', 'traffic-stats.json');
    const data = await fs.readFile(statsPath, 'utf-8');
    const stats = JSON.parse(data);

    return NextResponse.json(stats);
  } catch (error) {
    // No stats file yet
    return NextResponse.json({
      totalRecords: 0,
      lastUpdated: null,
      message: 'No traffic data imported yet. Run the import script to load data.',
    });
  }
}
