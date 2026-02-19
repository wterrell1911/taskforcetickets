// Google Analytics 4 Data API integration
import { google } from 'googleapis';

// Simple in-memory cache
const cache: Map<string, { data: unknown; expires: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface GA4Metrics {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  trafficSources: Array<{ source: string; sessions: number }>;
}

async function getAuthClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return auth;
}

export async function getGA4Metrics(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<GA4Metrics | null> {
  // Check cache
  const cacheKey = `ga4-${propertyId}-${startDate}-${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data as GA4Metrics;
  }

  try {
    const auth = await getAuthClient();
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    // Get main metrics
    const metricsResponse = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    // Get top pages
    const pagesResponse = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: "10",
      },
    });

    // Get traffic sources
    const sourcesResponse = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: "10",
      },
    });

    const mainRow = metricsResponse.data.rows?.[0];
    const metrics: GA4Metrics = {
      sessions: parseInt(mainRow?.metricValues?.[0]?.value || '0'),
      users: parseInt(mainRow?.metricValues?.[1]?.value || '0'),
      pageviews: parseInt(mainRow?.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(mainRow?.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseFloat(mainRow?.metricValues?.[4]?.value || '0'),
      topPages: (pagesResponse.data.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
      })),
      trafficSources: (sourcesResponse.data.rows || []).map((row) => ({
        source: row.dimensionValues?.[0]?.value || '',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      })),
    };

    // Cache result
    cache.set(cacheKey, { data: metrics, expires: Date.now() + CACHE_TTL });

    return metrics;
  } catch (error) {
    console.error('Error fetching GA4 metrics:', error);
    return null;
  }
}
