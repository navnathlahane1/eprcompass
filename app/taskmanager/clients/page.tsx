'use client';

/**
 * /taskmanager/clients
 * Client Health Monitor — composite health score per client.
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Client {
  id: string; name: string;
  manager_id: string | null; manager_name: string | null;
  waste_categories: string[];
  health_score: number; health_tier: string;
  epr: { total: number; completed: number; overdue: number; pct: number };
  filings: { total: number; overdue: number; pct: number };
  portal_tasks: { open: number; overdue: number };
  service_requests: { open: number; stale: number };
  days_since_activity: number | null;
}
interface Summary {
  total: number; healthy: number; at_risk: number; poor: number; critical: number;
  unassigned: number; avg_score: number;
}

const TIER_STYLE: Record<string, { label: string; bg: string; border: string; text: string; bar: string; dot: string }> = {
  healthy:  { label: 'Healthy',  bg: 'bg-emerald-500/5',  border: 'border-emerald-500/15', text: 'text-emerald-400', bar: 'bg-emerald-500', dot: 'bg-emerald-500'  },
  at_risk:  { label: 'At Risk',  bg: 'bg-amber-500/8',    border: 'border-amber-500/20',   text: 'text-amber-400',  bar: 'bg-amber-500',  dot: 'bg-amber-500'   },
  poor:     { label: 'Poor',     bg: 'bg-orange-500/8',   border: 'border-orange-500/20',  text: 'text-orange-400', bar: 'bg-orange-500', dot: 'bg-orange-500'  },
  critical: { label: 'Critical', bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    text: 'text-rose-400',   bar: 'bg-rose-500',   dot: 'bg-rose-500', },
};

function scoreColor(s: number) {
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-amber-400';
  if (s >= 40) return 'text-orange-400';
  return 'text-rose-400';
}

export default function ClientHealthPage() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fTier,    setFTier]    = useState('');
  const [fSearch,  setFSearch]  = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fTier)   params.set('tier',   fTier);
    if (fSearch) params.set('search', fSearch);
    const res = await fetch(`/api/taskmanager/clients?${params}`);
    if (res.ok) { const d = await res.json(); setClients(d.clients ?? []); setSummary(d.summary ?? null); }
    setLoading(false);
  }, [fTier, fSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Client Health Monitor</h1>
          <p className="text-sm text-slate-400 mt-0.5">Composite compliance health score for every client</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: 'Total Clients', v: summary.total,      color: 'text-slate-200',  click: () => setFTier('') },
            { label: 'Healthy',       v: summary.healthy,    color: 'text-emerald-400',click: () => setFTier('healthy')  },
            { label: 'At Risk',       v: summary.at_risk,    color: 'text-amber-400',  click: () => setFTier('at_risk')  },
            { label: 'Poor',          v: summary.poor,       color: 'text-orange-400', click: () => setFTier('poor')     },
            { label: 'Critical',      v: summary.critical,   color: 'text-rose-400',   click: () => setFTier('critical') },
            { label: 'Unassigned',    v: summary.unassigned, color: summary.unassigned > 0 ? 'text-rose-400' : 'text-slate-600', click: () => {} },
            { label: 'Avg Score',     v: `${summary.avg_score}`, color: scoreColor(summary.avg_score), click: () => {} },
          ].map(item => (
            <button key={item.label} onClick={item.click}
              className={`rounded-xl border bg-[#0c1022] p-3 text-center transition hover:border-slate-700/60 ${fTier && item.label.toLowerCase().replace(' ', '_') === fTier ? 'border-orange-500/40' : 'border-slate-800/60'}`}>
              <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.v}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search client or manager…"
            className="h-8 pl-8 pr-3 w-52 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        {Object.entries(TIER_STYLE).map(([key, s]) => (
          <button key={key} onClick={() => setFTier(fTier === key ? '' : key)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold transition border flex items-center gap-1.5 ${fTier === key ? `${s.bg} ${s.border} ${s.text}` : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </button>
        ))}
        {(fTier || fSearch) && (
          <button onClick={() => { setFTier(''); setFSearch(''); }}
            className="h-7 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{clients.length} clients</span>
      </div>

      {/* List */}
      {loading && <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

      {!loading && clients.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">No clients match the filter.</div>
      )}

      {!loading && clients.length > 0 && (
        <div className="space-y-1.5">
          {clients.map(c => {
            const ts = TIER_STYLE[c.health_tier] ?? TIER_STYLE.poor;
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id} className={`rounded-xl border overflow-hidden transition ${c.health_tier === 'critical' ? `${ts.bg} ${ts.border}` : 'bg-[#0c1022] border-slate-800/60'}`}>
                {/* Main row */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : c.id)}>
                  {/* Score ring */}
                  <div className="shrink-0 relative flex h-10 w-10 items-center justify-center rounded-full border-2"
                    style={{ borderColor: c.health_tier === 'critical' ? '#f43f5e' : c.health_tier === 'poor' ? '#f97316' : c.health_tier === 'at_risk' ? '#f59e0b' : '#10b981' }}>
                    <span className={`text-xs font-bold tabular-nums ${scoreColor(c.health_score)}`}>{c.health_score}</span>
                  </div>

                  {/* Name + manager */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold ${c.health_tier === 'critical' ? 'text-rose-200' : 'text-slate-200'}`}>{c.name}</span>
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${ts.bg} ${ts.text}`}>{ts.label}</span>
                      {!c.manager_id && (
                        <span className="text-[10px] font-medium rounded px-1.5 py-0.5 bg-rose-500/15 text-rose-400">Unassigned</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {c.manager_name ? `Mgr: ${c.manager_name}` : 'No manager'}
                      {c.waste_categories.length > 0 && <span className="ml-2">{c.waste_categories.length} categories</span>}
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className={`text-xs font-bold tabular-nums ${c.epr.overdue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{c.epr.overdue > 0 ? c.epr.overdue : '✓'}</p>
                      <p className="text-[9px] text-slate-600">EPR OD</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold tabular-nums ${c.filings.overdue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{c.filings.overdue > 0 ? c.filings.overdue : '✓'}</p>
                      <p className="text-[9px] text-slate-600">Filing OD</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold tabular-nums text-slate-400">{c.epr.pct}%</p>
                      <p className="text-[9px] text-slate-600">EPR %</p>
                    </div>
                  </div>

                  {/* Health bar */}
                  <div className="hidden md:block w-24 shrink-0">
                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${ts.bar}`} style={{ width: `${c.health_score}%` }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/manager/clients/${c.id}`}
                      onClick={e => e.stopPropagation()}
                      className="h-7 px-2.5 rounded-lg border border-slate-700/40 text-[10px] text-slate-500 hover:text-slate-300 hover:border-slate-600 transition">
                      View →
                    </Link>
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-700/40 text-slate-500 hover:text-slate-300 transition">
                      <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-800/50 px-4 py-3 bg-slate-900/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'EPR Tasks',   sub: `${c.epr.completed}/${c.epr.total} done`, pct: c.epr.pct, bad: c.epr.overdue, badLabel: 'overdue' },
                      { label: 'Filings',     sub: `${c.filings.total} total`,                pct: c.filings.pct, bad: c.filings.overdue, badLabel: 'overdue' },
                      { label: 'Open Tasks',  sub: `${c.portal_tasks.open} open`,             pct: null, bad: c.portal_tasks.overdue, badLabel: 'overdue' },
                      { label: 'Service Req', sub: `${c.service_requests.open} open`,         pct: null, bad: c.service_requests.stale, badLabel: 'stale' },
                    ].map(item => (
                      <div key={item.label} className="rounded-lg border border-slate-800/40 bg-slate-900/40 px-3 py-2">
                        <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
                        <p className="text-xs font-semibold text-slate-300">{item.sub}</p>
                        {item.pct !== null && (
                          <div className="mt-1 h-1 w-full rounded-full bg-slate-800">
                            <div className={`h-full rounded-full ${item.pct >= 80 ? 'bg-emerald-500' : item.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${item.pct}%` }} />
                          </div>
                        )}
                        {item.bad > 0 && (
                          <p className="text-[10px] text-rose-400 mt-1">{item.bad} {item.badLabel}</p>
                        )}
                      </div>
                    ))}
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
