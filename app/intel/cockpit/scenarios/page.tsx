'use client';

// Canvas 5 — Scenario lab. Fetches the market-share mart once, then runs
// closed-form forecasts client-side as the user moves sliders.
// Model:
//   reach          = investment_inr / cost_per_qualified_lead
//   qualified      = reach × qualify_rate
//   wins           = qualified × win_rate (from current SOM data per segment)
//   revenue        = wins × avg_deal_size (from current SOM data per segment)
//   share_after    = (won_inr + revenue) / tam_inr
//   payback_months = investment_inr / (revenue / horizon_months)

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import { normalizeState } from '@/lib/indiaGeo';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';

type ShareRow = {
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

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

// Tunables — visible in the UI for transparency.
const COST_PER_QUALIFIED_LEAD = 25_000;        // ₹ spent to acquire one qualified lead
const QUALIFY_RATE = 0.4;                      // share of reached prospects that qualify
const FALLBACK_WIN_RATE = 0.25;                // used when segment has no historical wins/losses
const FALLBACK_AVG_DEAL_INR = 350_000;         // used when segment has no historical wins
const HORIZON_MONTHS_OPTIONS = [6, 12, 18, 24];

function formatInr(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function formatPct(ratio: number | null | undefined, decimals = 1): string {
  if (ratio == null || !Number.isFinite(ratio)) return '—';
  return `${(Number(ratio) * 100).toFixed(decimals)}%`;
}

export default function CockpitScenariosPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ShareRow[]>([]);

  // Sliders / inputs
  const [state, setState] = useState<string>('__all');
  const [category, setCategory] = useState<string>('__all');
  const [investmentLakhs, setInvestmentLakhs] = useState<number>(50);
  const [horizonMonths, setHorizonMonths] = useState<number>(12);

  const load = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Not signed in. Please log in via /intel/login.');
        setLoadState('error');
        return;
      }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/marts/market-share`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRows(((data.rows || []) as ShareRow[]).map((r) => ({ ...r, state: normalizeState(r.state) ?? r.state })));
      setLoadState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market-share mart');
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const states = useMemo(
    () => Array.from(new Set(rows.map((r) => r.state))).sort(),
    [rows]
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.waste_category))).sort(),
    [rows]
  );

  // Filter the mart to selected scope, then derive scenario inputs from history.
  const scenario = useMemo(() => {
    const inScope = rows.filter(
      (r) =>
        (state === '__all' || r.state === state) &&
        (category === '__all' || r.waste_category === category)
    );
    const tamInr = inScope.reduce((s, r) => s + Number(r.tam_inr || 0), 0);
    const wonInr = inScope.reduce((s, r) => s + Number(r.won_inr || 0), 0);
    const wonCount = inScope.reduce((s, r) => s + Number(r.deals_won || 0), 0);
    const lostCount = inScope.reduce((s, r) => s + Number(r.deals_lost || 0), 0);

    const historicalWinRate =
      wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : FALLBACK_WIN_RATE;
    const historicalAvgDealInr = wonCount > 0 ? wonInr / wonCount : FALLBACK_AVG_DEAL_INR;
    const currentShare = tamInr > 0 ? wonInr / tamInr : 0;

    const investmentInr = investmentLakhs * 1_00_000;
    const reach = investmentInr / COST_PER_QUALIFIED_LEAD;
    const qualified = reach * QUALIFY_RATE;
    const wins = qualified * historicalWinRate;
    const projectedRevenue = wins * historicalAvgDealInr;
    const projectedShareAfter = tamInr > 0 ? (wonInr + projectedRevenue) / tamInr : 0;
    const paybackMonths =
      projectedRevenue > 0 ? investmentInr / (projectedRevenue / horizonMonths) : null;
    const roi = investmentInr > 0 ? (projectedRevenue - investmentInr) / investmentInr : 0;

    return {
      inScopeRows: inScope.length,
      tamInr,
      wonInr,
      currentShare,
      historicalWinRate,
      historicalAvgDealInr,
      investmentInr,
      reach,
      qualified,
      wins,
      projectedRevenue,
      projectedShareAfter,
      paybackMonths,
      roi
    };
  }, [rows, state, category, investmentLakhs, horizonMonths]);

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* ─── Canvas header ────────────────────────────────────── */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <Link href="/intel/cockpit" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Cockpit</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Scenarios</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Scenario lab</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Project incremental revenue &amp; market share for a chosen investment, geography, and category. Win rate
              and avg deal size are taken from your historical SOM; tunables below the projection panel.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh mart
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}
      </section>

      <PlatformPulseBanner />

      {/* ─── Inputs + projection ──────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Inputs */}
        <section
          aria-labelledby="inputs-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-5"
        >
          <h2 id="inputs-heading" className="mb-4 text-sm font-semibold text-teal-300">
            Inputs
          </h2>

          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">State</span>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={loadState !== 'ready'}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none disabled:opacity-50"
              >
                <option value="__all">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-300">Waste category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loadState !== 'ready'}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none disabled:opacity-50"
              >
                <option value="__all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Investment</span>
                <span className="tabular-nums text-teal-300">
                  {formatInr(investmentLakhs * 1_00_000)}
                </span>
              </span>
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={investmentLakhs}
                onChange={(e) => setInvestmentLakhs(Number(e.target.value))}
                className="mt-2 w-full accent-teal-400"
              />
              <span className="mt-1 block text-[10px] text-slate-500 tabular-nums">
                ₹5L – ₹5Cr · steps of ₹5L
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-300">Horizon</span>
              <div className="mt-2 flex flex-wrap gap-1">
                {HORIZON_MONTHS_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setHorizonMonths(m)}
                    className={`rounded-md border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      horizonMonths === m
                        ? 'border-teal-400/50 bg-teal-500/15 text-teal-200'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* Tunables — visible for transparency */}
          <details className="mt-6 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
            <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-slate-300">
              Model assumptions
            </summary>
            <ul className="mt-2 space-y-1 tabular-nums">
              <li>Cost per qualified lead: <span className="text-slate-200">{formatInr(COST_PER_QUALIFIED_LEAD)}</span></li>
              <li>Qualify rate: <span className="text-slate-200">{formatPct(QUALIFY_RATE)}</span></li>
              <li>
                Win rate: <span className="text-slate-200">{formatPct(scenario.historicalWinRate)}</span>{' '}
                (from SOM history when present, else {formatPct(FALLBACK_WIN_RATE)})
              </li>
              <li>
                Avg deal: <span className="text-slate-200">{formatInr(scenario.historicalAvgDealInr)}</span>{' '}
                (from SOM history when present, else {formatInr(FALLBACK_AVG_DEAL_INR)})
              </li>
            </ul>
          </details>
        </section>

        {/* Projection */}
        <section
          aria-labelledby="projection-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-7"
        >
          <h2 id="projection-heading" className="mb-4 text-sm font-semibold text-teal-300">
            Projection
          </h2>

          {loadState === 'loading' ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : loadState === 'error' ? (
            <p className="text-sm text-rose-300">Can&apos;t compute scenarios without the market-share mart.</p>
          ) : scenario.tamInr === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm text-slate-400">
                Selected scope has zero TAM. Populate intel_companies, intel_notices, and intel_market_rates
                to enable a meaningful projection.
              </p>
            </div>
          ) : (
            <>
              {/* Headline projected revenue */}
              <div className="rounded-xl border border-teal-400/30 bg-teal-500/10 p-5">
                <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
                <p className="text-[11px] uppercase tracking-widest text-teal-200">Projected new revenue</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-teal-100 tabular-nums">
                  {formatInr(scenario.projectedRevenue)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  share moves from{' '}
                  <span className="tabular-nums text-slate-100">{formatPct(scenario.currentShare, 2)}</span>{' '}
                  to <span className="tabular-nums text-teal-200">{formatPct(scenario.projectedShareAfter, 2)}</span>{' '}
                  over {horizonMonths} months
                </p>
              </div>

              {/* Supporting tiles */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Reach</p>
                  <p className="mt-1 text-base font-semibold tabular-nums text-slate-100">
                    {Math.round(scenario.reach).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">qualified-lead-equivalents</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Wins</p>
                  <p className="mt-1 text-base font-semibold tabular-nums text-slate-100">
                    {Math.round(scenario.wins)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">deals closed</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Payback</p>
                  <p className="mt-1 text-base font-semibold tabular-nums text-slate-100">
                    {scenario.paybackMonths != null && Number.isFinite(scenario.paybackMonths)
                      ? `${scenario.paybackMonths.toFixed(1)}m`
                      : '—'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">months to recoup</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">ROI</p>
                  <p
                    className={`mt-1 text-base font-semibold tabular-nums ${
                      scenario.roi >= 0 ? 'text-teal-300' : 'text-rose-300'
                    }`}
                  >
                    {scenario.roi >= 0 ? '+' : ''}
                    {(scenario.roi * 100).toFixed(0)}%
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{`vs ${formatInr(scenario.investmentInr)} spend`}</p>
                </div>
              </div>

              {/* Scope summary */}
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                <span className="text-slate-400">In scope: </span>
                <span className="tabular-nums text-slate-100">{scenario.inScopeRows}</span> segment row
                {scenario.inScopeRows === 1 ? '' : 's'} · TAM{' '}
                <span className="tabular-nums text-slate-100">{formatInr(scenario.tamInr)}</span> · already won{' '}
                <span className="tabular-nums text-slate-100">{formatInr(scenario.wonInr)}</span>
              </div>
            </>
          )}
        </section>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-400">
        <span>
          Mart:{' '}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
            v_intel_market_share
          </code>{' '}
          · projections computed client-side
        </span>
        <button
          type="button"
          disabled
          title="Phase 5 — save scenario for board discussion"
          className="cursor-not-allowed rounded-md border border-slate-800 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-500"
        >
          Save scenario (Phase 5)
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
