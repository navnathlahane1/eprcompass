'use client';

/**
 * /taskmanager/digest
 * Weekly Digest & Smart Alerts — CCOO briefing dashboard.
 */
import { useEffect, useState, useCallback } from 'react';

interface ThisWeek {
  portal_tasks_closed: number;
  epr_tasks_completed: number;
  filings_submitted: number;
  sr_closed: number;
  escalations_raised: number;
  escalations_resolved: number;
  new_clients: number;
}
interface Current {
  open_tasks: number;
  overdue_tasks: number;
  overdue_epr: number;
  overdue_filings: number;
  stale_sr: number;
  active_escalations: number;
  critical_escalations: number;
}
interface Deadline {
  type: string; title: string; due: string; days_to: number;
}
interface Performer {
  id: string; name: string; tasks_closed: number;
}
interface DigestData {
  generated_at: string;
  period: string;
  this_week: ThisWeek;
  current: Current;
  critical_deadlines: Deadline[];
  top_performers: Performer[];
  insights: string[];
}

function daysColor(d: number) {
  if (d <= 1)  return 'text-rose-400';
  if (d <= 3)  return 'text-orange-400';
  if (d <= 7)  return 'text-amber-400';
  return 'text-slate-400';
}

export default function DigestPage() {
  const [data,    setData]    = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/digest');
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 rounded-lg bg-slate-800/50 animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">
        Failed to load digest.
      </div>
    );
  }

  const hasAlerts = data.current.critical_escalations > 0 || data.current.overdue_filings > 0 || data.current.overdue_tasks > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Weekly Digest & Smart Alerts</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            CCOO operational briefing · Generated {new Date(data.generated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          ↺ Refresh
        </button>
      </div>

      {/* Smart Insights */}
      {data.insights.length > 0 && (
        <div className={`rounded-xl border px-4 py-3 space-y-2 ${hasAlerts ? 'border-orange-500/25 bg-orange-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest ${hasAlerts ? 'text-orange-400' : 'text-emerald-400'}`}>
            Smart Insights
          </p>
          {data.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ${hasAlerts && i === 0 ? 'bg-rose-500/20' : 'bg-orange-500/15'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasAlerts && i < 2 ? 'bg-rose-500' : 'bg-orange-400'}`} />
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* This Week Activity */}
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-bold text-slate-200">This Week Activity</p>
            <span className="text-[10px] text-slate-600 ml-auto">Last 7 days</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Tasks Closed',         v: data.this_week.portal_tasks_closed,  good: true },
              { label: 'EPR Tasks Completed',  v: data.this_week.epr_tasks_completed,  good: true },
              { label: 'Filings Submitted',    v: data.this_week.filings_submitted,    good: true },
              { label: 'SRs Closed',           v: data.this_week.sr_closed,            good: true },
              { label: 'Escalations Raised',   v: data.this_week.escalations_raised,   good: false },
              { label: 'Escalations Resolved', v: data.this_week.escalations_resolved, good: true },
              { label: 'New Clients',          v: data.this_week.new_clients,          good: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{item.label}</span>
                <span className={`text-sm font-bold tabular-nums ${item.v > 0 ? (item.good ? 'text-emerald-400' : 'text-orange-400') : 'text-slate-600'}`}>
                  {item.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current State */}
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs font-bold text-slate-200">Current State</p>
            <span className="text-[10px] text-slate-600 ml-auto">Right now</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Open Tasks',             v: data.current.open_tasks,            threshold: 20, warnColor: 'text-amber-400'  },
              { label: 'Overdue Tasks',           v: data.current.overdue_tasks,         threshold: 0,  warnColor: 'text-rose-400'   },
              { label: 'Overdue EPR',             v: data.current.overdue_epr,           threshold: 0,  warnColor: 'text-rose-400'   },
              { label: 'Overdue Filings',         v: data.current.overdue_filings,       threshold: 0,  warnColor: 'text-rose-400'   },
              { label: 'Stale SRs (>48h)',        v: data.current.stale_sr,             threshold: 3,  warnColor: 'text-orange-400' },
              { label: 'Active Escalations',      v: data.current.active_escalations,   threshold: 0,  warnColor: 'text-orange-400' },
              { label: 'Critical Escalations',    v: data.current.critical_escalations, threshold: 0,  warnColor: 'text-rose-400'   },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{item.label}</span>
                <span className={`text-sm font-bold tabular-nums ${item.v > item.threshold ? item.warnColor : 'text-slate-400'}`}>
                  {item.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Deadlines — next 7 days */}
      {data.critical_deadlines.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/4 p-4 space-y-3">
          <p className="text-xs font-bold text-amber-400/80">Critical Deadlines — Next 7 Days</p>
          <div className="space-y-2">
            {data.critical_deadlines.map((dl, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-700/30 bg-slate-900/50 px-3 py-2">
                <span className={`text-sm font-bold tabular-nums shrink-0 w-12 ${daysColor(dl.days_to)}`}>
                  {dl.days_to === 0 ? 'Today' : dl.days_to === 1 ? 'Tmrw' : `${dl.days_to}d`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-200 truncate">{dl.title}</p>
                  <p className="text-[10px] text-slate-500">{new Date(dl.due).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="text-[10px] rounded px-1.5 py-0.5 bg-slate-700/40 text-slate-400 capitalize shrink-0">
                  {dl.type.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {data.top_performers.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-xs font-bold text-slate-200">Top Performers This Week</p>
          </div>
          <div className="space-y-2">
            {data.top_performers.map((p, i) => {
              const maxTasks = data.top_performers[0]?.tasks_closed ?? 1;
              const pct = Math.round((p.tasks_closed / maxTasks) * 100);
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="shrink-0 w-6 text-center text-sm">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold text-slate-300 truncate">{p.name}</span>
                      <span className="text-[11px] font-bold text-emerald-400 tabular-nums ml-2">{p.tasks_closed} closed</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-emerald-500/60'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All clear state */}
      {data.insights.length === 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-8 text-center">
          <p className="text-sm font-bold text-emerald-400">All systems operational</p>
          <p className="text-[11px] text-slate-500 mt-1">No critical alerts this week. Team is on track.</p>
        </div>
      )}
    </div>
  );
}
