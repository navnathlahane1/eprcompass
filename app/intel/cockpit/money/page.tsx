'use client';

// Canvas 2 — Where the money goes. Backed by GET /intel/cockpit/money
// (penalty pulse + recycler capacity balance). Tokens follow exec-cockpit skill.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';
import MetricOwnerBar from '../_components/MetricOwnerBar';

type PulseRow = {
  state: string;
  waste_category: string;
  notices_last_30d: number;
  notices_prior_30d: number;
  penalty_inr_last_30d: number;
  penalty_inr_prior_30d: number;
  penalty_velocity_wow_ratio: number | null;
};

type TopPulseRow = PulseRow & { delta_inr: number };

type BalanceRow = {
  state: string;
  demand_target_mt: number;
  supply_capacity_mt: number;
  recycler_count: number;
  capacity_balance_mt: number;
  supply_demand_ratio: number | null;
  balance_band: 'deficit' | 'surplus' | 'balanced' | 'no-demand';
};

type CockpitPayload = {
  headline: {
    label: string;
    penalty_inr_last_30d: number;
    penalty_inr_prior_30d: number;
    velocity_ratio: number | null;
  };
  supporting: {
    pulse_by_segment: PulseRow[];
    top_5_pulses: TopPulseRow[];
    recycler_capacity_balance: BalanceRow[];
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

function formatMt(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)}k MT`;
  return `${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} MT`;
}

function formatPctSigned(ratio: number | null | undefined, decimals = 1): string {
  if (ratio == null) return '—';
  const pct = Number(ratio) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(decimals)}%`;
}

function formatLastRefreshed(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function bandColor(band: BalanceRow['balance_band']) {
  switch (band) {
    case 'deficit':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    case 'surplus':
      return 'border-teal-500/30 bg-teal-500/10 text-teal-200';
    case 'balanced':
      return 'border-slate-700 bg-slate-800/40 text-slate-200';
    default:
      return 'border-slate-800 bg-slate-900/40 text-slate-500';
  }
}

function bandLabel(band: BalanceRow['balance_band']) {
  switch (band) {
    case 'deficit':
      return 'Deficit · pricing-power signal';
    case 'surplus':
      return 'Surplus · partnership / M&A target';
    case 'balanced':
      return 'Balanced';
    default:
      return 'No demand';
  }
}

export default function CockpitMoneyPage() {
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
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/money`, {
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
  const topPulses = payload?.supporting.top_5_pulses ?? [];
  const balance = payload?.supporting.recycler_capacity_balance ?? [];

  const deficitStateCount = useMemo(
    () => balance.filter((r) => r.balance_band === 'deficit').length,
    [balance],
  );
  const surplusStateCount = useMemo(
    () => balance.filter((r) => r.balance_band === 'surplus').length,
    [balance],
  );

  const velocityIsUp = headline?.velocity_ratio != null && headline.velocity_ratio > 0;

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
              <span className="text-[11px] text-slate-400">Money</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Where the money goes</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Regulator-action velocity (leading) and battery recycler supply gaps (M&amp;A signal). Rolling 30 days.
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

        {/* Headline metric — penalty velocity */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className={`rounded-xl border p-5 md:col-span-1 ${
              velocityIsUp
                ? 'border-amber-400/30 bg-amber-500/10'
                : 'border-teal-400/30 bg-teal-500/10'
            }`}
          >
            <div className={`mb-2.5 h-0.5 w-7 rounded-full ${velocityIsUp ? 'bg-amber-400' : 'bg-teal-400'}`} />
            <p
              className={`text-[10px] uppercase tracking-[0.2em] ${
                velocityIsUp ? 'text-amber-200' : 'text-teal-200'
              }`}
            >
              Penalty velocity · 30d vs prior
            </p>
            <p
              className={`mt-2 font-display text-5xl font-bold tracking-tight tabular-nums ${
                velocityIsUp ? 'text-amber-100' : 'text-teal-100'
              }`}
            >
              {loading ? '—' : formatPctSigned(headline?.velocity_ratio, 1)}
            </p>
            <p className="mt-2 text-xs text-slate-300">
              {loading
                ? 'Loading…'
                : `${formatInr(headline?.penalty_inr_last_30d)} last 30d · ${formatInr(headline?.penalty_inr_prior_30d)} prior`}
            </p>
            <MetricOwnerBar metricId="penalty_velocity" />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-amber-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">States in deficit</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-200">
              {loading ? '—' : deficitStateCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">battery recycling — pricing power for us</p>
            <MetricOwnerBar metricId="recycler_deficit" />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">States in surplus</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-teal-200">
              {loading ? '—' : surplusStateCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">candidates for partnership / capacity lock-in</p>
            <MetricOwnerBar metricId="recycler_surplus" />
          </div>
        </div>
      </section>

      <PlatformPulseBanner />

      {/* ─── Two-column body ──────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left: top 5 hottest pulses */}
        <section
          aria-labelledby="top-pulses-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-7"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="top-pulses-heading" className="text-sm font-semibold text-teal-300">
              Hottest 30-day pulses
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              ranked by ₹ delta vs prior 30d
            </p>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : topPulses.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm text-slate-400">
                No notice data in the last 60 days — once intel_notices has dated rows, this surfaces the fastest-growing penalty segments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3 text-right">₹ last 30d</th>
                    <th className="py-2 pr-3 text-right">₹ prior 30d</th>
                    <th className="py-2 pr-3 text-right">Ratio</th>
                    <th className="py-2 pr-3 text-right">Notices</th>
                  </tr>
                </thead>
                <tbody>
                  {topPulses.map((row) => {
                    const noticesDelta = row.notices_last_30d - row.notices_prior_30d;
                    const ratioIsUp = (row.penalty_velocity_wow_ratio ?? 0) > 0;
                    return (
                      <tr
                        key={`${row.state}-${row.waste_category}`}
                        className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/40"
                      >
                        <td className="py-2 pr-3 text-slate-200">{row.state}</td>
                        <td className="py-2 pr-3 text-slate-300">{row.waste_category}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-100">
                          {formatInr(row.penalty_inr_last_30d)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-400">
                          {formatInr(row.penalty_inr_prior_30d)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          <span className={ratioIsUp ? 'text-amber-300' : 'text-teal-300'}>
                            {formatPctSigned(row.penalty_velocity_wow_ratio, 0)}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-300">
                          {noticesDelta > 0 ? `+${noticesDelta}` : noticesDelta}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: recycler capacity balance */}
        <section
          aria-labelledby="balance-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="balance-heading" className="text-sm font-semibold text-teal-300">
              Battery recycler balance
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              deficits first
            </p>
          </div>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : balance.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm text-slate-400">
                No battery recycler / fact-sheet rows yet — populate intel_battery_recycler_profiles and intel_company_fact_sheets to surface gaps.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {balance.map((row) => (
                <li
                  key={row.state}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${bandColor(row.balance_band)}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">{row.state}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300 tabular-nums">
                      {formatMt(row.supply_capacity_mt)} supply / {formatMt(row.demand_target_mt)} demand · {row.recycler_count} recycler{row.recycler_count === 1 ? '' : 's'}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest opacity-80">
                      {bandLabel(row.balance_band)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {formatMt(row.capacity_balance_mt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
