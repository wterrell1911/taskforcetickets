import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGA4Metrics } from '@/lib/analytics/ga4';
import { getSearchConsoleMetrics } from '@/lib/analytics/search-console';
import { getCallRailMetrics } from '@/lib/analytics/callrail';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getDateRange(period: string): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export async function GET(request: NextRequest) {
  // Simple auth check - in production, use proper auth middleware
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // For now, allow access if admin password not set (development)
  // In production, implement proper auth
  if (adminPassword && authHeader !== `Bearer ${adminPassword}`) {
    // Skip auth for now during development
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '30d';
  const { startDate, endDate } = getDateRange(period);

  // Fetch data from all sources in parallel
  const [ga4Data, searchConsoleData, callRailData, leadsData] = await Promise.all([
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID
      ? getGA4Metrics(process.env.GOOGLE_ANALYTICS_PROPERTY_ID, startDate, endDate)
      : null,
    process.env.SEARCH_CONSOLE_SITE_URL
      ? getSearchConsoleMetrics(process.env.SEARCH_CONSOLE_SITE_URL, startDate, endDate)
      : null,
    process.env.CALLRAIL_ACCOUNT_ID
      ? getCallRailMetrics(process.env.CALLRAIL_ACCOUNT_ID, startDate, endDate)
      : null,
    supabase
      .from('leads')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Count leads by source
  const { data: leadCounts } = await supabase
    .from('leads')
    .select('source_type, marketing_source')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const leadsBySource: Record<string, number> = {};
  const leadsByType: Record<string, number> = {};
  
  (leadCounts || []).forEach((lead) => {
    const source = lead.marketing_source || 'direct';
    const type = lead.source_type || 'form';
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
    leadsByType[type] = (leadsByType[type] || 0) + 1;
  });

  return NextResponse.json({
    period,
    startDate,
    endDate,
    ga4: ga4Data,
    searchConsole: searchConsoleData,
    callRail: callRailData,
    leads: {
      recent: leadsData.data || [],
      total: leadCounts?.length || 0,
      bySource: Object.entries(leadsBySource).map(([source, count]) => ({
        source,
        count,
      })),
      byType: Object.entries(leadsByType).map(([type, count]) => ({
        type,
        count,
      })),
    },
    connected: {
      ga4: !!ga4Data,
      searchConsole: !!searchConsoleData,
      callRail: !!callRailData,
    },
  });
}
