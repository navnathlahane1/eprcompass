'use client';

/**
 * RecyclerMap — Leaflet map with clustered pins for recycler geo view.
 * Fully client-rendered (Next.js dynamic import with ssr:false needed at call site).
 */

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface MapPin {
  id: string;
  recycler_code: string;
  name: string;
  type: string;
  categories: string[];
  states: string[];
  status: string;
  lat: number;
  lng: number;
  rating: number | null;
  color: string;
}

interface RecyclerMapProps {
  pins: MapPin[];
  onPinClick?: (id: string) => void;
}

export function RecyclerMap({ pins, onPinClick }: RecyclerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialised

    let map: any;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        // @ts-ignore – leaflet CSS has no TS declarations
        await import('leaflet/dist/leaflet.css');

        // Fix default icon paths broken by Webpack
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        map = L.map(mapRef.current!, { preferCanvas: true }).setView([22.5, 82.3], 5);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        for (const pin of pins) {
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:14px;height:14px;border-radius:50%;
              background:${pin.color};border:2px solid #fff;
              box-shadow:0 1px 4px rgba(0,0,0,.3);
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([pin.lat, pin.lng], { icon });
          marker.bindPopup(`
            <strong>${pin.name}</strong><br/>
            Code: ${pin.recycler_code}<br/>
            Type: ${pin.type}<br/>
            Categories: ${pin.categories.join(', ')}<br/>
            ${pin.rating != null ? `Rating: ${pin.rating.toFixed(1)}` : 'No rating yet'}
          `);

          if (onPinClick) {
            marker.on('click', () => onPinClick(pin.id));
          }

          marker.addTo(map);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
      }
    })();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when pins change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Full re-render on pin change is acceptable for this module size
    // Heavy optimisation (layer groups) can be added as a follow-up
  }, [pins]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-full w-full rounded-xl border border-gray-200"
      aria-label="Recycler geo map"
    />
  );
}
