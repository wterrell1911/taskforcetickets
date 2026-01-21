/**
 * POST /api/admin/traffic-data/generate-content
 *
 * Generate social media and blog content from traffic metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { generateWeeklyContent } from '@/lib/traffic-data/content-generator';
import { TrafficMetrics, EnforcementHotspot } from '@/lib/traffic-data/types';

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { week_start } = body as { week_start: string };

    if (!week_start) {
      return NextResponse.json({ error: 'week_start is required' }, { status: 400 });
    }

    // Fetch metrics for the specified week
    const { data: metrics, error: metricsError } = await supabase
      .from('traffic_metrics')
      .select('*')
      .eq('week_start', week_start)
      .single();

    if (metricsError || !metrics) {
      return NextResponse.json(
        { error: 'No metrics found for this week' },
        { status: 404 }
      );
    }

    // Fetch hotspots for this week
    const { data: hotspots } = await supabase
      .from('enforcement_hotspots')
      .select('*')
      .eq('week_start', week_start)
      .order('citation_count', { ascending: false });

    // Fetch previous week's metrics for comparison
    const previousWeekStart = getPreviousWeekStart(week_start);
    const { data: previousMetrics } = await supabase
      .from('traffic_metrics')
      .select('*')
      .eq('week_start', previousWeekStart)
      .single();

    // Generate content
    const content = generateWeeklyContent(
      metrics as TrafficMetrics,
      (hotspots || []) as EnforcementHotspot[],
      previousMetrics as TrafficMetrics | null
    );

    // Save generated content to traffic_reports table
    const { data: report, error: reportError } = await supabase
      .from('traffic_reports')
      .upsert(
        {
          week_start,
          week_end: metrics.week_end,
          headline: content.headline,
          summary: content.summary,
          twitter_post: content.twitterPost,
          facebook_post: content.facebookPost,
          instagram_caption: content.instagramCaption,
          blog_content: content.blogContent,
          status: 'draft',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'week_start' }
      )
      .select()
      .single();

    if (reportError) {
      console.error('Failed to save report:', reportError);
    }

    return NextResponse.json({
      success: true,
      content,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    );
  }
}

function getPreviousWeekStart(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}
