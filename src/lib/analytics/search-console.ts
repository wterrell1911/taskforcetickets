// Google Search Console API integration
import { google } from 'googleapis';

// Simple in-memory cache
const cache: Map<string, { data: unknown; expires: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface SearchConsoleMetrics {
  totalClicks: number;
  totalImpressions: number;
  avgCTR: number;
  avgPosition: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

async function getAuthClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  return auth;
}

export async function getSearchConsoleMetrics(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<SearchConsoleMetrics | null> {
  // Check cache
  const cacheKey = `gsc-${siteUrl}-${startDate}-${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data as SearchConsoleMetrics;
  }

  try {
    const auth = await getAuthClient();
    const searchConsole = google.searchconsole({ version: 'v1', auth });

    // Get overall metrics
    const overallResponse = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
      },
    });

    // Get top queries
    const queriesResponse = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 20,
      },
    });

    // Get top pages
    const pagesResponse = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 10,
      },
    });

    const overallRow = overallResponse.data.rows?.[0];
    const metrics: SearchConsoleMetrics = {
      totalClicks: overallRow?.clicks || 0,
      totalImpressions: overallRow?.impressions || 0,
      avgCTR: overallRow?.ctr || 0,
      avgPosition: overallRow?.position || 0,
      topQueries: (queriesResponse.data.rows || []).map((row) => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })),
      topPages: (pagesResponse.data.rows || []).map((row) => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })),
    };

    // Cache result
    cache.set(cacheKey, { data: metrics, expires: Date.now() + CACHE_TTL });

    return metrics;
  } catch (error) {
    console.error('Error fetching Search Console metrics:', error);
    return null;
  }
}
