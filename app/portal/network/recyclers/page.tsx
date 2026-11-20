'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { RecyclerCard } from '@/components/recycler-network/RecyclerCard';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

interface Recycler {
  id: string;
  recycler_code: string;
  name: string;
  type: 'RECYCLER' | 'PRO';
  epr_categories: string[];
  authorized_states: string[];
  verification_status: string;
}

interface Link {
  recycler_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'REMOVED';
}

const EPR_CATEGORIES = ['PLASTIC', 'EWASTE', 'BATTERY', 'USED_OIL', 'TYRE'];

export default function NetworkRecyclersPage() {
  const router = useRouter();
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [links, setLinks] = useState<Map<string, 'ACTIVE' | 'PAUSED' | 'REMOVED'>>(new Map());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (category) params.set('category', category);

      const [recyclersRes, linksRes] = await Promise.all([
        fetch(`/api/network/recyclers?${params}`),
        fetch('/api/network/clients/me/recyclers'),
      ]);

      if (!recyclersRes.ok) throw new Error((await recyclersRes.json()).error);

      const recyclersData = await recyclersRes.json();
      setRecyclers(recyclersData.recyclers ?? []);

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        const map = new Map<string, 'ACTIVE' | 'PAUSED' | 'REMOVED'>();
        for (const l of linksData.links ?? []) {
          map.set(l.recyclers?.id ?? l.recycler_id, l.status);
        }
        setLinks(map);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  async function handleLink(recyclerId: string) {
    setActionLoading(recyclerId);
    try {
      const res = await fetch('/api/network/clients/me/recyclers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recycler_id: recyclerId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      trackEvent('Client Network Recycler Linked', {});
      setLinks((prev) => new Map(prev).set(recyclerId, 'ACTIVE'));
      showToast('Recycler linked to your network');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Link failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnlink(recyclerId: string) {
    setActionLoading(recyclerId);
    try {
      const res = await fetch(`/api/network/clients/me/recyclers/${recyclerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error);
      trackEvent('Client Network Recycler Unlinked', {});
      setLinks((prev) => { const m = new Map(prev); m.set(recyclerId, 'REMOVED'); return m; });
      showToast('Recycler removed from network');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Unlink failed');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = recyclers.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.recycler_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="rounded-lg bg-eco-green-5/10 px-4 py-2 text-sm font-medium text-eco-green-5">
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search recyclers by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search recyclers"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-eco-green-5 focus:outline-none focus:ring-2 focus:ring-eco-green-5/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by EPR category"
            className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-eco-green-5 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">All Categories</option>
            {EPR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <button
            onClick={load}
            aria-label="Refresh"
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-eco-green-5"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} <button onClick={load} className="ml-2 underline">Retry</button>
        </div>
      )}

      {loading && !recyclers.length && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {!loading && !filtered.length && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-lg font-semibold text-slate-600">No recyclers found</p>
          <p className="mt-1 text-sm text-slate-400">
            {search || category ? 'Try adjusting your filters' : 'No verified recyclers in our marketplace yet'}
          </p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RecyclerCard
              key={r.id}
              id={r.id}
              recyclerCode={r.recycler_code}
              name={r.name}
              type={r.type}
              eprCategories={r.epr_categories}
              authorizedStates={r.authorized_states}
              verificationStatus={r.verification_status}
              linkStatus={links.get(r.id) ?? null}
              href={`/portal/network/recyclers/${r.id}`}
              onLink={actionLoading !== r.id ? handleLink : undefined}
              onUnlink={actionLoading !== r.id ? handleUnlink : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
