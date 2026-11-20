'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';

type Summary = {
  total_deals: number; won_count: number; lost_count: number; stalled_count: number;
  win_rate: number; total_won_inr: number; avg_deal_size_inr: number; avg_time_to_close_days: number;
};
type SegmentRow = { waste_category: string; state: string; won: number; lost: number; stalled: number; won_inr: number; total: number; win_rate: number | null };
type ReasonRow = { reason: string; count: number };
type RecentOutcome = { id: string; company_name: string | null; outcome: string; deal_size_inr: number; time_to_close_days: number; waste_category: string; state: string; closed_at: string };
type TaskSummary = { open: number; in_progress: number; blocked: number; done: number; cancelled: number };

function formatInr(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const cfg = outcome === 'Won' ? 'border-teal-600/50 bg-teal-500/10 text-teal-200'
    : outcome === 'Lost' ? 'border-rose-600/50 bg-rose-500/10 text-rose-200'
    : 'border-slate-600 bg-slate-800/50 text-slate-400';
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${cfg}`}>{outcome}</span>;
}

export default function DealsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [lostReasons, setLostReasons] = useState<ReasonRow[]>([]);
  const [competitors, setCompetitors] = useState<ReasonRow[]>([]);
  const [recent, setRecent] = useState<RecentOutcome[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/deals`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setSegments(data.segment_breakdown || []);
      setLostReasons(data.lost_reasons || []);
      setCompetitors(data.lost_to_competitors || []);
      setRecent(data.recent_outcomes || []);
      setTaskSummary(data.task_summary);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxWonInr = Math.max(1, ...segments.map(s => Number(s.won_inr || 0)));

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
              <span className="text-[11px] text-slate-400">Deals</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Deal Analytics</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">Win/loss breakdown, funnel analytics, segment performance, and loss attribution.</p>
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
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: 'Total Deals', value: loading ? '—' : summary?.total_deals ?? 0, accent: 'text-slate-100', color: 'slate' },
          { label: 'Won', value: loading ? '—' : summary?.won_count ?? 0, accent: 'text-teal-200', color: 'teal' },
          { label: 'Lost', value: loading ? '—' : summary?.lost_count ?? 0, accent: 'text-rose-200', color: 'rose' },
          { label: 'Stalled', value: loading ? '—' : summary?.stalled_count ?? 0, accent: 'text-amber-200', color: 'amber' },
          { label: 'Win Rate', value: loading ? '—' : `${((summary?.win_rate || 0) * 100).toFixed(0)}%`, accent: 'text-teal-200', color: 'teal' },
          { label: 'Revenue Won', value: loading ? '—' : formatInr(summary?.total_won_inr), accent: 'text-teal-200', color: 'teal' },
          { label: 'Avg Deal', value: loading ? '—' : formatInr(summary?.avg_deal_size_inr), accent: 'text-slate-100', color: 'slate' },
          { label: 'Avg Cycle', value: loading ? '—' : summary?.avg_time_to_close_days ? `${Math.round(summary.avg_time_to_close_days)}d` : '—', accent: 'text-slate-100', color: 'slate' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className={`mb-2.5 h-0.5 w-7 rounded-full bg-${k.color}-400`} />
            <p className="text-[11px] uppercase tracking-widest text-slate-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${k.accent}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">

        {/* Segment breakdown */}
        <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-7">
          <h2 className="mb-4 text-sm font-semibold text-teal-300">Win Revenue by Segment</h2>
          {loading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : segments.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm text-slate-500">No deal outcomes recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {segments.map((s, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-200">{s.waste_category || '—'} · {s.state || 'All India'}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-teal-300 tabular-nums">{formatInr(s.won_inr)}</span>
                      {s.win_rate != null && <span className="text-slate-400 tabular-nums">{(s.win_rate * 100).toFixed(0)}% WR</span>}
                      <span className="text-slate-500">{s.won}W/{s.lost}L</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.round((Number(s.won_inr || 0) / maxWonInr) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 xl:col-span-5">
          {/* Task funnel */}
          {taskSummary && (
            <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-teal-300">Task Funnel</h2>
                <Link href="/intel/cockpit/tasks" className="text-[10px] text-slate-400 hover:text-teal-300">Manage →</Link>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { k: 'open', label: 'Open', color: 'text-slate-200' },
                  { k: 'in_progress', label: 'Active', color: 'text-amber-200' },
                  { k: 'blocked', label: 'Blocked', color: 'text-rose-200' },
                  { k: 'done', label: 'Done', color: 'text-teal-200' },
                  { k: 'cancelled', label: 'Cancelled', color: 'text-slate-500' },
                ].map(({ k, label, color }) => (
                  <div key={k} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
                    <p className={`text-lg font-bold tabular-nums ${color}`}>{taskSummary[k as keyof TaskSummary]}</p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Loss attribution */}
          <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-3 text-sm font-semibold text-rose-300">Loss Attribution</h2>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : (
              <>
                {lostReasons.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">Lost Reasons</p>
                    <div className="space-y-1">
                      {lostReasons.slice(0, 5).map(r => (
                        <div key={r.reason} className="flex items-center justify-between text-xs">
                          <span className="truncate text-slate-300">{r.reason}</span>
                          <span className="ml-2 shrink-0 tabular-nums text-rose-300">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {competitors.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">Lost To</p>
                    <div className="space-y-1">
                      {competitors.slice(0, 4).map(c => (
                        <div key={c.reason} className="flex items-center justify-between text-xs">
                          <span className="truncate text-slate-300">{c.reason}</span>
                          <span className="ml-2 shrink-0 tabular-nums text-amber-300">{c.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lostReasons.length === 0 && competitors.length === 0 && (
                  <div className="py-6 text-center">
                    <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="mt-2 text-sm text-slate-500">No loss data recorded yet.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Recent outcomes */}
      <section className="relative mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="mb-3 text-sm font-semibold text-teal-300">Recent Outcomes</h2>
        {loading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="mt-2 text-sm text-slate-500">No outcomes recorded yet. Close your first deal via the Tasks board.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Outcome</th>
                  <th className="py-2 pr-4">Deal Size</th>
                  <th className="py-2 pr-4">Cycle</th>
                  <th className="py-2 pr-4">Segment</th>
                  <th className="py-2">Closed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} className="border-b border-slate-900/80 hover:bg-slate-800/20 transition-colors">
                    <td className="py-2 pr-4 font-semibold text-slate-100">{r.company_name || '—'}</td>
                    <td className="py-2 pr-4"><OutcomeBadge outcome={r.outcome} /></td>
                    <td className="py-2 pr-4 tabular-nums text-slate-200">{formatInr(r.deal_size_inr)}</td>
                    <td className="py-2 pr-4 tabular-nums text-slate-400">{r.time_to_close_days ? `${r.time_to_close_days}d` : '—'}</td>
                    <td className="py-2 pr-4 text-slate-400">{r.waste_category} · {r.state}</td>
                    <td className="py-2 tabular-nums text-slate-500">{r.closed_at ? new Date(r.closed_at).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
        <Link href="/intel/cockpit" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to Cockpit
        </Link>
      </div>
    </div>
  );
}
