import { NextRequest, NextResponse } from 'next/server';
import { getEnforcementStats } from '@/lib/db/enforcement-store';

export const maxDuration = 60;

// Memphis ZIP code approximate coordinates
const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '38002': { lat: 35.1645, lng: -89.7897 }, // Arlington
  '38016': { lat: 35.2017, lng: -89.7339 }, // Cordova
  '38017': { lat: 35.1631, lng: -89.7072 }, // Collierville
  '38018': { lat: 35.1864, lng: -89.8056 }, // Cordova
  '38053': { lat: 35.3000, lng: -89.9000 }, // Millington
  '38103': { lat: 35.1450, lng: -90.0530 }, // Downtown Memphis
  '38104': { lat: 35.1410, lng: -90.0190 }, // Midtown
  '38105': { lat: 35.1660, lng: -90.0270 }, // North Memphis
  '38106': { lat: 35.1020, lng: -90.0510 }, // South Memphis
  '38107': { lat: 35.1790, lng: -90.0200 }, // North Memphis
  '38108': { lat: 35.1860, lng: -90.0020 }, // Binghampton
  '38109': { lat: 35.0620, lng: -90.0490 }, // South Memphis
  '38111': { lat: 35.1270, lng: -89.9570 }, // East Memphis
  '38112': { lat: 35.1580, lng: -89.9860 }, // Vollintine Evergreen
  '38114': { lat: 35.0910, lng: -89.9920 }, // Orange Mound
  '38115': { lat: 35.0880, lng: -89.8820 }, // Hickory Hill
  '38116': { lat: 35.0400, lng: -90.0070 }, // Whitehaven
  '38117': { lat: 35.1180, lng: -89.9120 }, // East Memphis
  '38118': { lat: 35.0580, lng: -89.9320 }, // Parkway Village
  '38119': { lat: 35.0960, lng: -89.8550 }, // Colonial Acres
  '38120': { lat: 35.1180, lng: -89.8500 }, // Germantown
  '38122': { lat: 35.1650, lng: -89.9320 }, // Highland Heights
  '38125': { lat: 35.0280, lng: -89.8420 }, // Southwind
  '38126': { lat: 35.1280, lng: -90.0520 }, // Uptown
  '38127': { lat: 35.2290, lng: -90.0160 }, // Frayser
  '38128': { lat: 35.2270, lng: -89.9330 }, // Raleigh
  '38131': { lat: 35.0800, lng: -89.9750 }, // Memphis International Airport area
  '38132': { lat: 35.0560, lng: -89.9900 }, // South Memphis
  '38133': { lat: 35.2520, lng: -89.8340 }, // Bartlett
  '38134': { lat: 35.2140, lng: -89.8780 }, // Bartlett
  '38135': { lat: 35.2740, lng: -89.8990 }, // Bartlett
  '38137': { lat: 35.1000, lng: -89.9300 }, // Memphis
  '38138': { lat: 35.0870, lng: -89.8040 }, // Germantown
  '38139': { lat: 35.1020, lng: -89.7850 }, // Germantown
  '38141': { lat: 35.0350, lng: -89.8810 }, // Memphis
};

// Precinct approximate coordinates (centers)
const PRECINCT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Airways Precinct': { lat: 35.0750, lng: -89.9850 },
  'Appling Farms Precinct': { lat: 35.2100, lng: -89.8500 },
  'Central Precinct': { lat: 35.1350, lng: -90.0200 },
  'Crump Precinct': { lat: 35.1180, lng: -90.0400 },
  'East Precinct': { lat: 35.1100, lng: -89.9000 },
  'Felicia Suzanne Precinct': { lat: 35.0600, lng: -89.8800 },
  'Grahamwood Precinct': { lat: 35.1600, lng: -89.9400 },
  'Mt. Moriah Precinct': { lat: 35.0500, lng: -89.9100 },
  'North Main Precinct': { lat: 35.1800, lng: -90.0300 },
  'Old Allen Precinct': { lat: 35.2200, lng: -89.9400 },
  'Raines Precinct': { lat: 35.0300, lng: -89.9400 },
  'Ridgeway Precinct': { lat: 35.1100, lng: -89.8600 },
  'Tillman Precinct': { lat: 35.1500, lng: -89.9800 },
  'UNKNOWN': { lat: 35.1495, lng: -90.0490 },
};

interface MapDataPoint {
  id: string;
  lat: number;
  lng: number;
  count: number;
  label: string;
  precinct?: string;
  zipCode?: string;
}

/**
 * GET /api/admin/traffic-stops/map
 * Returns aggregated ticket data for map visualization.
 * Reads from Supabase enforcement_records (source='mpd').
 *
 * Query params:
 * - groupBy: 'zip' | 'precinct' (default: 'zip')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'zip';

    const stats = await getEnforcementStats('mpd');
    const mapData: MapDataPoint[] = [];

    if (groupBy === 'precinct') {
      Object.entries(stats.stats.byPrecinct).forEach(([precinct, count]) => {
        const coords = PRECINCT_COORDINATES[precinct] || PRECINCT_COORDINATES['UNKNOWN'];
        mapData.push({
          id: `precinct-${precinct}`,
          lat: coords.lat,
          lng: coords.lng,
          count,
          label: precinct,
          precinct,
        });
      });
    } else {
      Object.entries(stats.stats.byZipCode).forEach(([zip, count]) => {
        const coords = ZIP_COORDINATES[zip];
        if (coords) {
          mapData.push({
            id: `zip-${zip}`,
            lat: coords.lat,
            lng: coords.lng,
            count,
            label: zip,
            zipCode: zip,
          });
        }
      });
    }

    mapData.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      locations: mapData,
      totalPoints: mapData.length,
      totalTickets: mapData.reduce((sum, p) => sum + p.count, 0),
      groupBy,
    });
  } catch (error) {
    console.error('[traffic-stops/map] error:', error);
    return NextResponse.json({
      locations: [],
      totalPoints: 0,
      totalTickets: 0,
      error: error instanceof Error ? error.message : 'Failed to load map data',
    });
  }
}
