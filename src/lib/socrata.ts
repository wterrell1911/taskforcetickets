// Memphis Data Hub API client
// Memphis migrated from Socrata to ArcGIS in 2024
// https://data.memphistn.gov

import { EnforcementRecord } from '@/types/admin';

// ArcGIS Feature Server base URL for Memphis Data Hub
const ARCGIS_BASE_URL = 'https://services2.arcgis.com/saWmpKJIUAjyyNVc/arcgis/rest/services';

// Feature Server endpoints
const ENDPOINTS = {
  // MPD Traffic Stops - current data (last updated Dec 2025)
  MPD_TRAFFIC_STOPS: `${ARCGIS_BASE_URL}/MPD_Traffic_Stops/FeatureServer/0`,
  // MPD Public Safety Incidents - crime data
  MPD_INCIDENTS: `${ARCGIS_BASE_URL}/MPD_Public_Safety_Incidents/FeatureServer/0`,
};

interface ArcGISQueryParams {
  where?: string;
  outFields?: string;
  orderByFields?: string;
  resultOffset?: number;
  resultRecordCount?: number;
  f?: string;
}

interface ArcGISTrafficStop {
  // Fields from MPD_Traffic_Stops ArcGIS Feature Server
  OBJECTID?: number;
  Event_Number?: string;
  Event_Type?: string;
  Reported_Datetime?: number; // Unix timestamp in milliseconds
  Disposition_Code?: string;
  Location?: string;
  Latitude?: number;
  Longitude?: number;
  ZIP_Code?: string;
  Council_District?: number;
  Super_District?: number;
  Tract?: string;
  Tract_Name?: string;
  Planning_District?: string;
  MPD_Precinct?: string;
  MPD_Ward?: number;
  // May have additional fields
  [key: string]: unknown;
}

interface ArcGISResponse {
  features: Array<{ attributes: ArcGISTrafficStop }>;
  exceededTransferLimit?: boolean;
}

export class MemphisDataClient {
  private endpoint: string;

  constructor(endpoint: string = ENDPOINTS.MPD_TRAFFIC_STOPS) {
    this.endpoint = endpoint;
  }

  private async query(params: ArcGISQueryParams = {}): Promise<ArcGISResponse> {
    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('f', 'json');
    queryParams.set('outFields', params.outFields || '*');
    queryParams.set('where', params.where || '1=1');

    if (params.orderByFields) {
      queryParams.set('orderByFields', params.orderByFields);
    }
    if (params.resultOffset !== undefined) {
      queryParams.set('resultOffset', String(params.resultOffset));
    }
    if (params.resultRecordCount !== undefined) {
      queryParams.set('resultRecordCount', String(params.resultRecordCount));
    }

    const url = `${this.endpoint}/query?${queryParams.toString()}`;
    console.log('[ArcGIS] Fetching:', url);

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    console.log('[ArcGIS] Response status:', response.status);

    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`ArcGIS API returned non-JSON response (${contentType}). The service may be unavailable.`);
    }

    const data = await response.json();

    // ArcGIS returns error in the body, not via HTTP status
    if (data.error) {
      console.error('[ArcGIS] API Error:', JSON.stringify(data.error));
      throw new Error(`ArcGIS API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    console.log('[ArcGIS] Got', data.features?.length, 'features');
    return data;
  }

  // Fetch traffic stops with pagination
  async fetchTrafficStops(options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ArcGISTrafficStop[]> {
    const whereClauses: string[] = [];

    // Date filtering using ArcGIS DATE syntax: DATE 'YYYY-MM-DD'
    if (options.startDate) {
      whereClauses.push(`Reported_Datetime >= DATE '${options.startDate}'`);
    }
    if (options.endDate) {
      whereClauses.push(`Reported_Datetime <= DATE '${options.endDate}'`);
    }

    // Default to '1=1' if no filters, otherwise join with AND
    const whereClause = whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';

    const result = await this.query({
      where: whereClause,
      orderByFields: 'Reported_Datetime DESC',
      resultRecordCount: options.limit || 1000,
      resultOffset: options.offset || 0,
    });

    return result.features.map(f => f.attributes);
  }

  // Fetch all traffic stops with automatic pagination
  async fetchAllTrafficStops(options: {
    startDate?: string;
    endDate?: string;
    onProgress?: (fetched: number) => void;
  } = {}): Promise<ArcGISTrafficStop[]> {
    const allRecords: ArcGISTrafficStop[] = [];
    const limit = 1000; // ArcGIS default max is 2000 for this endpoint
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.fetchTrafficStops({
        limit,
        offset,
        startDate: options.startDate,
        endDate: options.endDate,
      });

      allRecords.push(...batch);
      options.onProgress?.(allRecords.length);

      if (batch.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Rate limiting - be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allRecords;
  }

  // Transform ArcGIS data to our enforcement record format
  transformToEnforcementRecord(stop: ArcGISTrafficStop): Omit<EnforcementRecord, 'id' | 'createdAt' | 'updatedAt'> {
    // Convert Unix timestamp (ms) to ISO date string
    const reportedDate = stop.Reported_Datetime
      ? new Date(stop.Reported_Datetime)
      : new Date();

    const dateStr = reportedDate.toISOString().split('T')[0];
    const timeStr = reportedDate.toTimeString().slice(0, 5); // HH:MM

    // Get violation type from Event_Type
    const violation = stop.Event_Type || 'Traffic Stop';

    return {
      source: 'mpd',
      date: dateStr,
      time: timeStr,
      location: stop.Location || '',
      lat: stop.Latitude,
      lng: stop.Longitude,
      violationType: violation,
      violationCategory: this.categorizeViolation(violation),
      agency: 'MPD',
      ward: stop.MPD_Ward?.toString(),
      precinct: stop.MPD_Precinct,
      demographics: {
        // Demographics not available in current dataset
        age: undefined,
        gender: undefined,
        race: undefined,
      },
      rawData: stop,
    };
  }

  // Categorize violation into our standard categories
  private categorizeViolation(violation: string): EnforcementRecord['violationCategory'] {
    const v = violation.toLowerCase();

    if (v.includes('speed') || v.includes('mph')) {
      return 'speed';
    }
    if (v.includes('light') || v.includes('equipment') || v.includes('brake') || v.includes('mirror')) {
      return 'equipment';
    }
    if (v.includes('registration') || v.includes('tag') || v.includes('plate')) {
      return 'registration';
    }
    if (v.includes('license') || v.includes('dl') || v.includes("driver's")) {
      return 'license';
    }
    if (v.includes('insurance') || v.includes('sr-22') || v.includes('financial')) {
      return 'insurance';
    }
    return 'other';
  }

  // Get service metadata
  async getServiceMetadata(): Promise<unknown> {
    const response = await fetch(`${this.endpoint}?f=json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    return response.json();
  }

  // Get record count
  async getRecordCount(where: string = '1=1'): Promise<number> {
    const url = new URL(`${this.endpoint}/query`);
    url.searchParams.set('f', 'json');
    url.searchParams.set('where', where);
    url.searchParams.set('returnCountOnly', 'true');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to get count: ${response.status}`);
    }
    const data = await response.json();
    return data.count || 0;
  }
}

// Singleton instance for traffic stops
export const mpdTrafficClient = new MemphisDataClient(ENDPOINTS.MPD_TRAFFIC_STOPS);

// Singleton instance for incidents (if needed)
export const mpdIncidentsClient = new MemphisDataClient(ENDPOINTS.MPD_INCIDENTS);

// Legacy export for backward compatibility
export const socrataClient = mpdTrafficClient;

// Sync function to pull latest data
export async function syncMPDData(options: {
  startDate?: string;
  endDate?: string;
  onProgress?: (message: string, count: number) => void;
}): Promise<{ success: boolean; recordsProcessed: number; error?: string }> {
  const { addEnforcementRecords, clearEnforcementRecords, createSyncLog, updateSyncLog } = await import('./db/store');

  const syncLog = await createSyncLog('mpd');

  try {
    options.onProgress?.('Starting MPD data sync...', 0);

    // Clear existing MPD records if doing a full sync
    if (!options.startDate) {
      await clearEnforcementRecords('mpd');
    }

    // Fetch data from ArcGIS (Memphis Data Hub)
    const client = new MemphisDataClient();
    const stops = await client.fetchAllTrafficStops({
      startDate: options.startDate,
      endDate: options.endDate,
      onProgress: (count) => options.onProgress?.('Fetching records...', count),
    });

    options.onProgress?.('Transforming records...', stops.length);

    // Transform and store
    const records = stops.map(stop => client.transformToEnforcementRecord(stop));
    const count = await addEnforcementRecords(records);

    await updateSyncLog(syncLog.id, {
      completedAt: new Date().toISOString(),
      recordsProcessed: count,
      status: 'completed',
    });

    options.onProgress?.('Sync completed', count);
    return { success: true, recordsProcessed: count };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncLog(syncLog.id, {
      completedAt: new Date().toISOString(),
      status: 'failed',
      error: errorMessage,
    });
    return { success: false, recordsProcessed: 0, error: errorMessage };
  }
}
