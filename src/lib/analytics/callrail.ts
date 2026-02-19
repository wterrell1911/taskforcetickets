// CallRail API integration

// Simple in-memory cache
const cache: Map<string, { data: unknown; expires: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CallRailMetrics {
  totalCalls: number;
  uniqueCallers: number;
  avgDuration: number;
  callsBySource: Array<{ source: string; count: number }>;
  callsByDay: Array<{ date: string; count: number }>;
  recentCalls: Array<{
    id: string;
    callerName: string | null;
    callerNumber: string;
    duration: number;
    source: string;
    startedAt: string;
  }>;
}

interface CallRailCall {
  id: string;
  caller_name: string | null;
  customer_phone_number: string;
  duration: number;
  source_name: string;
  start_time: string;
  tracking_phone_number: string;
}

interface CallRailResponse {
  calls: CallRailCall[];
  total_records: number;
}

export async function getCallRailMetrics(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<CallRailMetrics | null> {
  const apiKey = process.env.CALLRAIL_API_KEY;
  
  if (!apiKey) {
    console.warn('CallRail API key not configured');
    return null;
  }

  // Check cache
  const cacheKey = `callrail-${accountId}-${startDate}-${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data as CallRailMetrics;
  }

  try {
    // Fetch calls from CallRail API
    const response = await fetch(
      `https://api.callrail.com/v3/a/${accountId}/calls.json?` +
        new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          per_page: '250',
          sort: 'start_time',
          order: 'desc',
        }),
      {
        headers: {
          Authorization: `Token token=${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CallRail API error: ${response.status}`);
    }

    const data: CallRailResponse = await response.json();
    const calls = data.calls || [];

    // Calculate metrics
    const uniqueCallers = new Set(calls.map((c) => c.customer_phone_number)).size;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
    const avgDuration = calls.length > 0 ? totalDuration / calls.length : 0;

    // Group by source
    const sourceCount: Record<string, number> = {};
    calls.forEach((call) => {
      const source = call.source_name || 'Unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    // Group by day
    const dayCount: Record<string, number> = {};
    calls.forEach((call) => {
      const day = call.start_time.split('T')[0];
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const metrics: CallRailMetrics = {
      totalCalls: calls.length,
      uniqueCallers,
      avgDuration: Math.round(avgDuration),
      callsBySource: Object.entries(sourceCount)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      callsByDay: Object.entries(dayCount)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentCalls: calls.slice(0, 10).map((call) => ({
        id: call.id,
        callerName: call.caller_name,
        callerNumber: call.customer_phone_number,
        duration: call.duration,
        source: call.source_name,
        startedAt: call.start_time,
      })),
    };

    // Cache result
    cache.set(cacheKey, { data: metrics, expires: Date.now() + CACHE_TTL });

    return metrics;
  } catch (error) {
    console.error('Error fetching CallRail metrics:', error);
    return null;
  }
}
