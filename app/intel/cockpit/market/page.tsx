'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';

type Segment = {
  waste_category: string;
  state: string;
  fy: number | null;
  tam_inr: number | null;
  won_inr: number | null;
  share_ratio: number | null;
  win_rate: number | null;
  total_known: number | null;
  in_our_pipeline: number | null;
  untapped_pool: number | null;
  untapped_share: number | null;
};

type Summary = {
  total_tam_inr: number;
  total_won_inr: number;
  overall_share_ratio: number;
  high_untapped_segments: number;
  total_segments: number;
};

function formatInr(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function formatPct(r: number | null | undefined) {
  if (r == null || !Number.isFinite(Number(r))) return '—';
  return `${(Number(r) * 100).toFixed(1)}%`;
}

function UntappedBar({ value }: { value: number | null }) {
  const pct = Math.round(Number(value || 0) * 100);
  const color = pct >= 70 ? 'bg-amber-500' : pct >= 40 ? 'bg-teal-500' : 'bg-slate-600';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] tabular-nums text-slate-400">{pct}%</span>
    </div>
  );
}

export default function MarketPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterState, setFilterState] = useState('');
  const [sortBy, setSortBy] = useState<'tam' | 'untapped' | 'share'>('tam');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/market`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setSegments(data.segments || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => [...new Set(segments.map(s => s.waste_category).filter(Boolean))].sort(), [segments]);
  const states = useMemo(() => [...new Set(segments.map(s => s.state).filter(Boolean))].sort(), [segments]);

  const displayed = useMemo(() => {
    let s = segments;
    if (filterCategory) s = s.filter(x => x.waste_category === filterCategory);
    if (filterState) s = s.filter(x => x.state === filterState);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(x => (x.waste_category || '').toLowerCase().includes(q) || (x.state || '').toLowerCase().includes(q));
    }
    if (sortBy === 'tam') s = [...s].sort((a, b) => Number(b.tam_inr || 0) - Number(a.tam_inr || 0));
    if (sortBy === 'untapped') s = [...s].sort((a, b) => Number(b.untapped_share || 0) - Number(a.untapped_share || 0));
    if (sortBy === 'share') s = [...s].sort((a, b) => Number(b.share_ratio || 0) - Number(a.share_ratio || 0));
    return s;
  }, [segments, filterCategory, filterState, search, sortBy]);

  const highUntapped = useMemo(() => displayed.filter(s => Number(s.untapped_share || 0) > 0.7 && Number(s.tam_inr || 0) > 0), [displayed]);
  const maxTam = Math.max(1, ...displayed.map(s => Number(s.tam_inr || 0)));

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* Header */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-5">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <Link href="/intel/cockpit" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Cockpit</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Market</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Competitive Market Map</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              TAM coverage, market share, and untapped pool by segment. High TAM + high untapped = priority to capture.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh
          </button>
        </div>
        {error && <p className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>}
      </section>

      <PlatformPulseBanner />

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total TAM', value: loading ? '—' : formatInr(summary?.total_tam_inr), accent: 'text-slate-100', color: 'slate' },
          { label: 'Revenue Won', value: loading ? '—' : formatInr(summary?.total_won_inr), accent: 'text-teal-200', color: 'teal' },
          { label: 'Overall Share', value: loading ? '—' : formatPct(summary?.overall_share_ratio), accent: 'text-teal-200', color: 'teal' },
          { label: 'High Untapped Segs', value: loading ? '—' : summary?.high_untapped_segments ?? 0, accent: 'text-amber-200', color: 'amber' },
          { label: 'Total Segments', value: loading ? '—' : summary?.total_segments ?? 0, accent: 'text-slate-100', color: 'slate' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className={`mb-2.5 h-0.5 w-7 rounded-full bg-${k.color}-400`} />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">{k.label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${k.accent}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Priority highlight */}
      {highUntapped.length > 0 && !loading && (
        <div className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10.29 3.86-8.28 14.33a2 2 0 0 0 1.71 3h16.56a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-xs font-semibold text-amber-300">{highUntapped.length} high-priority untapped segment{highUntapped.length > 1 ? 's' : ''} (TAM &gt; 0 and &gt;70% untapped)</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {highUntapped.slice(0, 6).map((s, i) => (
              <span key={i} className="rounded-full border border-amber-700/50 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                {s.waste_category} · {s.state} ({formatPct(s.untapped_share)} untapped)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters + sort */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search category / state…"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterState} onChange={e => setFilterState(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none">
          <option value="">All states</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-1">
          {([['tam', 'By TAM'], ['untapped', 'By Untapped'], ['share', 'By Share']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setSortBy(k)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${sortBy === k ? 'border-teal-400/50 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Segment table */}
      <div className="relative mt-3 rounded-2xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="p-8 space-y-2 animate-pulse">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="mt-2 text-sm font-semibold text-slate-300">No segment data yet</p>
            <p className="mt-1 text-xs text-slate-500">Populate intel_market_rates and intel_outcome_attribution to generate market share views.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3 text-right">TAM</th>
                  <th className="px-4 py-3 text-right">Won</th>
                  <th className="px-4 py-3 text-right">Our Share</th>
                  <th className="px-4 py-3 text-right">Win Rate</th>
                  <th className="px-4 py-3">Untapped Pool</th>
                  <th className="px-4 py-3">TAM bar</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((s, i) => {
                  const isHot = Number(s.untapped_share || 0) > 0.7 && Number(s.tam_inr || 0) > 0;
                  return (
                    <tr key={i} className={`border-b border-slate-900/80 hover:bg-slate-800/20 transition-colors ${isHot ? 'bg-amber-950/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isHot && (
                            <svg className="h-3.5 w-3.5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10.29 3.86-8.28 14.33a2 2 0 0 0 1.71 3h16.56a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                          )}
                          <div>
                            <p className="font-semibold text-slate-100">{s.waste_category || '—'}</p>
                            <p className="text-slate-500">{s.state || 'All India'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-200">{formatInr(s.tam_inr)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-teal-300">{formatInr(s.won_inr)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={Number(s.share_ratio || 0) > 0.2 ? 'font-bold text-teal-200' : 'text-slate-400'}>
                          {formatPct(s.share_ratio)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400">{formatPct(s.win_rate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <UntappedBar value={s.untapped_share} />
                          {s.untapped_pool != null && (
                            <p className="text-[10px] text-slate-500">{s.untapped_pool} co. untapped</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-1.5 w-24 rounded-full bg-slate-800">
                          <div className="h-1.5 rounded-full bg-teal-500/60" style={{ width: `${Math.round((Number(s.tam_inr || 0) / maxTam) * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-400">
        <span>Views: <code className="rounded bg-slate-800 px-1 text-[10px]">v_intel_market_share</code> × <code className="rounded bg-slate-800 px-1 text-[10px]">v_intel_competitor_density</code></span>
        <Link href="/intel/cockpit/scenarios" className="text-[10px] text-teal-400 hover:text-teal-300">Run scenario on a segment →</Link>
      </footer>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
        <Link href="/intel/cockpit" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to Cockpit
        </Link>
      </div>
    </div>
  );
}
