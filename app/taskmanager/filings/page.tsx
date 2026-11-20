'use client';

/**
 * /taskmanager/filings
 * Filing SLA monitor — all open EPR filings sorted by SLA urgency.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface Filing {
  id: string;
  client_id: string;
  client_name: string;
  manager: { id: string; name: string } | null;
  category: string;
  current_status: string;
  sla_due_at: string | null;
  sla_tier: string;
  hours_remaining: number | null;
  fy_label: string;
  updated_at: string;
}

interface Summary {
  total: number;
  critical: number;
  urgent: number;
  warning: number;
  at_risk: number;
  ok: number;
  no_sla: number;
}

const TIER_STYLE: Record<string, { label: string; bg: string; border: string; text: string; dot: string; pulse?: boolean }> = {
  critical: { label: 'Overdue',    bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   dot: 'bg-rose-500',    pulse: true  },
  urgent:   { label: '< 4 hours',  bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400', dot: 'bg-orange-500'              },
  warning:  { label: 'Today',      bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-500'               },
  at_risk:  { label: 'Tomorrow',   bg: 'bg-yellow-500/8',  border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500'              },
  ok:       { label: 'On Track',   bg: 'bg-emerald-500/5', border: 'border-emerald-500/15',text: 'text-emerald-400',dot: 'bg-emerald-500'             },
  no_sla:   { label: 'No SLA',     bg: 'bg-slate-800/30',  border: 'border-slate-700/30',  text: 'text-slate-500',  dot: 'bg-slate-600'               },
};

const STATUS_BADGE: Record<string, string> = {
  'Received':    'bg-blue-500/20 text-blue-300',
  'Under Review':'bg-amber-500/20 text-amber-300',
  'Clarification':'bg-orange-500/20 text-orange-300',
  'Pending':     'bg-slate-700/40 text-slate-400',
  'Rejected':    'bg-rose-500/20 text-rose-300',
  'In Progress': 'bg-violet-500/20 text-violet-300',
};

function fmtHours(h: number | null): string {
  if (h === null) return '—';
  if (h < 0)   return `${Math.abs(Math.round(h))}h overdue`;
  if (h < 1)   return `${Math.round(h * 60)}m left`;
  if (h < 24)  return `${Math.round(h)}h left`;
  return `${Math.round(h / 24)}d left`;
}

export default function TaskManagerFilingsPage() {
  const [filings, setFilings]   = useState<Filing[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);

  const [fTier,   setFTier]   = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fSearch, setFSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/filings');
    if (res.ok) {
      const d = await res.json();
      setFilings(d.filings ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    let fs = filings;
    if (fTier)   fs = fs.filter(f => f.sla_tier === fTier);
    if (fStatus) fs = fs.filter(f => f.current_status === fStatus);
    if (fSearch) {
      const q = fSearch.toLowerCase();
      fs = fs.filter(f =>
        f.category.toLowerCase().includes(q) ||
        f.client_name.toLowerCase().includes(q) ||
        (f.manager?.name ?? '').toLowerCase().includes(q)
      );
    }
    return fs;
  }, [filings, fTier, fStatus, fSearch]);

  const statuses = useMemo(() => [...new Set(filings.map(f => f.current_status))].sort(), [filings]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Filing SLA Monitor</h1>
          <p className="text-sm text-slate-400 mt-0.5">All open filings sorted by SLA urgency</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* SLA summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(['critical','urgent','warning','at_risk','ok','no_sla'] as const).map(t => {
            const count = (summary as any)[t] ?? 0;
            const s     = TIER_STYLE[t];
            return (
              <button key={t} onClick={() => setFTier(fTier === t ? '' : t)}
                className={`rounded-lg border p-3 text-center cursor-pointer transition hover:brightness-110 ${fTier === t ? `${s.bg} ${s.border}` : 'bg-[#0c1022] border-slate-800/60'}`}>
                <div className={`flex items-center justify-center gap-1 mb-1`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
                <div className={`text-2xl font-bold tabular-nums ${count > 0 ? s.text : 'text-slate-600'}`}>{count}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search filings…"
            className="h-8 pl-8 pr-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

        <select value={fStatus} onChange={e => setFStatus(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {(fTier || fStatus || fSearch) && (
          <button onClick={() => { setFTier(''); setFStatus(''); setFSearch(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">
            Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} filings</span>
      </div>

      {/* List */}
      {loading && <div className="space-y-2">{[...Array(8)].map((_,i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">
          No filings match your filters.
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
          {displayed.map(f => {
            const ts = TIER_STYLE[f.sla_tier] ?? TIER_STYLE.no_sla;
            return (
              <div key={f.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${f.sla_tier === 'critical' ? 'border-l-2 border-rose-500 bg-rose-500/3' : ''}`}>
                {/* SLA tier dot */}
                <span className={`shrink-0 h-2 w-2 rounded-full ${ts.dot} ${ts.pulse ? 'animate-pulse' : ''}`} />

                {/* Filing info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold ${f.sla_tier === 'critical' ? 'text-rose-200' : 'text-slate-200'}`}>
                      {f.category}
                    </span>
                    {f.fy_label && (
                      <span className="text-[10px] border border-slate-700/40 rounded px-1.5 py-0.5 text-slate-500">{f.fy_label}</span>
                    )}
                    <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${STATUS_BADGE[f.current_status] ?? 'bg-slate-700/40 text-slate-400'}`}>
                      {f.current_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {f.client_name}
                    {f.manager && <span className="ml-2 text-teal-400/70">· Mgr: {f.manager.name}</span>}
                  </p>
                </div>

                {/* SLA time */}
                <div className="text-right shrink-0">
                  <div className={`text-xs font-semibold tabular-nums ${ts.text}`}>
                    {fmtHours(f.hours_remaining)}
                  </div>
                  {f.sla_due_at && (
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(f.sla_due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Go to client */}
                <Link href={`/manager/clients/${f.client_id}`}
                  className="shrink-0 h-7 px-2 rounded-lg border border-slate-700/40 text-[10px] text-slate-500 hover:text-slate-300 hover:border-slate-600 transition">
                  View →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
