'use client';

/**
 * Cockpit Morning Briefing — the first thing you see when you open the cockpit.
 * Shows: tasks due soon, notice deadlines, pending review queue, recent imports,
 * companies added this week.
 */

import React from 'react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from './_components/PlatformPulseBanner';

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_on: string | null;
  assignee_user_id: string | null;
  waste_category: string | null;
  state: string | null;
  projected_inr: number | null;
};

type NoticeRow = {
  id: string;
  company_id: string | null;
  notice_type: string | null;
  authority: string | null;
  waste_category: string | null;
  deadline_date: string | null;
  penalty_inr: number | null;
};

type ReviewRow = {
  id: string;
  company_name: string | null;
  match_status: string;
  confidence_score: number | null;
  created_at: string;
};

type ImportJob = {
  id: string;
  job_status: string;
  total_rows: number;
  inserted_rows: number;
  error_rows: number;
  started_at: string | null;
};

type CompanySnap = {
  id: string;
  canonical_name: string;
  state: string | null;
  segment_tag: string | null;
  created_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function dueTone(days: number | null) {
  if (days == null) return 'text-slate-400';
  if (days < 0) return 'text-rose-300';
  if (days <= 3) return 'text-amber-300';
  if (days <= 14) return 'text-yellow-200';
  return 'text-slate-200';
}

function priorityTone(p: string) {
  if (p === 'p0') return 'border-rose-500/50 bg-rose-500/15 text-rose-200';
  if (p === 'p1') return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  if (p === 'p2') return 'border-slate-600 bg-slate-800/40 text-slate-300';
  return 'border-slate-700 bg-slate-900/30 text-slate-500';
}

function formatInr(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function statusDot(s: string): React.ReactNode {
  if (s === 'completed') return <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />;
  if (s === 'completed_with_errors') return <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />;
  if (s === 'failed') return <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />;
  if (s === 'processing') return <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CockpitBriefingPage() {
  const [tasks, setTasks]             = useState<TaskRow[]>([]);
  const [notices, setNotices]         = useState<NoticeRow[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewRow[]>([]);
  const [recentJobs, setRecentJobs]   = useState<ImportJob[]>([]);
  const [newCompanies, setNewCompanies] = useState<CompanySnap[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? `Bearer ${session.access_token}` : null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    try {
      const [tasksRes, noticesRes, reviewRes, companiesRes] = await Promise.all([
        // Tasks due in next 14 days, open/in-progress
        supabase
          .from('intel_cockpit_tasks')
          .select('id,title,status,priority,due_on,assignee_user_id,waste_category,state,projected_inr')
          .in('status', ['open', 'in_progress', 'blocked'])
          .lte('due_on', new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0])
          .order('due_on', { ascending: true })
          .limit(10),

        // Notices with deadlines in next 30 days
        supabase
          .from('intel_notices')
          .select('id,company_id,notice_type,authority,waste_category,deadline_date,penalty_inr')
          .lte('deadline_date', in30days)
          .gte('deadline_date', new Date().toISOString().split('T')[0])
          .order('deadline_date', { ascending: true })
          .limit(10),

        // Pending discovery review items
        supabase
          .from('intel_discovery_results')
          .select('id,company_name,match_status,confidence_score,created_at')
          .eq('review_required', true)
          .in('match_status', ['review', 'pending_review'])
          .order('created_at', { ascending: false })
          .limit(8),

        // Companies added this week
        supabase
          .from('intel_companies')
          .select('id,canonical_name,state,segment_tag,created_at')
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setTasks((tasksRes.data || []) as TaskRow[]);
      setNotices((noticesRes.data || []) as NoticeRow[]);
      setReviewQueue((reviewRes.data || []) as ReviewRow[]);
      setNewCompanies((companiesRes.data || []) as CompanySnap[]);

      // Separately load recent import jobs via API
      const token = await authHeader();
      if (token) {
        try {
          const jobsRes = await fetch(`${getIntelApiBaseUrl()}/api/intel/ingest/jobs?limit=5`, {
            headers: { Authorization: token },
          });
          if (jobsRes.ok) {
            const d = await jobsRes.json();
            setRecentJobs((d.jobs || []) as ImportJob[]);
          }
        } catch { /* silent */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load briefing data');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { load(); }, [load]);

  // Summary counts
  const overdueTaskCount = useMemo(
    () => tasks.filter((t) => daysUntil(t.due_on) !== null && (daysUntil(t.due_on) as number) < 0).length,
    [tasks]
  );
  const totalPenaltyAtRisk = useMemo(
    () => notices.reduce((s, n) => s + Number(n.penalty_inr || 0), 0),
    [notices]
  );

  // ── Greeting ────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 py-8">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Cockpit</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting} — here&apos;s what needs attention</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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

        {error && (
          <p className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>
        )}

        <PlatformPulseBanner />

        {/* ── 4-KPI strip ──────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tasks Due (14d)',        value: tasks.length,        accent: tasks.length > 0 ? 'text-amber-300' : 'text-slate-200',        sub: overdueTaskCount > 0 ? `${overdueTaskCount} overdue` : 'on track',   bar: 'bg-amber-400' },
            { label: 'Notice Deadlines (30d)', value: notices.length,      accent: notices.length > 0 ? 'text-rose-300' : 'text-slate-200',       sub: totalPenaltyAtRisk > 0 ? formatInr(totalPenaltyAtRisk) + ' at risk' : 'none', bar: 'bg-rose-400' },
            { label: 'Pending Reviews',         value: reviewQueue.length, accent: reviewQueue.length > 0 ? 'text-yellow-300' : 'text-slate-200', sub: 'discovery queue',                                                      bar: 'bg-yellow-400' },
            { label: 'New Companies (7d)',      value: newCompanies.length, accent: 'text-teal-300',                                               sub: 'added this week',                                                      bar: 'bg-teal-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className={`mb-2.5 h-0.5 w-7 rounded-full ${kpi.bar}`} />
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{kpi.label}</p>
              <p className={`mt-1 text-3xl font-bold tabular-nums ${kpi.accent}`}>
                {loading ? '…' : kpi.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">

          {/* ── Tasks Due Soon ──────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Tasks Due in 14 Days
              </h2>
              <Link href="/intel/cockpit/tasks" className="text-xs text-slate-400 hover:text-teal-300 transition">View all →</Link>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-center">
                <svg className="mx-auto h-8 w-8 text-teal-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p className="mt-2 text-sm font-semibold text-slate-300">All clear — no urgent tasks</p>
                <p className="mt-1 text-xs text-slate-500">
                  <Link href="/intel/cockpit/tasks" className="text-teal-400 hover:underline">Create tasks</Link> from recommended plays.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {tasks.map((t) => {
                  const days = daysUntil(t.due_on);
                  return (
                    <li key={t.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:bg-slate-800/30">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">{t.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {t.state && <span>{t.state}</span>}
                            {t.waste_category && <span>· {t.waste_category}</span>}
                            {t.projected_inr ? <span>· est {formatInr(t.projected_inr)}</span> : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityTone(t.priority)}`}>
                            {t.priority.toUpperCase()}
                          </span>
                          {t.due_on && (
                            <span className={`text-xs font-semibold tabular-nums ${dueTone(days)}`}>
                              {days === null ? '—' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ── Notice Deadlines ────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                Notice Deadlines
              </h2>
              <Link href="/intel/companies" className="text-xs text-slate-400 hover:text-teal-300 transition">Browse →</Link>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : notices.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                </svg>
                <p className="mt-2 text-sm font-semibold text-slate-300">No notice deadlines in the next 30 days</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {notices.map((n) => {
                  const days = daysUntil(n.deadline_date);
                  return (
                    <li key={n.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:bg-slate-800/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-100">
                            {n.notice_type || 'Notice'} · {n.authority || 'Authority unknown'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {n.waste_category || 'Category unknown'}
                            {n.penalty_inr ? ` · ${formatInr(n.penalty_inr)} penalty` : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold tabular-nums ${dueTone(days)}`}>
                          {days === null ? '—' : days === 0 ? 'Due today' : `${days}d`}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">Deadline: {formatDate(n.deadline_date)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ── Pending Discovery Reviews ───────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-yellow-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Pending Discovery Reviews
              </h2>
              <Link href="/intel/discovery" className="text-xs text-slate-400 hover:text-teal-300 transition">View all →</Link>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : reviewQueue.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-center">
                <svg className="mx-auto h-8 w-8 text-teal-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p className="mt-2 text-sm font-semibold text-slate-300">Review queue is clear</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {reviewQueue.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 hover:bg-slate-800/30">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{r.company_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{r.match_status.replace(/_/g, ' ')}</p>
                    </div>
                    {r.confidence_score != null && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.confidence_score >= 0.8 ? 'bg-teal-900/40 text-teal-200' : r.confidence_score >= 0.5 ? 'bg-amber-900/40 text-amber-200' : 'bg-rose-900/40 text-rose-200'}`}>
                        {Math.round(r.confidence_score * 100)}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Recent Import Jobs ──────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Recent Imports
              </h2>
              <Link href="/intel/upload" className="text-xs text-slate-400 hover:text-teal-300 transition">Import →</Link>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p className="mt-2 text-sm font-semibold text-slate-300">No recent import jobs</p>
                <p className="mt-1 text-xs text-slate-500">
                  <Link href="/intel/upload" className="text-teal-400 hover:underline">Upload an XLSX</Link> to start.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentJobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 hover:bg-slate-800/30">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-100">
                        {statusDot(j.job_status)}
                        <span>Job {j.id.slice(0, 8)}…</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {j.total_rows} rows · {j.inserted_rows} new · {j.error_rows} errors
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-500">{formatDate(j.started_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Companies Added This Week ────────────────────────────────────── */}
        {(loading || newCompanies.length > 0) && (
          <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Companies Added This Week
              </h2>
              <Link href="/intel/companies" className="text-xs text-slate-400 hover:text-teal-300 transition">All companies →</Link>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {newCompanies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/intel/companies/${c.id}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs transition hover:border-teal-500/40 hover:bg-teal-500/5"
                  >
                    <span className="font-medium text-slate-200">{c.canonical_name}</span>
                    {c.state && <span className="text-slate-500">{c.state}</span>}
                    {c.segment_tag && (
                      <span className="rounded bg-teal-900/40 px-1.5 py-0.5 text-[10px] text-teal-200">
                        {c.segment_tag}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Quick Nav ────────────────────────────────────────────────────── */}
        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Jump To</p>
          <div className="flex flex-wrap gap-2">
            {[
              {
                href: '/intel/cockpit/standing',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                ),
                label: 'Market Standing',
              },
              {
                href: '/intel/cockpit/plays',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                ),
                label: 'Recommended Plays',
              },
              {
                href: '/intel/cockpit/tasks',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ),
                label: 'Tasks',
              },
              {
                href: '/intel/cockpit/risk',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                ),
                label: 'Risk Assessment',
              },
              {
                href: '/intel/cockpit/money',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                ),
                label: 'Revenue',
              },
              {
                href: '/intel/cockpit/memo',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                ),
                label: 'Strategy Memo',
              },
              {
                href: '/intel/cockpit/deals',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                label: 'Deal Analytics',
              },
              {
                href: '/intel/cockpit/market',
                icon: (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                ),
                label: 'Competitive Map',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-teal-500/40 hover:text-teal-300"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>

      </section>
    </div>
  );
}
