'use client';

import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useState, useMemo } from 'react';

// Memphis center coordinates
const MEMPHIS_CENTER = { lat: 35.1495, lng: -90.0490 };

interface TicketLocation {
  id: string;
  lat: number;
  lng: number;
  count: number;
  label?: string;
  precinct?: string;
  zipCode?: string;
}

interface TicketHeatMapProps {
  locations: TicketLocation[];
  showHeatmap?: boolean;
  showMarkers?: boolean;
  height?: string;
  apiKey?: string;
}

// Marker cluster component
function MarkerCluster({ location }: { location: TicketLocation }) {
  // Size based on count
  const size = Math.max(24, Math.min(64, 24 + Math.log(location.count) * 8));

  // Color intensity based on count
  const getColor = (count: number) => {
    if (count > 1000) return 'bg-red-500';
    if (count > 500) return 'bg-orange-500';
    if (count > 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <AdvancedMarker position={{ lat: location.lat, lng: location.lng }}>
      <div
        className={`${getColor(location.count)} rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white`}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
        title={`${location.label || 'Location'}: ${location.count.toLocaleString()} tickets`}
      >
        {location.count >= 1000 ? `${(location.count / 1000).toFixed(1)}k` : location.count}
      </div>
    </AdvancedMarker>
  );
}

// Heatmap layer component
function HeatmapLayer({ locations }: { locations: TicketLocation[] }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');

  useEffect(() => {
    if (!map || !visualization) return;

    const heatmapData = locations.map((loc) => ({
      location: new google.maps.LatLng(loc.lat, loc.lng),
      weight: loc.count,
    }));

    const heatmap = new visualization.HeatmapLayer({
      data: heatmapData,
      map,
      radius: 30,
      opacity: 0.7,
      gradient: [
        'rgba(0, 255, 0, 0)',
        'rgba(0, 255, 0, 1)',
        'rgba(255, 255, 0, 1)',
        'rgba(255, 165, 0, 1)',
        'rgba(255, 0, 0, 1)',
      ],
    });

    return () => {
      heatmap.setMap(null);
    };
  }, [map, visualization, locations]);

  return null;
}

export function TicketHeatMap({
  locations,
  showHeatmap = true,
  showMarkers = true,
  height = '500px',
  apiKey,
}: TicketHeatMapProps) {
  const effectiveApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (locations.length === 0) return null;

    const lats = locations.map((l) => l.lat);
    const lngs = locations.map((l) => l.lng);

    return {
      north: Math.max(...lats) + 0.02,
      south: Math.min(...lats) - 0.02,
      east: Math.max(...lngs) + 0.02,
      west: Math.min(...lngs) - 0.02,
    };
  }, [locations]);

  if (!effectiveApiKey) {
    return (
      <div
        className="bg-[#F8F8F8] rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#4A4A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-[#4A4A4A] font-medium">Map not available</p>
          <p className="text-sm text-[#4A4A4A]/70 mt-1">
            Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable maps
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-[#E5E5E5]" style={{ height }}>
      <APIProvider apiKey={effectiveApiKey} libraries={['visualization']}>
        <Map
          defaultCenter={MEMPHIS_CENTER}
          defaultZoom={11}
          mapId="ticket-heat-map"
          gestureHandling="cooperative"
          disableDefaultUI={false}
          restriction={bounds ? { latLngBounds: bounds, strictBounds: false } : undefined}
          style={{ width: '100%', height: '100%' }}
        >
          {showHeatmap && locations.length > 0 && <HeatmapLayer locations={locations} />}

          {showMarkers &&
            locations.map((location) => (
              <MarkerCluster key={location.id} location={location} />
            ))}
        </Map>
      </APIProvider>
    </div>
  );
}

// Simplified map without clusters for small datasets
export function SimpleTicketMap({
  locations,
  height = '400px',
  apiKey,
}: {
  locations: Array<{ lat: number; lng: number; label?: string }>;
  height?: string;
  apiKey?: string;
}) {
  const effectiveApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!effectiveApiKey) {
    return (
      <div
        className="bg-[#F8F8F8] rounded-xl flex items-center justify-center text-[#4A4A4A]"
        style={{ height }}
      >
        Map requires API key
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-[#E5E5E5]" style={{ height }}>
      <APIProvider apiKey={effectiveApiKey}>
        <Map
          defaultCenter={MEMPHIS_CENTER}
          defaultZoom={11}
          mapId="simple-ticket-map"
          gestureHandling="cooperative"
          style={{ width: '100%', height: '100%' }}
        >
          {locations.map((loc, i) => (
            <AdvancedMarker key={i} position={{ lat: loc.lat, lng: loc.lng }} title={loc.label} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
