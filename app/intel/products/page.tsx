'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type ProductRow = {
  id: string;
  product_name: string;
  activity_type: string;
  brand_name: string | null;
  hsn_code: string | null;
  confidence: number;
  extraction_source: string;
  is_verified: boolean;
  is_flagged: boolean;
  company_id: string;
  company_name: string | null;
  company_state: string | null;
  segment_tag: string | null;
  taxonomy_name: string | null;
  is_epr_relevant: boolean | null;
  compliance_category_keys: string[];
};

type HsnRow = { hsn_code: string; company_count: number; product_count: number };
type Summary = { epr_relevant_count: number; verified_count: number; flagged_count: number; activity_breakdown: Record<string, number> };

const ACTIVITY_COLORS: Record<string, string> = {
  manufactured: 'border-teal-700/50 bg-teal-500/10 text-teal-200',
  imported: 'border-amber-700/50 bg-amber-500/10 text-amber-200',
  sold: 'border-cyan-700/50 bg-cyan-500/10 text-cyan-200',
  branded: 'border-violet-700/50 bg-violet-500/10 text-violet-200',
  serviced: 'border-slate-700 bg-slate-800/50 text-slate-400',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [hsnBreakdown, setHsnBreakdown] = useState<HsnRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActivity, setFilterActivity] = useState('');
  const [eprOnly, setEprOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'products' | 'hsn'>('products');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: '300' });
      if (filterActivity) params.set('activity_type', filterActivity);
      if (eprOnly) params.set('epr_only', 'true');
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/products/overview?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data.products || []);
      setHsnBreakdown(data.hsn_breakdown || []);
      setSummary(data.summary);
      setTotal(data.total || 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [filterActivity, eprOnly]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => (p.product_name || '').toLowerCase().includes(q) || (p.company_name || '').toLowerCase().includes(q) || (p.hsn_code || '').toLowerCase().includes(q) || (p.taxonomy_name || '').toLowerCase().includes(q));
  }, [products, search]);

  const activityOptions = useMemo(() => Object.keys(summary?.activity_breakdown || {}), [summary]);

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
              <span className="text-[11px] text-slate-400">Products</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Product Intelligence</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              What companies manufacture, import, and sell — mapped to EPR applicability, HSN codes, and compliance categories.
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
            { label: 'Total Products', value: loading ? '—' : total, accent: 'text-slate-100', bar: 'bg-slate-400' },
            { label: 'EPR Relevant', value: loading ? '—' : summary?.epr_relevant_count ?? 0, accent: 'text-teal-200', bar: 'bg-teal-400' },
            { label: 'Verified', value: loading ? '—' : summary?.verified_count ?? 0, accent: 'text-cyan-200', bar: 'bg-cyan-400' },
            { label: 'Flagged', value: loading ? '—' : summary?.flagged_count ?? 0, accent: 'text-amber-200', bar: 'bg-amber-400' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className={`mb-2.5 h-0.5 w-7 rounded-full ${k.bar}`} />
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${k.accent}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Activity breakdown chips */}
        {summary && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {Object.entries(summary.activity_breakdown).sort((a, b) => b[1] - a[1]).map(([act, cnt]) => (
              <button key={act} onClick={() => setFilterActivity(filterActivity === act ? '' : act)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize transition ${filterActivity === act ? (ACTIVITY_COLORS[act] || 'border-teal-600/50 bg-teal-500/10 text-teal-200') : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                {act} ({cnt})
              </button>
            ))}
            <button onClick={() => setEprOnly(!eprOnly)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${eprOnly ? 'border-teal-500/50 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              EPR only
            </button>
          </div>
        )}

        {/* View toggle + search */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-700 p-0.5">
            {(['products', 'hsn'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${view === v ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:text-slate-200'}`}>
                {v === 'products' ? `Products (${displayed.length})` : `HSN Codes (${hsnBreakdown.length})`}
              </button>
            ))}
          </div>
          {view === 'products' && (
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product / company / HSN…"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none" />
          )}
        </div>

        {/* Products table */}
        {view === 'products' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : displayed.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No products found. Run AI enrichment to extract product intelligence.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Activity</th>
                      <th className="px-4 py-3">Taxonomy</th>
                      <th className="px-4 py-3">HSN</th>
                      <th className="px-4 py-3 text-right">Confidence</th>
                      <th className="px-4 py-3">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(p => (
                      <tr key={p.id} className="border-b border-slate-900/80 hover:bg-slate-800/20">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-100">{p.product_name}</p>
                          {p.brand_name && <p className="text-[10px] text-slate-500">{p.brand_name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/intel/companies/${p.company_id}`} className="text-slate-300 hover:text-teal-300">{p.company_name || '—'}</Link>
                          {p.company_state && <p className="text-[10px] text-slate-500">{p.company_state}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${ACTIVITY_COLORS[p.activity_type] || 'border-slate-700 text-slate-400'}`}>{p.activity_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.taxonomy_name ? (
                            <div>
                              <span className={`text-[11px] ${p.is_epr_relevant ? 'text-teal-300' : 'text-slate-400'}`}>{p.taxonomy_name}</span>
                              {p.is_epr_relevant && <span className="ml-1 rounded bg-teal-900/40 px-1 py-0.5 text-[9px] font-bold text-teal-300">EPR</span>}
                            </div>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{p.hsn_code || '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{Math.round(Number(p.confidence || 0) * 100)}%</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {p.is_verified && <span className="rounded border border-teal-700/50 bg-teal-500/10 px-1 py-0.5 text-[9px] font-bold text-teal-300">✓</span>}
                            {p.is_flagged && <span className="rounded border border-amber-700/50 bg-amber-500/10 px-1 py-0.5 text-[9px] font-bold text-amber-300">⚑</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HSN breakdown */}
        {view === 'hsn' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : hsnBreakdown.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No HSN code data yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">HSN Code</th>
                      <th className="px-4 py-3 text-right">Companies</th>
                      <th className="px-4 py-3 text-right">Products</th>
                      <th className="px-4 py-3">Concentration bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hsnBreakdown.map((h, i) => {
                      const maxCo = hsnBreakdown[0]?.company_count || 1;
                      return (
                        <tr key={h.hsn_code} className="border-b border-slate-900/80">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-100">{h.hsn_code}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-teal-300">{h.company_count}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-400">{h.product_count}</td>
                          <td className="px-4 py-3">
                            <div className="h-1.5 w-full rounded-full bg-slate-800">
                              <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${Math.round((h.company_count / maxCo) * 100)}%` }} />
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
