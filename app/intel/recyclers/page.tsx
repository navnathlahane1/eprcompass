'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type BalanceRow = {
  state: string;
  demand_target_mt: number;
  supply_capacity_mt: number;
  recycler_count: number;
  capacity_balance_mt: number;
  supply_demand_ratio: number;
  balance_band: 'surplus' | 'balanced' | 'deficit' | 'no-demand';
};

type RecyclerRow = {
  company_id: string;
  company_name: string | null;
  website: string | null;
  segment_tag: string | null;
  cpcb_registration_number: string | null;
  cpcb_registration_status: string | null;
  recycler_category: string | null;
  capacity_mt: number | null;
  material_categories: string[];
  state: string | null;
  city: string | null;
  registration_valid_upto: string | null;
  enrichment_confidence: number | null;
  partnership: { partnership_score: number; partnership_priority: string; outreach_status: string; total_credits_mt: number } | null;
};

type Summary = { total_recyclers: number; total_capacity_mt: number; deficit_states: number; surplus_states: number };

const BAND_CONFIG = {
  deficit: { label: 'Deficit', color: 'border-rose-500/50 bg-rose-500/10 text-rose-200', dot: 'bg-rose-400' },
  balanced: { label: 'Balanced', color: 'border-teal-500/50 bg-teal-500/10 text-teal-200', dot: 'bg-teal-400' },
  surplus: { label: 'Surplus', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200', dot: 'bg-cyan-400' },
  'no-demand': { label: 'No Demand', color: 'border-slate-700 bg-slate-800/40 text-slate-400', dot: 'bg-slate-600' },
};

function formatMt(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k MT`;
  return `${v.toFixed(0)} MT`;
}

export default function RecyclersPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [balance, setBalance] = useState<BalanceRow[]>([]);
  const [recyclers, setRecyclers] = useState<RecyclerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState('');
  const [filterBand, setFilterBand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'capacity' | 'recyclers'>('capacity');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: '200' });
      if (filterState) params.set('state', filterState);
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/recyclers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setBalance(data.capacity_balance || []);
      setRecyclers(data.recyclers || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [filterState]);

  useEffect(() => { load(); }, [load]);

  const filteredBalance = useMemo(() => {
    let b = balance;
    if (filterBand) b = b.filter(r => r.balance_band === filterBand);
    return b;
  }, [balance, filterBand]);

  const filteredRecyclers = useMemo(() => {
    let r = recyclers;
    if (filterStatus) r = r.filter(x => (x.cpcb_registration_status || '').toLowerCase().includes(filterStatus.toLowerCase()));
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => (x.company_name || '').toLowerCase().includes(q) || (x.city || '').toLowerCase().includes(q) || (x.cpcb_registration_number || '').toLowerCase().includes(q));
    }
    return r;
  }, [recyclers, filterStatus, search]);

  const stateOptions = useMemo(() => [...new Set(balance.map(r => r.state).filter(Boolean))].sort(), [balance]);

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
              <span className="text-[11px] text-slate-400">Recyclers</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Recycler Network</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              State-level EPR supply vs demand balance, CPCB recycler directory, and partnership scoring.
            </p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>}

        {/* KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Recyclers', value: loading ? '—' : summary?.total_recyclers ?? 0, accent: 'text-slate-100', bar: 'bg-slate-400' },
            { label: 'Total Capacity', value: loading ? '—' : formatMt(summary?.total_capacity_mt), accent: 'text-cyan-200', bar: 'bg-cyan-400' },
            { label: 'Deficit States', value: loading ? '—' : summary?.deficit_states ?? 0, accent: 'text-rose-200', bar: 'bg-rose-400' },
            { label: 'Surplus States', value: loading ? '—' : summary?.surplus_states ?? 0, accent: 'text-teal-200', bar: 'bg-teal-400' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className={`mb-2.5 h-0.5 w-7 rounded-full ${k.bar}`} />
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${k.accent}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* View toggle + filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-700 p-0.5">
            {(['capacity', 'recyclers'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${view === v ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}>
                {v === 'capacity' ? 'Capacity Map' : 'Recycler Directory'}
              </button>
            ))}
          </div>
          {view === 'capacity' && (
            <>
              <select value={filterState} onChange={e => setFilterState(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none">
                <option value="">All states</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-1">
                {(Object.keys(BAND_CONFIG) as Array<keyof typeof BAND_CONFIG>).map(b => (
                  <button key={b} onClick={() => setFilterBand(filterBand === b ? '' : b)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${filterBand === b ? BAND_CONFIG[b].color : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                    {BAND_CONFIG[b].label}
                  </button>
                ))}
              </div>
            </>
          )}
          {view === 'recyclers' && (
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company / reg no…"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none" />
          )}
        </div>

        {/* Capacity balance table */}
        {view === 'capacity' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : filteredBalance.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No capacity data. Populate CPCB recycler profiles and market rates.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3 text-right">Demand (MT)</th>
                      <th className="px-4 py-3 text-right">Supply (MT)</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Recyclers</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalance.map((r, i) => {
                      const cfg = BAND_CONFIG[r.balance_band] || BAND_CONFIG['no-demand'];
                      return (
                        <tr key={i} className="border-b border-slate-900/80 hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-100">{r.state}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatMt(r.demand_target_mt)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatMt(r.supply_capacity_mt)}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-semibold ${Number(r.capacity_balance_mt || 0) < 0 ? 'text-rose-300' : 'text-teal-300'}`}>
                            {Number(r.capacity_balance_mt || 0) >= 0 ? '+' : ''}{formatMt(r.capacity_balance_mt)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-400">{r.recycler_count}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Recycler directory */}
        {view === 'recyclers' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : filteredRecyclers.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No recyclers found. Upload CPCB registration data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">CPCB Reg</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Capacity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Partnership</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecyclers.map(r => (
                      <tr key={r.company_id} className="border-b border-slate-900/80 hover:bg-slate-800/20">
                        <td className="px-4 py-3">
                          <Link href={`/intel/companies/${r.company_id}`} className="font-semibold text-slate-100 hover:text-cyan-300">
                            {r.company_name || r.company_id.slice(0, 8)}
                          </Link>
                          {r.material_categories.slice(0, 2).map(m => (
                            <span key={m} className="ml-1 rounded bg-slate-800/60 px-1 py-0.5 text-[9px] text-slate-400">{m}</span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{r.city}{r.city && r.state ? ', ' : ''}{r.state}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{r.cpcb_registration_number || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{r.recycler_category || '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-200">{formatMt(r.capacity_mt)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${r.cpcb_registration_status === 'Active' ? 'border-teal-600/50 bg-teal-500/10 text-teal-200' : 'border-slate-700 bg-slate-800/50 text-slate-400'}`}>
                            {r.cpcb_registration_status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.partnership ? (
                            <span className={`text-[10px] font-semibold ${r.partnership.partnership_priority === 'high' ? 'text-amber-300' : 'text-slate-400'}`}>
                              {r.partnership.partnership_priority} · {r.partnership.partnership_score?.toFixed(0)}
                            </span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
