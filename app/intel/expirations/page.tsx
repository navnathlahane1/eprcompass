'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type ExpirationRow = {
  id: string;
  registration_id: string;
  registration_type: string;
  authority: string;
  waste_category: string;
  issuing_state: string;
  registration_status: string;
  valid_upto: string;
  days_left: number;
  bucket: 'overdue' | '30d' | '60d' | '90d' | '180d';
  is_primary: boolean;
  company_id: string;
  company_name: string | null;
  company_state: string | null;
  website: string | null;
};

type BucketCounts = { overdue: number; '30d': number; '60d': number; '90d': number; '180d': number };
type Filters = { authorities: string[]; waste_categories: string[]; states: string[]; registration_types: string[] };

const BUCKET_CONFIG = {
  overdue: { label: 'Overdue', color: 'border-rose-500/50 bg-rose-500/10 text-rose-200', dot: 'bg-rose-400' },
  '30d': { label: '≤ 30 days', color: 'border-amber-500/50 bg-amber-500/10 text-amber-200', dot: 'bg-amber-400' },
  '60d': { label: '31–60 days', color: 'border-orange-500/50 bg-orange-500/10 text-orange-200', dot: 'bg-orange-400' },
  '90d': { label: '61–90 days', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200', dot: 'bg-yellow-400' },
  '180d': { label: '91–180 days', color: 'border-slate-600 bg-slate-800/40 text-slate-300', dot: 'bg-slate-500' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ExpirationsPage() {
  const [rows, setRows] = useState<ExpirationRow[]>([]);
  const [buckets, setBuckets] = useState<BucketCounts>({ overdue: 0, '30d': 0, '60d': 0, '90d': 0, '180d': 0 });
  const [filters, setFilters] = useState<Filters>({ authorities: [], waste_categories: [], states: [], registration_types: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [horizon, setHorizon] = useState(180);
  const [filterAuthority, setFilterAuthority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBucket, setFilterBucket] = useState<string>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({ horizon: String(horizon) });
      if (filterAuthority) params.set('authority', filterAuthority);
      if (filterCategory) params.set('waste_category', filterCategory);
      if (filterState) params.set('state', filterState);
      if (filterType) params.set('registration_type', filterType);

      const [dataRes, filtersRes] = await Promise.all([
        fetch(`${getIntelApiBaseUrl()}/api/intel/expirations?${params}`, { headers }),
        fetch(`${getIntelApiBaseUrl()}/api/intel/expirations/filters`, { headers }),
      ]);

      if (!dataRes.ok) throw new Error((await dataRes.json().catch(() => ({}))).error || `HTTP ${dataRes.status}`);
      const data = await dataRes.json();
      setRows(data.rows || []);
      setBuckets(data.buckets || {});
      if (filtersRes.ok) setFilters(await filtersRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally { setLoading(false); }
  }, [horizon, filterAuthority, filterCategory, filterState, filterType]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    let r = rows;
    if (filterBucket !== 'all') r = r.filter(x => x.bucket === filterBucket);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => (x.company_name || '').toLowerCase().includes(q) || (x.registration_id || '').toLowerCase().includes(q) || (x.authority || '').toLowerCase().includes(q));
    }
    return r;
  }, [rows, filterBucket, search]);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Expirations</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-amber-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Registration Expiry Tracker</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Every expiring registration is a guaranteed renewal conversation. Act before competitors do.
            </p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>}

        {/* Bucket KPI strip */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(BUCKET_CONFIG) as Array<keyof typeof BUCKET_CONFIG>).map(b => (
            <button key={b} onClick={() => setFilterBucket(filterBucket === b ? 'all' : b)}
              className={`rounded-xl border p-4 text-left transition ${filterBucket === b ? BUCKET_CONFIG[b].color : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'}`}>
              <div className={`mb-2.5 h-0.5 w-7 rounded-full ${BUCKET_CONFIG[b].dot}`} />
              <p className="text-lg font-bold tabular-nums">{loading ? '—' : buckets[b] ?? 0}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{BUCKET_CONFIG[b].label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company / reg ID…"
            className="col-span-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none" />
          <select value={filterAuthority} onChange={e => setFilterAuthority(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none">
            <option value="">All authorities</option>
            {filters.authorities.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none">
            <option value="">All categories</option>
            {filters.waste_categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterState} onChange={e => setFilterState(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none">
            <option value="">All states</option>
            {filters.states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={horizon} onChange={e => setHorizon(Number(e.target.value))}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none">
            <option value={30}>Next 30 days</option>
            <option value={60}>Next 60 days</option>
            <option value={90}>Next 90 days</option>
            <option value={180}>Next 180 days</option>
            <option value={365}>Next 365 days</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
          {loading ? (
            <div className="space-y-2 animate-pulse p-4">
              {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
            </div>
          ) : displayed.length === 0 ? (
            <div className="p-10 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm font-semibold text-slate-300">No expirations found</p>
              <p className="mt-1 text-xs text-slate-500">Try expanding the horizon or clearing filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Authority / Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Valid Until</th>
                    <th className="px-4 py-3">Urgency</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(row => {
                    const cfg = BUCKET_CONFIG[row.bucket];
                    return (
                      <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <Link href={`/intel/companies/${row.company_id}`} className="font-semibold text-slate-100 hover:text-amber-300">
                            {row.company_name || row.company_id.slice(0, 8)}
                          </Link>
                          {row.is_primary && (
                            <span className="ml-1.5 rounded border border-teal-700/50 bg-teal-500/10 px-1 py-0.5 text-[9px] font-bold text-teal-300">PRIMARY</span>
                          )}
                          <p className="mt-0.5 font-mono text-[10px] text-slate-500">{row.registration_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-200">{row.authority}</p>
                          <p className="mt-0.5 text-slate-500">{row.registration_type}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{row.waste_category || '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{row.issuing_state || row.company_state || '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-200">{formatDate(row.valid_upto)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                            {row.days_left < 0 ? `${Math.abs(row.days_left)}d overdue` : `${row.days_left}d left`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/intel/companies/${row.company_id}`}
                            className="rounded border border-amber-600/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-200 hover:bg-amber-500/20">
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Showing {displayed.length} of {rows.length} registrations expiring within {horizon} days.
        </p>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </div>
    </div>
  );
}
