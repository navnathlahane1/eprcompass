'use client';

/**
 * /taskmanager/escalations
 * Escalation Management — view, filter, and resolve all active escalations.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Escalation {
  id: string;
  task_source: string;
  task_id: string;
  escalated_by: string;
  escalated_by_name: string;
  escalated_by_role: string;
  escalated_at: string;
  reason: string;
  severity: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by_name: string | null;
  resolution_note: string | null;
  task_title: string | null;
  task_subtitle: string | null;
}
interface Summary {
  total: number; active: number;
  critical: number; high: number; medium: number;
  resolved_today: number; avg_age_hours: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const SEV_STYLE: Record<string, { label: string; bg: string; border: string; text: string; dot: string; pulse?: boolean }> = {
  critical: { label: 'Critical', bg: 'bg-rose-500/10',    border: 'border-l-rose-500',     text: 'text-rose-400',    dot: 'bg-rose-500',    pulse: true  },
  high:     { label: 'High',     bg: 'bg-orange-500/8',   border: 'border-l-orange-500',   text: 'text-orange-400',  dot: 'bg-orange-500'              },
  medium:   { label: 'Medium',   bg: 'bg-amber-500/5',    border: 'border-l-amber-500',    text: 'text-amber-400',   dot: 'bg-amber-500'               },
};
const SOURCE_BADGE: Record<string, string> = {
  portal_task:     'bg-violet-500/20 text-violet-300',
  epr_task:        'bg-blue-500/20 text-blue-300',
  filing:          'bg-teal-500/20 text-teal-300',
  service_request: 'bg-amber-500/20 text-amber-300',
};
function fmtAge(dt: string) {
  const h = (Date.now() - new Date(dt).getTime()) / 3_600_000;
  if (h < 1)   return `${Math.round(h * 60)}m ago`;
  if (h < 24)  return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function EscalationsPage() {
  const [escalations,  setEscalations]  = useState<Escalation[]>([]);
  const [summary,      setSummary]      = useState<Summary | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [fStatus,      setFStatus]      = useState<'active' | 'resolved' | ''>('active');
  const [fSeverity,    setFSeverity]    = useState('');
  const [fSource,      setFSource]      = useState('');
  const [fSearch,      setFSearch]      = useState('');
  const [resolving,    setResolving]    = useState<string | null>(null);
  const [resolveNote,  setResolveNote]  = useState('');
  const [expanded,     setExpanded]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fStatus === 'active')   params.set('resolved', 'false');
    if (fStatus === 'resolved') params.set('resolved', 'true');
    if (fSeverity) params.set('severity', fSeverity);
    if (fSource)   params.set('source',   fSource);
    const res = await fetch(`/api/taskmanager/escalations?${params}`);
    if (res.ok) {
      const d = await res.json();
      setEscalations(d.escalations ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, [fStatus, fSeverity, fSource]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    if (!fSearch) return escalations;
    const q = fSearch.toLowerCase();
    return escalations.filter(e =>
      e.reason.toLowerCase().includes(q) ||
      (e.task_title ?? '').toLowerCase().includes(q) ||
      e.escalated_by_name.toLowerCase().includes(q)
    );
  }, [escalations, fSearch]);

  async function handleResolve(id: string) {
    const res = await fetch('/api/taskmanager/escalations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolution_note: resolveNote }),
    });
    if (res.ok) {
      setResolving(null);
      setResolveNote('');
      setExpanded(null);
      load();
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Escalation Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">All raised escalations · resolve · track resolution</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Summary chips */}
      {summary && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Active',          value: summary.active,         color: 'text-slate-200', click: () => setFStatus('active')   },
            { label: 'Critical',        value: summary.critical,       color: 'text-rose-400',  click: () => { setFStatus('active'); setFSeverity('critical'); } },
            { label: 'High',            value: summary.high,           color: 'text-orange-400',click: () => { setFStatus('active'); setFSeverity('high');     } },
            { label: 'Medium',          value: summary.medium,         color: 'text-amber-400', click: () => { setFStatus('active'); setFSeverity('medium');   } },
            { label: 'Resolved Today',  value: summary.resolved_today, color: 'text-emerald-400', click: () => setFStatus('resolved') },
            { label: 'Avg Age',         value: `${summary.avg_age_hours}h`, color: summary.avg_age_hours > 24 ? 'text-rose-400' : 'text-slate-400', click: () => {} },
          ].map(item => (
            <button key={item.label} onClick={item.click}
              className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-[#0c1022] px-3 py-2 hover:border-slate-700/60 transition">
              <span className="text-[10px] text-slate-500">{item.label}</span>
              <span className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status toggle */}
        <div className="flex rounded-lg border border-slate-700/60 bg-slate-800 overflow-hidden text-[11px]">
          {(['active', '', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setFStatus(s)}
              className={`px-3 py-1.5 font-medium transition ${fStatus === s ? 'bg-orange-500/20 text-orange-300' : 'text-slate-500 hover:text-slate-300'}`}>
              {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Severity */}
        <select value={fSeverity} onChange={e => setFSeverity(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>

        {/* Source */}
        <select value={fSource} onChange={e => setFSource(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Sources</option>
          <option value="portal_task">Operational Task</option>
          <option value="epr_task">EPR Task</option>
          <option value="filing">Filing</option>
          <option value="service_request">Service Request</option>
        </select>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search escalations…"
            className="h-8 pl-8 pr-3 w-48 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

        {(fSeverity || fSource || fSearch) && (
          <button onClick={() => { setFSeverity(''); setFSource(''); setFSearch(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} escalations</span>
      </div>

      {/* List */}
      {loading && (
        <div className="space-y-2">{[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />
        ))}</div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-500">No escalations match your filters.</p>
          {fStatus === 'active' && <p className="text-xs text-slate-600 mt-1">All escalations resolved. 🎉</p>}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map(e => {
            const ss = SEV_STYLE[e.severity] ?? SEV_STYLE.medium;
            const isExpanded = expanded === e.id;
            const isResolving = resolving === e.id;

            return (
              <div key={e.id}
                className={`rounded-xl border border-l-4 ${ss.border} border-slate-800/60 overflow-hidden ${!e.resolved ? ss.bg : 'bg-slate-900/30'}`}>

                {/* Main row */}
                <div className="flex flex-wrap items-start gap-3 px-4 py-3">
                  {/* Severity dot */}
                  <span className={`shrink-0 h-2 w-2 rounded-full mt-1.5 ${ss.dot} ${ss.pulse ? 'animate-pulse' : ''}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${ss.text}`}>{ss.label}</span>
                      <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${SOURCE_BADGE[e.task_source] ?? 'bg-slate-700/40 text-slate-400'}`}>
                        {e.task_source.replace(/_/g, ' ')}
                      </span>
                      {e.resolved && (
                        <span className="text-[10px] rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 font-medium">Resolved</span>
                      )}
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${e.resolved ? 'text-slate-400' : 'text-slate-200'}`}>
                      {e.reason}
                    </p>
                    {e.task_title && (
                      <p className="text-[11px] text-slate-500">
                        Task: <span className="text-slate-400">{e.task_title}</span>
                        {e.task_subtitle && <span className="ml-1.5 text-slate-600">· {e.task_subtitle}</span>}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-600">
                      Escalated by <span className="text-teal-400/80">{e.escalated_by_name}</span>
                      <span className="mx-1">·</span>
                      {fmtAge(e.escalated_at)}
                      {e.resolved && e.resolved_by_name && (
                        <> · Resolved by <span className="text-emerald-400/80">{e.resolved_by_name}</span></>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex gap-2 items-center">
                    {!e.resolved && (
                      <button
                        onClick={() => { setExpanded(isExpanded ? null : e.id); setResolving(isExpanded ? null : e.id); setResolveNote(''); }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition">
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : e.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-700/40 text-slate-500 hover:text-slate-300 transition">
                      <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expand: resolve form or detail */}
                {isExpanded && (
                  <div className="border-t border-slate-800/50 px-4 py-3 space-y-3 bg-slate-900/20">
                    {/* Resolution note if resolved */}
                    {e.resolved && e.resolution_note && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                        <p className="text-[10px] text-emerald-400/80 font-semibold mb-1">Resolution Note</p>
                        <p className="text-xs text-slate-300">{e.resolution_note}</p>
                        {e.resolved_at && (
                          <p className="text-[10px] text-slate-600 mt-1">
                            {new Date(e.resolved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Resolve form */}
                    {!e.resolved && isResolving && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-400 font-medium">Resolution note (optional)</p>
                        <textarea
                          value={resolveNote}
                          onChange={ev => setResolveNote(ev.target.value)}
                          placeholder="Describe the action taken to resolve this escalation…"
                          rows={2}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-900 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleResolve(e.id)}
                            className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition">
                            Mark Resolved
                          </button>
                          <button onClick={() => { setResolving(null); setExpanded(null); setResolveNote(''); }}
                            className="h-8 px-3 rounded-lg border border-slate-700/40 text-xs text-slate-500 hover:text-slate-300 transition">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
