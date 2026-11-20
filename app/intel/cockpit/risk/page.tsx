'use client';

// Canvas 3 — What's at risk. Backed by GET /intel/cockpit/risk
// (stalled pipeline + expiring authorizations + recent losses).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';
import MetricOwnerBar from '../_components/MetricOwnerBar';

type StalledRow = {
  id: string;
  company_id: string;
  urgency_tier: string | null;
  estimated_deal_size_inr: number | null;
  warmness_stage: string | null;
  updated_at: string;
  days_stalled: number;
};

type ExpiryRow = {
  company_id: string;
  recycler_name: string | null;
  kind: 'cpcb' | 'state';
  identifier: string | null;
  expires_on: string | null;
  days_until_expiry: number | null;
};

type LostRow = {
  id: string;
  company_id: string;
  deal_size_inr: number | null;
  waste_category: string | null;
  state: string | null;
  lost_reason: string | null;
  lost_to_competitor: string | null;
  closed_at: string | null;
};

type CockpitPayload = {
  headline: {
    label: string;
    stalled_count: number;
    oldest_days_stalled: number;
    stalled_inr_at_risk: number;
  };
  supporting: {
    stalled_deals: StalledRow[];
    expiring_authorizations: ExpiryRow[];
    expiring_within_30d: number;
    losses_last_90d: LostRow[];
    total_lost_inr_90d: number;
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatLastRefreshed(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function urgencyBadge(tier: string | null) {
  if (tier === 'hot') return 'border-rose-500/40 bg-rose-500/15 text-rose-200';
  if (tier === 'warm') return 'border-amber-500/40 bg-amber-500/15 text-amber-200';
  return 'border-slate-700 bg-slate-800/50 text-slate-300';
}

function expiryTone(days: number | null) {
  if (days == null) return 'text-slate-400';
  if (days <= 30) return 'text-rose-300';
  if (days <= 60) return 'text-amber-300';
  return 'text-slate-200';
}

export default function CockpitRiskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CockpitPayload | null>(null);

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
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/risk`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CockpitPayload & { ok: boolean };
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cockpit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const headline = payload?.headline;
  const stalled = payload?.supporting.stalled_deals ?? [];
  const expiries = payload?.supporting.expiring_authorizations ?? [];
  const losses = payload?.supporting.losses_last_90d ?? [];

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
              <span className="text-[11px] text-slate-400">Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What&apos;s at risk</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Stalled pipeline, expiring authorizations in the recycler network, and recent losses to chase explanations for.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

        {/* Headline + KPI tiles */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-rose-400" />
            <p className="text-[11px] uppercase tracking-widest text-rose-200">Deals stalled &gt; 30 days</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-rose-100 tabular-nums">
              {loading ? '—' : headline?.stalled_count ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {loading
                ? 'Loading…'
                : `${formatInr(headline?.stalled_inr_at_risk)} at risk · oldest ${headline?.oldest_days_stalled ?? 0}d`}
            </p>
            <MetricOwnerBar metricId="stalled_deals" />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-amber-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Authorizations expiring &le; 30d</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-200">
              {loading ? '—' : payload?.supporting.expiring_within_30d ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">recycler CPCB / state authorizations in network</p>
            <MetricOwnerBar metricId="expiring_auth" />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-slate-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Lost in last 90 days</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-200">
              {loading ? '—' : losses.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{formatInr(payload?.supporting.total_lost_inr_90d)} of revenue lost</p>
          </div>
        </div>
      </section>

      <PlatformPulseBanner />

      {/* ─── Body grid ────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left: stalled deals */}
        <section
          aria-labelledby="stalled-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-7"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="stalled-heading" className="text-sm font-semibold text-teal-300">
              Stalled deals
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">oldest first · top 10</p>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : stalled.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-teal-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <p className="mt-2 text-sm text-slate-400">
                No stalled deals — pipeline records are either closed or have been touched in the last 30 days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Company</th>
                    <th className="py-2 pr-3">Stage</th>
                    <th className="py-2 pr-3">Urgency</th>
                    <th className="py-2 pr-3 text-right">Deal size</th>
                    <th className="py-2 pr-3 text-right">Stalled</th>
                  </tr>
                </thead>
                <tbody>
                  {stalled.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/40"
                    >
                      <td className="py-2 pr-3">
                        <a
                          href={`/intel/companies/${row.company_id}`}
                          className="font-mono text-[11px] text-teal-300 hover:text-teal-200"
                        >
                          {row.company_id.slice(0, 8)}…
                        </a>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">{row.warmness_stage || '—'}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${urgencyBadge(row.urgency_tier)}`}
                        >
                          {row.urgency_tier || 'unranked'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-100">
                        {formatInr(row.estimated_deal_size_inr)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-rose-300">
                        {row.days_stalled}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: expiring authorizations */}
        <section
          aria-labelledby="expiry-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="expiry-heading" className="text-sm font-semibold text-teal-300">
              Expiring authorizations
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">next 90 days</p>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : expiries.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-teal-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <p className="mt-2 text-sm text-slate-400">
                No CPCB or state authorizations expiring in the next 90 days for recyclers in the network.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {expiries.map((row, i) => (
                <li
                  key={`${row.company_id}-${row.kind}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">
                      {row.recycler_name || row.company_id.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-300 mr-1.5">
                        {row.kind}
                      </span>
                      expires {formatDate(row.expires_on)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${expiryTone(row.days_until_expiry)}`}>
                    {row.days_until_expiry != null ? `${row.days_until_expiry}d` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ─── Losses last 90d ─────────────────────────────────── */}
      <section
        aria-labelledby="losses-heading"
        className="relative mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="losses-heading" className="text-sm font-semibold text-teal-300">
            Losses (last 90 days)
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">most recent first</p>
        </div>
        {loading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : losses.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="mx-auto h-8 w-8 text-teal-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p className="mt-2 text-sm text-slate-400">
              No losses recorded in the last 90 days — log lost outcomes via intel_outcome_attribution so root causes can be analysed.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {losses.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">
                      {row.waste_category || 'Unknown'} · {row.state || 'Unknown'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">closed {formatDate(row.closed_at)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-slate-200">
                    {formatInr(row.deal_size_inr)}
                  </span>
                </div>
                {(row.lost_reason || row.lost_to_competitor) ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {row.lost_reason ? <span>Reason: <span className="text-slate-200">{row.lost_reason}</span></span> : null}
                    {row.lost_reason && row.lost_to_competitor ? ' · ' : ''}
                    {row.lost_to_competitor ? <span>to <span className="text-slate-200">{row.lost_to_competitor}</span></span> : null}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Footer strip ─────────────────────────────────────── */}
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
          title="Phase 5 — wires the most-stalled deal to a Task in admin"
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
