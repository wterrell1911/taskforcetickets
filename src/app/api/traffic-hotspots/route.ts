import { NextResponse } from 'next/server';

const ARCGIS_BASE = 'https://services2.arcgis.com/saWmpKJIUAjyyNVc/arcgis/rest/services/MPD_Traffic_Stops/FeatureServer/0';

const ZIP_INFO: Record<string, { lat: number; lng: number; name: string }> = {
  '38103': { lat: 35.1450, lng: -90.0530, name: 'Downtown Memphis' },
  '38104': { lat: 35.1410, lng: -90.0190, name: 'Midtown' },
  '38105': { lat: 35.1660, lng: -90.0270, name: 'North Memphis' },
  '38106': { lat: 35.1020, lng: -90.0510, name: 'South Memphis' },
  '38107': { lat: 35.1790, lng: -90.0200, name: 'North Memphis / Klondike' },
  '38108': { lat: 35.1860, lng: -90.0020, name: 'Binghampton' },
  '38109': { lat: 35.0620, lng: -90.0490, name: 'Westwood / South Memphis' },
  '38111': { lat: 35.1270, lng: -89.9570, name: 'East Memphis' },
  '38112': { lat: 35.1580, lng: -89.9860, name: 'Vollintine Evergreen' },
  '38114': { lat: 35.0910, lng: -89.9920, name: 'Orange Mound' },
  '38115': { lat: 35.0880, lng: -89.8820, name: 'Hickory Hill' },
  '38116': { lat: 35.0400, lng: -90.0070, name: 'Whitehaven' },
  '38117': { lat: 35.1180, lng: -89.9120, name: 'East Memphis' },
  '38118': { lat: 35.0580, lng: -89.9320, name: 'Parkway Village' },
  '38119': { lat: 35.0960, lng: -89.8550, name: 'Colonial Acres' },
  '38122': { lat: 35.1650, lng: -89.9320, name: 'Highland Heights' },
  '38125': { lat: 35.0280, lng: -89.8420, name: 'Southwind' },
  '38126': { lat: 35.1280, lng: -90.0520, name: 'Uptown' },
  '38127': { lat: 35.2290, lng: -90.0160, name: 'Frayser' },
  '38128': { lat: 35.2270, lng: -89.9330, name: 'Raleigh' },
  '38016': { lat: 35.2017, lng: -89.7339, name: 'Cordova' },
  '38133': { lat: 35.2520, lng: -89.8340, name: 'Bartlett' },
  '38134': { lat: 35.2140, lng: -89.8780, name: 'Bartlett' },
};

/**
 * GET /api/traffic-hotspots
 * Public API — returns aggregated traffic stop data for map
 */
export async function GET() {
  try {
    // Query ArcGIS for ZIP code stats
    const statsUrl = `${ARCGIS_BASE}/query?f=json&where=ZIP_Code IS NOT NULL&groupByFieldsForStatistics=ZIP_Code&outStatistics=${encodeURIComponent(JSON.stringify([{"statisticType":"count","onStatisticField":"OBJECTID","outStatisticFieldName":"stop_count"}]))}&orderByFields=stop_count DESC&resultRecordCount=30`;

    // Query ArcGIS for precinct stats
    const precinctUrl = `${ARCGIS_BASE}/query?f=json&where=MPD_Precinct IS NOT NULL&groupByFieldsForStatistics=MPD_Precinct&outStatistics=${encodeURIComponent(JSON.stringify([{"statisticType":"count","onStatisticField":"OBJECTID","outStatisticFieldName":"stop_count"}]))}&orderByFields=stop_count DESC`;

    // Query total count
    const countUrl = `${ARCGIS_BASE}/query?f=json&where=1=1&returnCountOnly=true`;

    const [zipRes, precinctRes, countRes] = await Promise.all([
      fetch(statsUrl).then(r => r.json()),
      fetch(precinctUrl).then(r => r.json()),
      fetch(countUrl).then(r => r.json()),
    ]);

    const zipData = (zipRes.features || []).map((f: { attributes: { ZIP_Code: string; stop_count: number } }) => {
      const zip = f.attributes.ZIP_Code;
      const info = ZIP_INFO[zip];
      return {
        zip,
        count: f.attributes.stop_count,
        name: info?.name || 'Memphis',
        lat: info?.lat || 35.1495,
        lng: info?.lng || -89.9711,
      };
    }).filter((d: { lat: number }) => d.lat !== 35.1495); // Only include known ZIPs

    const precinctData = (precinctRes.features || []).map((f: { attributes: { MPD_Precinct: string; stop_count: number } }) => ({
      precinct: f.attributes.MPD_Precinct,
      count: f.attributes.stop_count,
    }));

    return NextResponse.json({
      totalStops: countRes.count || 0,
      byZip: zipData,
      byPrecinct: precinctData,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Traffic hotspots error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
