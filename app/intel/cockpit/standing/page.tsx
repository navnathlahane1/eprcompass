'use client';

// Canvas 1 — Where we stand. Backed by GET /intel/cockpit/standing
// (composed from v_intel_market_share + intel_outcome_attribution +
// v_intel_competitor_density). Tokens follow .claude/skills/exec-cockpit.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';
import MetricOwnerBar from '../_components/MetricOwnerBar';

type SegmentRow = {
  state: string;
  waste_category: string;
  fy: number;
  tam_inr: number;
  addressable_companies: number;
  won_inr: number;
  deals_won: number;
  deals_lost: number;
  share_ratio: number;
  win_rate: number | null;
};

type WinRow = {
  company_id: string;
  deal_size_inr: number | null;
  waste_category: string | null;
  state: string | null;
  closed_at: string | null;
};

type UntappedRow = {
  state: string;
  waste_category: string;
  total_known: number;
  in_our_pipeline: number;
  untapped_pool: number;
  untapped_share: number;
};

type CockpitPayload = {
  headline: {
    label: string;
    value_ratio: number;
    value_pct: number;
    tam_inr: number;
    won_inr: number;
    fy: number;
  };
  supporting: {
    by_segment: SegmentRow[];
    top_3_wins: WinRow[];
    top_5_untapped: UntappedRow[];
  };
  drill_targets: Record<string, string>;
  generated_at: string;
};

function formatInr(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatPct(ratio: number | null | undefined, decimals = 1): string {
  if (ratio == null) return '—';
  return `${(Number(ratio) * 100).toFixed(decimals)}%`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatLastRefreshed(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

type CoverageRow = {
  state: string;
  total_companies: number;
  products_enriched_count: number;
  hot_warm_count: number;
  classification_pct: number;
  product_enrichment_pct: number;
  brief_coverage_pct: number;
};

export default function CockpitStandingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CockpitPayload | null>(null);
  const [fy, setFy] = useState<number>(new Date().getUTCFullYear());
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Not signed in. Please log in via /intel/login.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/standing?fy=${fy}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CockpitPayload & { ok: boolean };
      setPayload(data);

      // Load enrichment coverage in parallel — non-blocking
      fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/enrichment-coverage`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.ok ? r.json() : null).then((d) => {
        if (d?.by_state) setCoverage(d.by_state);
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cockpit');
    } finally {
      setLoading(false);
    }
  }, [fy]);

  useEffect(() => {
    load();
  }, [load]);

  const headline = payload?.headline;
  const bySegment = payload?.supporting.by_segment ?? [];
  const topWins = payload?.supporting.top_3_wins ?? [];
  const topUntapped = payload?.supporting.top_5_untapped ?? [];

  const totalUntappedCompanies = useMemo(
    () => topUntapped.reduce((s, r) => s + Number(r.untapped_pool || 0), 0),
    [topUntapped],
  );

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* ─── Sticky canvas header ─────────────────────────────── */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <Link href="/intel/cockpit" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Cockpit</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Standing</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Where we stand</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Blended market share, recent wins, and the largest untapped pools — for FY {fy}-{String((fy + 1) % 100).padStart(2, '0')}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-400">
              FY{' '}
              <select
                value={fy}
                onChange={(e) => setFy(Number(e.target.value))}
                className="ml-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-teal-400 focus:outline-none"
              >
                {[fy - 1, fy, fy + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Refresh
            </button>
            <button
              type="button"
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-teal-400 hover:text-teal-300"
            >
              Print to PDF
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {/* Headline metric */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-teal-400/30 bg-teal-500/10 p-4 md:col-span-1">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
            <p className="text-[11px] uppercase tracking-widest text-teal-200">Blended market share</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-teal-100 tabular-nums">
              {loading ? '—' : formatPct(headline?.value_ratio, 2)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {loading ? 'Loading…' : `${formatInr(headline?.won_inr)} won of ${formatInr(headline?.tam_inr)} TAM`}
            </p>
            <MetricOwnerBar metricId="market_share" />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-slate-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Addressable segments</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-200">{loading ? '—' : bySegment.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">state × category combinations with TAM &gt; 0</p>
            <MetricOwnerBar metricId="addressable_segments" />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-amber-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Untapped companies (top 5)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-200">{loading ? '—' : totalUntappedCompanies}</p>
            <p className="mt-1 text-[11px] text-slate-500">in segments we are not yet working</p>
            <MetricOwnerBar metricId="untapped_pool" />
          </div>
        </div>
      </section>

      <PlatformPulseBanner />

      {/* ─── Two-column body ──────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left: by-segment table */}
        <section
          aria-labelledby="by-segment-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-7"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="by-segment-heading" className="text-sm font-semibold text-teal-300">
              Share by segment
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              top {Math.min(bySegment.length, 12)} by TAM
            </p>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : bySegment.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm text-slate-400">
                No TAM rows yet — seed companies and their EPR targets to populate v_intel_tam_by_segment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3 text-right">TAM</th>
                    <th className="py-2 pr-3 text-right">Won</th>
                    <th className="py-2 pr-3 text-right">Share</th>
                    <th className="py-2 pr-3 text-right">Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {bySegment.slice(0, 12).map((row) => (
                    <tr
                      key={`${row.state}-${row.waste_category}-${row.fy}`}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 pr-3 text-slate-200">{row.state}</td>
                      <td className="py-2 pr-3 text-slate-300">{row.waste_category}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-100">{formatInr(row.tam_inr)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-100">{formatInr(row.won_inr)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        <span className={Number(row.share_ratio) > 0 ? 'text-teal-300' : 'text-slate-500'}>
                          {formatPct(row.share_ratio, 2)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{formatPct(row.win_rate, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: wins + untapped */}
        <div className="grid grid-cols-1 gap-4 xl:col-span-5">
          <section
            aria-labelledby="recent-wins-heading"
            className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <h2 id="recent-wins-heading" className="mb-3 text-sm font-semibold text-teal-300">
              Latest 3 wins
            </h2>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : topWins.length === 0 ? (
              <div className="py-6 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-400">
                  No wins recorded yet — log outcomes in intel_outcome_attribution to populate this canvas.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {topWins.map((w, i) => (
                  <li
                    key={`${w.company_id}-${i}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-100">
                        {w.waste_category || 'Unknown'} · {w.state || 'Unknown'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">closed {formatDate(w.closed_at)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-teal-300">
                      {formatInr(w.deal_size_inr)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="untapped-heading"
            className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <h2 id="untapped-heading" className="mb-3 text-sm font-semibold text-teal-300">
              Top 5 untapped pools
            </h2>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : topUntapped.length === 0 ? (
              <div className="py-6 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-400">No company intel yet — ingest sources to populate.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {topUntapped.map((u) => (
                  <li
                    key={`${u.state}-${u.waste_category}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-100">
                        {u.waste_category} · {u.state}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                        {u.in_our_pipeline} of {u.total_known} in pipeline · {formatPct(u.untapped_share, 0)} untapped
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-amber-300">
                      {u.untapped_pool}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* ─── Enrichment coverage widget ───────────────────────── */}
      {coverage.length > 0 && (
        <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-semibold text-teal-300">AI enrichment coverage by state</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Companies</th>
                  <th className="py-2 pr-4">Classification</th>
                  <th className="py-2 pr-4">Products</th>
                  <th className="py-2 pr-4">Briefs</th>
                  <th className="py-2">Hot/Warm</th>
                </tr>
              </thead>
              <tbody>
                {coverage.slice(0, 10).map((row) => (
                  <tr key={row.state} className="border-b border-slate-800/40">
                    <td className="py-2 pr-4 font-medium text-slate-200">{row.state}</td>
                    <td className="py-2 pr-4 tabular-nums text-slate-400">{row.total_companies}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.round((row.classification_pct || 0) * 100)}%` }} />
                        </div>
                        <span className="text-slate-400 tabular-nums">{Math.round((row.classification_pct || 0) * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((row.product_enrichment_pct || 0) * 100)}%` }} />
                        </div>
                        <span className="text-slate-400 tabular-nums">{Math.round((row.product_enrichment_pct || 0) * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.round((row.brief_coverage_pct || 0) * 100)}%` }} />
                        </div>
                        <span className="text-slate-400 tabular-nums">{Math.round((row.brief_coverage_pct || 0) * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-2 tabular-nums text-amber-300">{row.hot_warm_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── Footer strip — last refreshed + actions ──────────── */}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-400">
        <span>
          Last refreshed{' '}
          <span className="tabular-nums text-slate-200">
            {payload?.generated_at ? formatLastRefreshed(payload.generated_at) : '—'}
          </span>
        </span>
        <button
          type="button"
          disabled
          title="Phase 5 — wires top play to crm_deals"
          className="cursor-not-allowed rounded-md border border-slate-800 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-500"
        >
          Push best play to CRM (Phase 5)
        </button>
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
