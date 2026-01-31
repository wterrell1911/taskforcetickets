'use client';

import { useEffect, useRef } from 'react';

interface ZipData {
  zip: string;
  name: string;
  count: number;
  lat: number;
  lng: number;
}

function getColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio > 0.7) return '#CF2A27'; // Stop Red
  if (ratio > 0.4) return '#FF8C00'; // Orange
  return '#FFD100'; // Yellow
}

function getRadius(count: number, max: number): number {
  const ratio = count / max;
  return Math.max(15, Math.round(ratio * 50));
}

export function TrafficMap({ data }: { data: ZipData[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || data.length === 0) return;

    // Dynamically import Leaflet (avoids SSR issues)
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Import CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
      }).setView([35.1495, -89.9711], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 16,
      }).addTo(map);

      const maxCount = data[0]?.count || 1;

      data.forEach((z) => {
        const color = getColor(z.count, maxCount);
        const radius = getRadius(z.count, maxCount);

        L.circleMarker([z.lat, z.lng], {
          radius,
          fillColor: color,
          color: '#1A1A1A',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.7,
        })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;text-align:center;">
              <div style="font-weight:800;font-size:16px;color:#1A1A1A;">${z.name}</div>
              <div style="color:#4A4A4A;font-size:13px;">ZIP ${z.zip}</div>
              <div style="font-weight:900;font-size:24px;color:${color};margin:8px 0;">${z.count.toLocaleString()}</div>
              <div style="color:#4A4A4A;font-size:13px;">traffic stops</div>
              <a href="/intake" style="display:inline-block;margin-top:10px;background:#FFD100;color:#1A1A1A;padding:6px 16px;border-radius:8px;font-weight:700;text-decoration:none;font-size:13px;">Got a ticket here? →</a>
            </div>`,
            { maxWidth: 250 }
          );
      });

      mapInstance.current = map;
    };

    initMap();
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-[#4A4A4A]">Loading map data...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[500px] md:h-[600px] rounded-2xl border-2 border-[#E5E5E5] overflow-hidden"
      style={{ zIndex: 1 }}
    />
  );
}
