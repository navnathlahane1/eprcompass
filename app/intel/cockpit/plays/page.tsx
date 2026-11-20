'use client';

// Canvas 4 — What to do next. Backed by GET /intel/cockpit/plays
// (rule-based scorer over the Phase 1+2 marts).

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';

type PlayKind = 'untapped_segment' | 'recovery' | 'partnership_lock_in' | 'velocity_hot' | 'high_epr_opportunity';

type Play = {
  kind: PlayKind;
  title: string;
  why: string;
  state: string | null;
  waste_category: string | null;
  company_id: string | null;
  projected_inr: number;
  confidence: number;
  score: number;
};

type CockpitPayload = {
  headline: {
    label: string;
    total_projected_inr: number;
    high_confidence_count: number;
    kind_breakdown: Partial<Record<PlayKind, number>>;
  };
  supporting: { plays: Play[] };
  drill_targets: Record<string, string>;
  generated_at: string;
};

const KIND_LABEL: Record<PlayKind, string> = {
  untapped_segment: 'Open practice',
  recovery: 'Recover stalled',
  partnership_lock_in: 'Lock in supply',
  velocity_hot: 'Hot regulator',
  high_epr_opportunity: 'High EPR opp'
};

const KIND_TONE: Record<PlayKind, string> = {
  untapped_segment: 'border-teal-400/40 bg-teal-500/10 text-teal-200',
  recovery: 'border-rose-400/40 bg-rose-500/15 text-rose-200',
  partnership_lock_in: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  velocity_hot: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  high_epr_opportunity: 'border-purple-400/40 bg-purple-500/10 text-purple-200'
};

function formatInr(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatPct(ratio: number | null | undefined, decimals = 0): string {
  if (ratio == null) return '—';
  return `${(Number(ratio) * 100).toFixed(decimals)}%`;
}

function formatLastRefreshed(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function confidenceTone(c: number): string {
  if (c >= 0.6) return 'text-teal-300';
  if (c >= 0.4) return 'text-amber-300';
  return 'text-slate-400';
}

export default function CockpitPlaysPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CockpitPayload | null>(null);
  const [filterKind, setFilterKind] = useState<PlayKind | 'all'>('all');

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
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/plays`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
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

  // Per-row "Add to to-do" state — tracks which play index is in flight or done.
  const [pushBusy, setPushBusy] = useState<number | null>(null);
  const [pushedIdx, setPushedIdx] = useState<Record<number, boolean>>({});

  const addPlayToTasks = useCallback(
    async (play: Play, index: number) => {
      setPushBusy(index);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Not signed in.');
        const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/tasks`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            title: play.title,
            detail: play.why,
            play_kind: play.kind,
            play_payload: play,
            state: play.state,
            waste_category: play.waste_category,
            company_id: play.company_id,
            projected_inr: play.projected_inr,
            confidence: play.confidence,
            priority: play.confidence >= 0.6 ? 'p1' : 'p2'
          })
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        setPushedIdx((prev) => ({ ...prev, [index]: true }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to tasks');
      } finally {
        setPushBusy(null);
      }
    },
    []
  );

  const headline = payload?.headline;
  const plays = payload?.supporting.plays ?? [];
  const filtered = useMemo(
    () => (filterKind === 'all' ? plays : plays.filter((p) => p.kind === filterKind)),
    [plays, filterKind]
  );
  const kindBreakdown = headline?.kind_breakdown ?? {};

  const filterButtons: Array<{ key: PlayKind | 'all'; label: string }> = useMemo(() => {
    return [
      { key: 'all', label: `All (${plays.length})` },
      ...(Object.keys(KIND_LABEL) as PlayKind[]).map((k) => ({
        key: k,
        label: `${KIND_LABEL[k]} (${kindBreakdown[k] ?? 0})`
      }))
    ];
  }, [plays.length, kindBreakdown]);

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
              <span className="text-[11px] text-slate-400">Plays</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What to do next</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Top 10 plays ranked by{' '}
              <span className="text-slate-100">projected revenue × confidence</span> across untapped segments,
              stalled-deal recovery, recycler partnerships, and velocity-hot regulator activity.
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
          <div className="rounded-xl border border-teal-400/30 bg-teal-500/10 p-5">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
            <p className="text-[11px] uppercase tracking-widest text-teal-200">Total projected revenue</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-teal-100 tabular-nums">
              {loading ? '—' : formatInr(headline?.total_projected_inr)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">if every recommended play executes</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-slate-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">High-confidence plays</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-200">
              {loading ? '—' : headline?.high_confidence_count ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">confidence &ge; 50%</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-slate-400" />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Play kinds active</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-200">
              {loading ? '—' : Object.keys(kindBreakdown).length}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">distinct strategy levers</p>
          </div>
        </div>
      </section>

      <PlatformPulseBanner />

      {/* ─── Filter chips ─────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {filterButtons.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setFilterKind(b.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              filterKind === b.key
                ? 'border-teal-400/50 bg-teal-500/15 text-teal-200'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* ─── Ranked plays list ────────────────────────────────── */}
      <section className="relative mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        {loading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="mt-2 text-sm text-slate-400">
              No plays meet the threshold yet — populate intel_companies, intel_notices, and
              intel_battery_recycler_profiles to unlock untapped-segment, velocity-hot, and partnership plays.
              Pipeline records updated &gt; 60 days ago trigger recovery plays.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {filtered.map((p, i) => (
              <li
                key={`${p.kind}-${i}`}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TONE[p.kind]}`}
                      >
                        {KIND_LABEL[p.kind]}
                      </span>
                      {p.state ? (
                        <span className="text-[11px] text-slate-400">{p.state}</span>
                      ) : null}
                      {p.waste_category ? (
                        <span className="text-[11px] text-slate-400">· {p.waste_category}</span>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold text-slate-100">{p.title}</h3>
                    <p className="mt-1 text-xs text-slate-300">{p.why}</p>
                    {p.company_id ? (
                      <a
                        href={`/intel/companies/${p.company_id}`}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-teal-200"
                      >
                        View company →
                      </a>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-bold tabular-nums text-slate-100">
                      {formatInr(p.projected_inr)}
                    </p>
                    <p className={`mt-0.5 text-[11px] font-semibold tabular-nums ${confidenceTone(p.confidence)}`}>
                      conf {formatPct(p.confidence)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-slate-500 tabular-nums">
                      score {(p.score / 1e5).toFixed(1)}
                    </p>
                    <button
                      type="button"
                      onClick={() => addPlayToTasks(p, i)}
                      disabled={pushBusy === i || pushedIdx[i]}
                      className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed ${
                        pushedIdx[i]
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                          : 'border-teal-400/30 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20'
                      }`}
                    >
                      {pushedIdx[i] ? (
                        <>
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          added
                        </>
                      ) : pushBusy === i ? 'adding…' : '+ to-do'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-400">
        <span>
          Last refreshed{' '}
          <span className="tabular-nums text-slate-200">
            {payload?.generated_at ? formatLastRefreshed(payload.generated_at) : '—'}
          </span>
        </span>
        <Link
          href="/intel/cockpit/tasks"
          className="rounded-md border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-teal-200 transition hover:bg-teal-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          View to-do list →
        </Link>
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
