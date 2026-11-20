'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Filter } from 'lucide-react';

// [UPGRADE] Leaflet is SSR-unsafe — must be dynamically imported with ssr:false
const RecyclerMap = dynamic(
  () => import('@/components/recycler-network/RecyclerMap').then((m) => m.RecyclerMap),
  { ssr: false, loading: () => <div className="flex h-96 items-center justify-center rounded-xl bg-slate-100"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div> }
);

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

export default function NetworkMapPage() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [category, setCategory] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (linkedOnly) params.set('linked', 'true');
        if (category) params.set('category', category);
        const res = await fetch(`/api/network/recyclers/geo?${params}`);
        if (!res.ok) throw new Error((await res.json()).error);
        const { pins: data } = await res.json();
        setPins(data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [linkedOnly, category]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={linkedOnly}
            onChange={(e) => setLinkedOnly(e.target.checked)}
            className="rounded"
          />
          My network only
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by EPR category"
          className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Categories</option>
          {['PLASTIC', 'EWASTE', 'BATTERY', 'USED_OIL', 'TYRE'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{loading ? 'Loading…' : `${pins.length} recyclers`}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {[
          { color: '#10b981', label: 'Excellent (≥4.5)' },
          { color: '#a3e635', label: 'Good (≥3.5)' },
          { color: '#f59e0b', label: 'Average (≥2.5)' },
          { color: '#ef4444', label: 'Poor (<2.5)' },
          { color: '#9ca3af', label: 'Suspended' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Map */}
      <div className="h-[520px] rounded-xl overflow-hidden">
        <RecyclerMap pins={pins} />
      </div>
    </div>
  );
}
