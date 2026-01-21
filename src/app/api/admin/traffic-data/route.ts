/**
 * POST/GET /api/admin/traffic-data
 *
 * Admin API for managing traffic metrics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { getWeekEnd } from '@/lib/traffic-data/calculations';
import { generateWeeklyContent } from '@/lib/traffic-data/content-generator';
import { TrafficMetrics, EnforcementHotspot } from '@/lib/traffic-data/types';

/**
 * GET - Retrieve traffic metrics
 * Query params:
 *   - week_start: specific week to fetch
 *   - limit: number of weeks to fetch (default 12)
 */
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const weekStart = request.nextUrl.searchParams.get('week_start');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '12');

  try {
    if (weekStart) {
      // Fetch specific week's metrics and hotspots
      const [metricsResult, hotspotsResult] = await Promise.all([
        supabase
          .from('traffic_metrics')
          .select('*')
          .eq('week_start', weekStart)
          .single(),
        supabase
          .from('enforcement_hotspots')
          .select('*')
          .eq('week_start', weekStart)
          .order('citation_count', { ascending: false }),
      ]);

      return NextResponse.json({
        metrics: metricsResult.data,
        hotspots: hotspotsResult.data || [],
        error: metricsResult.error?.message,
      });
    }

    // Fetch recent weeks
    const { data: metrics, error } = await supabase
      .from('traffic_metrics')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metrics: metrics || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save traffic metrics and hotspots for a week
 */
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { metrics, hotspots } = body as {
      metrics: Partial<TrafficMetrics>;
      hotspots?: Partial<EnforcementHotspot>[];
    };

    if (!metrics.week_start) {
      return NextResponse.json({ error: 'week_start is required' }, { status: 400 });
    }

    // Calculate week_end
    const week_end = getWeekEnd(metrics.week_start);

    // Upsert traffic metrics
    const { data: savedMetrics, error: metricsError } = await supabase
      .from('traffic_metrics')
      .upsert(
        {
          ...metrics,
          week_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'week_start' }
      )
      .select()
      .single();

    if (metricsError) {
      return NextResponse.json({ error: metricsError.message }, { status: 500 });
    }

    // Handle hotspots if provided
    if (hotspots && hotspots.length > 0) {
      // Delete existing hotspots for this week
      await supabase.from('enforcement_hotspots').delete().eq('week_start', metrics.week_start);

      // Insert new hotspots
      const hotspotsToInsert = hotspots.map((h) => ({
        ...h,
        week_start: metrics.week_start,
      }));

      const { error: hotspotsError } = await supabase
        .from('enforcement_hotspots')
        .insert(hotspotsToInsert);

      if (hotspotsError) {
        console.error('Hotspots insert error:', hotspotsError);
      }
    }

    return NextResponse.json({
      success: true,
      metrics: savedMetrics,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save traffic data' },
      { status: 500 }
    );
  }
}
