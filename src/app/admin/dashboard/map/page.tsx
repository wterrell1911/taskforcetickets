'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TicketHeatMap } from '@/components/maps/TicketHeatMap';

interface MapData {
  locations: Array<{
    id: string;
    lat: number;
    lng: number;
    count: number;
    label: string;
    precinct?: string;
    zipCode?: string;
  }>;
  totalPoints: number;
  totalTickets: number;
  groupBy: string;
}

export default function MapPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [groupBy, setGroupBy] = useState<'zip' | 'precinct'>('zip');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMapData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/traffic-stops/map?groupBy=${groupBy}`);
        if (res.ok) {
          const data = await res.json();
          setMapData(data);
        }
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMapData();
  }, [groupBy]);

  // Find top locations
  const topLocations = mapData?.locations.slice(0, 10) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Traffic Ticket Map</h1>
            <p className="text-[#4A4A4A] mt-1">
              Visualize where traffic tickets are being issued across Memphis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Group By Toggle */}
            <div className="flex items-center gap-2 bg-[#F8F8F8] rounded-lg p-1">
              <button
                onClick={() => setGroupBy('zip')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'zip'
                    ? 'bg-white shadow text-[#1A1A1A]'
                    : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
                }`}
              >
                By ZIP Code
              </button>
              <button
                onClick={() => setGroupBy('precinct')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  groupBy === 'precinct'
                    ? 'bg-white shadow text-[#1A1A1A]'
                    : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
                }`}
              >
                By Precinct
              </button>
            </div>

            {/* Display Options */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E5E5] accent-[#FFD100]"
                />
                <span className="text-sm text-[#4A4A4A]">Heatmap</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={(e) => setShowMarkers(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E5E5] accent-[#FFD100]"
                />
                <span className="text-sm text-[#4A4A4A]">Markers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {mapData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-4">
              <p className="text-sm text-[#4A4A4A]">Total Tickets</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {mapData.totalTickets.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-4">
              <p className="text-sm text-[#4A4A4A]">
                {groupBy === 'zip' ? 'ZIP Codes' : 'Precincts'}
              </p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{mapData.totalPoints}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-4">
              <p className="text-sm text-[#4A4A4A]">Highest Volume</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {topLocations[0]?.label || '-'}
              </p>
              <p className="text-xs text-[#4A4A4A]">
                {topLocations[0]?.count.toLocaleString()} tickets
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-4">
              <p className="text-sm text-[#4A4A4A]">Avg per {groupBy === 'zip' ? 'ZIP' : 'Precinct'}</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {mapData.totalPoints > 0
                  ? Math.round(mapData.totalTickets / mapData.totalPoints).toLocaleString()
                  : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#FFD100] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-[#4A4A4A]">Loading map data...</p>
              </div>
            </div>
          ) : mapData ? (
            <TicketHeatMap
              locations={mapData.locations}
              showHeatmap={showHeatmap}
              showMarkers={showMarkers}
              height="500px"
            />
          ) : (
            <div className="h-[500px] flex items-center justify-center">
              <p className="text-[#4A4A4A]">No map data available</p>
            </div>
          )}
        </div>

        {/* Top Locations Table */}
        {topLocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
            <h2 className="font-semibold text-[#1A1A1A] mb-4">
              Top 10 {groupBy === 'zip' ? 'ZIP Codes' : 'Precincts'} by Volume
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#4A4A4A]">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#4A4A4A]">
                      {groupBy === 'zip' ? 'ZIP Code' : 'Precinct'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#4A4A4A]">Tickets</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#4A4A4A]">% of Total</th>
                    <th className="py-3 px-4 text-sm font-medium text-[#4A4A4A]">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocations.map((loc, i) => {
                    const pct = mapData ? ((loc.count / mapData.totalTickets) * 100).toFixed(1) : 0;
                    const maxCount = topLocations[0]?.count || 1;
                    const barWidth = (loc.count / maxCount) * 100;

                    return (
                      <tr key={loc.id} className="border-b border-[#E5E5E5] last:border-b-0">
                        <td className="py-3 px-4">
                          <span className="w-6 h-6 bg-[#FFD100] rounded text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1A1A1A]">{loc.label}</td>
                        <td className="py-3 px-4 text-right text-[#1A1A1A]">
                          {loc.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[#4A4A4A]">{pct}%</td>
                        <td className="py-3 px-4">
                          <div className="w-32 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FFD100] rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-[#F8F8F8] rounded-xl p-4">
          <h3 className="font-medium text-[#1A1A1A] mb-3">Map Legend</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-[#4A4A4A]">&lt; 100 tickets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full" />
              <span className="text-[#4A4A4A]">100-500 tickets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full" />
              <span className="text-[#4A4A4A]">500-1000 tickets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-[#4A4A4A]">&gt; 1000 tickets</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
