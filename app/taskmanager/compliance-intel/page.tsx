'use client';

/**
 * /taskmanager/compliance-intel
 * Compliance Intelligence Monitor — per-category EPR obligation tracking,
 * upcoming deadlines, Environmental Compensation risk for CCOO.
 */
import { useEffect, useState, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Category {
  key: string; label: string; icon: string; color: string; bar: string;
  total: number; completed: number; overdue: number;
  in_progress: number; pending: number; due_soon: number; due_30: number;
  completion_pct: number; risk: string; affected_clients: number;
}
interface Deadline {
  id: string; category: string; fy_label: string;
  current_status: string; sla_due_at: string;
  days_remaining: number; urgent: boolean;
}
interface Summary {
  total_epr_tasks: number; completed: number; overdue: number;
  completion_pct: number; total_filings: number;
  overdue_filings: number; upcoming_filings: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const RISK_STYLE: Record<string, { label: string; bg: string; border: string; text: string; dot: string; pulse?: boolean }> = {
  critical: { label: 'Critical', bg: 'bg-rose-500/15',    border: 'border-rose-500/30',    text: 'text-rose-400',    dot: 'bg-rose-500',    pulse: true },
  high:     { label: 'High',     bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  text: 'text-orange-400',  dot: 'bg-orange-500'              },
  medium:   { label: 'Medium',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   dot: 'bg-amber-500'               },
  at_risk:  { label: 'At Risk',  bg: 'bg-yellow-500/8',   border: 'border-yellow-500/20',  text: 'text-yellow-400',  dot: 'bg-yellow-500'              },
  low:      { label: 'On Track', bg: 'bg-emerald-500/5',  border: 'border-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500'             },
};
const EC_RISK_STYLE: Record<string, { bg: string; border: string; text: string; title: string }> = {
  critical: { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-300',    title: '🚨 Critical EC Risk' },
  high:     { bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  text: 'text-orange-300',  title: '⚠️ High EC Risk' },
  medium:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-300',   title: '⚠️ EC Risk Detected' },
};
function daysColor(d: number) {
  if (d <= 1) return 'text-rose-400';
  if (d <= 3) return 'text-orange-400';
  if (d <= 7) return 'text-amber-400';
  return 'text-slate-400';
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function ComplianceIntelPage() {
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [deadlines,   setDeadlines]   = useState<Deadline[]>([]);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [ecRisk,      setEcRisk]      = useState(false);
  const [ecLevel,     setEcLevel]     = useState('none');
  const [loading,     setLoading]     = useState(true);
  const [fRisk,       setFRisk]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/compliance-intel');
    if (res.ok) {
      const d = await res.json();
      setCategories(d.categories ?? []);
      setDeadlines(d.upcoming_deadlines ?? []);
      setSummary(d.summary ?? null);
      setEcRisk(d.ec_risk ?? false);
      setEcLevel(d.ec_risk_level ?? 'none');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = fRisk
    ? categories.filter(c => c.risk === fRisk)
    : categories;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Compliance Intelligence Monitor</h1>
          <p className="text-sm text-slate-400 mt-0.5">EPR obligation tracking · EC risk · Upcoming deadlines</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Environmental Compensation Risk Banner */}
      {!loading && ecRisk && ecLevel !== 'none' && (
        <div className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 ${EC_RISK_STYLE[ecLevel]?.bg} ${EC_RISK_STYLE[ecLevel]?.border}`}>
          <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 mt-0.5 ${EC_RISK_STYLE[ecLevel]?.text}`} fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className={`text-sm font-bold ${EC_RISK_STYLE[ecLevel]?.text}`}>{EC_RISK_STYLE[ecLevel]?.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Overdue filings or EPR obligations detected. Environmental Compensation liability may apply under CPCB/SPCB rules.
              Immediate action required to avoid penalties.
            </p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: 'EPR Tasks',     value: summary.total_epr_tasks,    color: 'text-slate-200'  },
            { label: 'Completed',     value: summary.completed,          color: 'text-emerald-400' },
            { label: 'Overdue Tasks', value: summary.overdue,            color: summary.overdue > 0 ? 'text-rose-400' : 'text-slate-600' },
            { label: 'Done %',        value: `${summary.completion_pct}%`, color: summary.completion_pct >= 80 ? 'text-emerald-400' : summary.completion_pct >= 60 ? 'text-amber-400' : 'text-rose-400' },
            { label: 'Total Filings', value: summary.total_filings,      color: 'text-slate-200'  },
            { label: 'OD Filings',    value: summary.overdue_filings,    color: summary.overdue_filings > 0 ? 'text-rose-400' : 'text-slate-600' },
            { label: 'Due in 30d',    value: summary.upcoming_filings,   color: summary.upcoming_filings > 0 ? 'text-amber-400' : 'text-slate-600' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
              <p className={`text-xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Risk filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-slate-500 font-medium">Filter:</span>
        {['', 'critical', 'high', 'medium', 'at_risk', 'low'].map(r => (
          <button key={r} onClick={() => setFRisk(r)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold transition border ${
              fRisk === r
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'
            }`}>
            {r === '' ? 'All' : RISK_STYLE[r]?.label ?? r}
          </button>
        ))}
      </div>

      {/* Category Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayed.map(cat => {
            const rs = RISK_STYLE[cat.risk] ?? RISK_STYLE.low;
            return (
              <div key={cat.key}
                className={`rounded-xl border p-4 space-y-3 transition hover:brightness-105 ${
                  cat.risk === 'critical' || cat.risk === 'high'
                    ? `${rs.bg} ${rs.border}`
                    : 'bg-[#0c1022] border-slate-800/60'
                }`}>

                {/* Category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${rs.dot} ${rs.pulse ? 'animate-pulse' : ''}`} />
                    <p className={`text-xs font-bold ${cat.risk === 'critical' || cat.risk === 'high' ? rs.text : 'text-slate-200'}`}>
                      {cat.label}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${rs.bg} ${rs.text}`}>
                    {rs.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500">Completion</span>
                    <span className={`text-xs font-bold tabular-nums ${cat.completion_pct >= 80 ? 'text-emerald-400' : cat.completion_pct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {cat.completion_pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div className={`h-full rounded-full transition-all ${cat.completion_pct >= 80 ? 'bg-emerald-500' : cat.completion_pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${cat.completion_pct}%` }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 text-center gap-1">
                  {[
                    { label: 'Total',    v: cat.total,       c: 'text-slate-400'  },
                    { label: 'Done',     v: cat.completed,   c: 'text-emerald-400' },
                    { label: 'Overdue',  v: cat.overdue,     c: cat.overdue > 0 ? 'text-rose-400' : 'text-slate-600' },
                    { label: 'Due Soon', v: cat.due_soon,    c: cat.due_soon > 0 ? 'text-amber-400' : 'text-slate-600' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className={`text-sm font-bold tabular-nums ${s.c}`}>{s.v}</p>
                      <p className="text-[9px] text-slate-600">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <p className="text-[10px] text-slate-600">
                  {cat.affected_clients} client{cat.affected_clients !== 1 ? 's' : ''} affected
                  {cat.due_30 > 0 && ` · ${cat.due_30} due in 30d`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Deadlines */}
      {!loading && deadlines.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Upcoming Filing Deadlines (30-day window)</h2>
            <span className="text-[11px] text-slate-500">{deadlines.length} deadline{deadlines.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {deadlines.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`shrink-0 h-2 w-2 rounded-full ${d.urgent ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{d.category}</p>
                  <p className="text-[10px] text-slate-500">{d.fy_label}</p>
                </div>
                <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${
                  d.current_status === 'Submitted' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                }`}>{d.current_status}</span>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold tabular-nums ${daysColor(d.days_remaining)}`}>
                    {d.days_remaining === 0 ? 'Today!' : `${d.days_remaining}d`}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {new Date(d.sla_due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && deadlines.length === 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-300 font-medium">No filing deadlines in the next 30 days. Zero compliance leakage.</p>
        </div>
      )}
    </div>
  );
}
