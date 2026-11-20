'use client';

/**
 * /taskmanager/breach-predict
 * SLA Breach Predictor — AI-style scoring of at-risk tasks.
 */
import { useEffect, useState, useCallback } from 'react';

interface Prediction {
  id: string; source: string; title: string;
  client_name: string | null; assignee_name: string | null;
  due_date: string; hours_remaining: number;
  risk_score: number; risk_level: string;
  signals: string[];
  pct_elapsed: number; status: string;
}
interface Summary {
  total: number; critical: number; high: number; medium: number;
  avg_risk_score: number; overloaded_assignees: number;
}

const RISK_STYLE: Record<string, { label: string; text: string; bg: string; border: string; bar: string; pulse?: boolean }> = {
  critical: { label: 'Critical', text: 'text-rose-400',    bg: 'bg-rose-500/12',   border: 'border-l-rose-500',    bar: 'bg-rose-500',    pulse: true },
  high:     { label: 'High',     text: 'text-orange-400',  bg: 'bg-orange-500/8',  border: 'border-l-orange-500',  bar: 'bg-orange-500'  },
  medium:   { label: 'Medium',   text: 'text-amber-400',   bg: 'bg-amber-500/6',   border: 'border-l-amber-500',   bar: 'bg-amber-500'   },
};

const SRC_LABEL: Record<string, string> = {
  portal_task: 'Task',
  epr_task:    'EPR',
  filing:      'Filing',
};

function hoursLabel(h: number) {
  if (h <= 0)   return 'Overdue';
  if (h < 1)    return `${Math.round(h * 60)}m left`;
  if (h < 24)   return `${h.toFixed(1)}h left`;
  return `${Math.ceil(h / 24)}d left`;
}

export default function BreachPredictPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fLevel,      setFLevel]      = useState('');
  const [fSearch,     setFSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/breach-predict');
    if (res.ok) {
      const d = await res.json();
      setPredictions(d.predictions ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = predictions.filter(p => {
    if (fLevel && p.risk_level !== fLevel) return false;
    if (fSearch) {
      const q = fSearch.toLowerCase();
      return (p.client_name ?? '').toLowerCase().includes(q) ||
             p.title.toLowerCase().includes(q) ||
             (p.assignee_name ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">SLA Breach Predictor</h1>
          <p className="text-sm text-slate-400 mt-0.5">Risk-scored predictions for tasks likely to breach SLA in the next 7 days</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Critical alert strip */}
      {summary && summary.critical > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 flex items-center gap-3">
          <svg className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-rose-300 font-medium">
            {summary.critical} task{summary.critical !== 1 ? 's' : ''} at critical breach risk — immediate intervention needed
          </p>
        </div>
      )}

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'At Risk',          v: summary.total,                  color: 'text-slate-200' },
            { label: 'Critical',         v: summary.critical,               color: summary.critical > 0 ? 'text-rose-400' : 'text-slate-600' },
            { label: 'High',             v: summary.high,                   color: summary.high > 0 ? 'text-orange-400' : 'text-slate-600' },
            { label: 'Medium',           v: summary.medium,                 color: summary.medium > 0 ? 'text-amber-400' : 'text-slate-600' },
            { label: 'Avg Risk Score',   v: summary.avg_risk_score,         color: summary.avg_risk_score >= 70 ? 'text-rose-400' : summary.avg_risk_score >= 45 ? 'text-orange-400' : 'text-amber-400' },
            { label: 'Overloaded Staff', v: summary.overloaded_assignees,   color: summary.overloaded_assignees > 0 ? 'text-orange-400' : 'text-slate-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* How scoring works */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/20 px-4 py-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Scoring Signals</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+40', desc: '>80% time elapsed, still pending' },
            { label: '+35', desc: 'No update >72h, due <48h' },
            { label: '+20', desc: 'Assignee overloaded (>5 overdue)' },
            { label: '+20', desc: 'Due within 4 hours' },
            { label: '+10', desc: 'Critical priority' },
          ].map((sig, si) => (
            <div key={si} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 rounded px-1.5 py-0.5">{sig.label}</span>
              <span className="text-[10px] text-slate-500">{sig.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search client or task…"
            className="h-8 pl-8 pr-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

        {Object.entries(RISK_STYLE).map(([key, s]) => (
          <button key={key} onClick={() => setFLevel(fLevel === key ? '' : key)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold transition border ${fLevel === key ? `${s.bg} border-transparent ${s.text}` : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'}`}>
            {s.label}
          </button>
        ))}

        {(fLevel || fSearch) && (
          <button onClick={() => { setFLevel(''); setFSearch(''); }}
            className="h-7 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} predictions</span>
      </div>

      {/* Predictions */}
      {loading && (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center">
          <p className="text-sm font-semibold text-emerald-400">No breach predictions</p>
          <p className="text-[11px] text-slate-500 mt-1">All upcoming tasks are on track — no SLA breach risk detected.</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map(p => {
            const rs = RISK_STYLE[p.risk_level] ?? RISK_STYLE.medium;
            return (
              <div key={p.id} className={`rounded-xl border border-l-4 border-slate-800/60 ${rs.border} px-4 py-3 ${rs.bg}`}>
                <div className="flex flex-wrap items-start gap-3">

                  {/* Risk score */}
                  <div className="shrink-0 flex flex-col items-center min-w-[48px]">
                    <p className={`text-xl font-bold tabular-nums ${rs.text} ${rs.pulse ? 'animate-pulse' : ''}`}>{p.risk_score}</p>
                    <p className="text-[9px] text-slate-600">score</p>
                    <div className="w-full mt-1 h-1 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${rs.bar}`} style={{ width: `${Math.min(p.risk_score, 100)}%` }} />
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 bg-slate-700/40 text-slate-400`}>
                        {SRC_LABEL[p.source] ?? p.source}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{p.title}</span>
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${rs.bg} ${rs.text}`}>{rs.label}</span>
                    </div>
                    {/* Signals */}
                    <div className="flex flex-wrap gap-1.5">
                      {p.signals.map((sig, si) => (
                        <span key={si} className="text-[10px] text-slate-400 bg-slate-800/50 rounded px-2 py-0.5">
                          ⚠ {sig}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {p.client_name && <p className="text-[10px] text-slate-500">Client: {p.client_name}</p>}
                      {p.assignee_name && <p className="text-[10px] text-slate-500">Assignee: {p.assignee_name}</p>}
                      <p className="text-[10px] text-slate-500">Status: <span className="capitalize">{p.status.replace(/_/g, ' ')}</span></p>
                    </div>
                  </div>

                  {/* Time left */}
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold tabular-nums ${p.hours_remaining <= 4 ? 'text-rose-400' : p.hours_remaining <= 24 ? 'text-orange-400' : 'text-amber-400'}`}>
                      {hoursLabel(p.hours_remaining)}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(p.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    {/* Elapsed bar */}
                    <div className="mt-1.5 w-20 ml-auto">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[9px] text-slate-600">Elapsed</span>
                        <span className="text-[9px] text-slate-500">{p.pct_elapsed}%</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-slate-800">
                        <div className={`h-full rounded-full ${p.pct_elapsed >= 90 ? 'bg-rose-500' : p.pct_elapsed >= 70 ? 'bg-orange-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(p.pct_elapsed, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
