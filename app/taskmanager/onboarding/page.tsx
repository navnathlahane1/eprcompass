'use client';

/**
 * /taskmanager/onboarding
 * Client Onboarding Pipeline — track new client activation progress.
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface OnboardingClient {
  id: string; name: string;
  manager_id: string | null; manager_name: string | null;
  created_at: string; days_since: number;
  stage: string; completion_pct: number;
  checklist: {
    manager_assigned: boolean;
    categories_configured: boolean;
    epr_tasks_generated: boolean;
    portal_active: boolean;
  };
  stalled: boolean;
}
interface Summary {
  total: number; complete: number; almost: number;
  in_progress: number; started: number; pending: number;
  stalled: number; avg_days_to_complete: number | null;
}

const STAGE_STYLE: Record<string, { label: string; text: string; bg: string; border: string; pct: number }> = {
  complete:    { label: 'Complete',    text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', pct: 100 },
  almost:      { label: 'Almost',      text: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    pct: 75  },
  in_progress: { label: 'In Progress', text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    pct: 50  },
  started:     { label: 'Started',     text: 'text-amber-400',   bg: 'bg-amber-500/8',    border: 'border-amber-500/15',   pct: 25  },
  pending:     { label: 'Pending',     text: 'text-slate-400',   bg: 'bg-slate-700/20',   border: 'border-slate-700/30',   pct: 0   },
};

const CHECKS: { key: keyof OnboardingClient['checklist']; label: string; icon: string }[] = [
  { key: 'manager_assigned',      label: 'Manager Assigned',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'categories_configured', label: 'Categories Set',      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { key: 'epr_tasks_generated',   label: 'EPR Tasks Created',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { key: 'portal_active',         label: 'Portal Active',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export default function OnboardingPage() {
  const [clients,  setClients]  = useState<OnboardingClient[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fStage,   setFStage]   = useState('');
  const [fStalled, setFStalled] = useState(false);
  const [fSearch,  setFSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fStage)   params.set('stage', fStage);
    if (fStalled) params.set('stalled', '1');
    if (fSearch)  params.set('search', fSearch);
    const res = await fetch(`/api/taskmanager/onboarding?${params}`);
    if (res.ok) {
      const d = await res.json();
      setClients(d.clients ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, [fStage, fStalled, fSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Client Onboarding Pipeline</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track activation progress for all newly registered clients</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Stalled banner */}
      {summary && summary.stalled > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
          <svg className="h-4 w-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-300 font-medium">
            {summary.stalled} client{summary.stalled !== 1 ? 's' : ''} stalled (&gt;7 days without progress) — follow-up required
          </p>
          <button onClick={() => setFStalled(!fStalled)} className="ml-auto text-[11px] text-amber-400 hover:text-amber-300 font-medium transition">
            {fStalled ? 'Show all' : 'Show stalled →'}
          </button>
        </div>
      )}

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: 'Total',        v: summary.total,                stage: '' },
            { label: 'Complete',     v: summary.complete,             stage: 'complete' },
            { label: 'Almost',       v: summary.almost,               stage: 'almost' },
            { label: 'In Progress',  v: summary.in_progress,          stage: 'in_progress' },
            { label: 'Started',      v: summary.started,              stage: 'started' },
            { label: 'Pending',      v: summary.pending,              stage: 'pending' },
            { label: 'Stalled',      v: summary.stalled,              stage: '' },
          ].map(item => {
            const ss = STAGE_STYLE[item.stage];
            return (
              <button key={item.label}
                onClick={() => item.stage ? setFStage(fStage === item.stage ? '' : item.stage) : {}}
                className={`rounded-xl border p-3 text-center transition hover:brightness-110 ${fStage === item.stage && item.stage ? `${ss?.bg} ${ss?.border}` : 'bg-[#0c1022] border-slate-800/60'}`}>
                <p className="text-[9px] text-slate-500 mb-1">{item.label}</p>
                <p className={`text-xl font-bold tabular-nums ${ss ? ss.text : item.label === 'Stalled' ? (item.v > 0 ? 'text-amber-400' : 'text-slate-600') : 'text-slate-200'}`}>
                  {item.v}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Avg time */}
      {summary?.avg_days_to_complete !== null && summary?.avg_days_to_complete !== undefined && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800/50 bg-slate-900/30 px-4 py-2.5">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-slate-400">Average time to complete onboarding: <strong className="text-slate-200">{summary.avg_days_to_complete} days</strong></p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search client…"
            className="h-8 pl-8 pr-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

        {Object.entries(STAGE_STYLE).map(([key, s]) => (
          <button key={key} onClick={() => setFStage(fStage === key ? '' : key)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold transition border ${fStage === key ? `${s.bg} ${s.border} ${s.text}` : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'}`}>
            {s.label}
          </button>
        ))}

        {(fStage || fStalled || fSearch) && (
          <button onClick={() => { setFStage(''); setFStalled(false); setFSearch(''); }}
            className="h-7 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{clients.length} clients</span>
      </div>

      {/* List */}
      {loading && (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
      )}

      {!loading && clients.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">No clients found.</div>
      )}

      {!loading && clients.length > 0 && (
        <div className="space-y-2">
          {clients.map(c => {
            const ss = STAGE_STYLE[c.stage] ?? STAGE_STYLE.pending;
            return (
              <div key={c.id} className={`rounded-xl border px-4 py-3 ${c.stage === 'complete' ? 'border-slate-800/40 bg-[#0c1022]' : c.stalled ? 'border-amber-500/20 bg-amber-500/3' : 'border-slate-800/60 bg-[#0c1022]'}`}>
                <div className="flex flex-wrap items-start gap-3">

                  {/* Progress ring */}
                  <div className="shrink-0 relative flex h-10 w-10 items-center justify-center rounded-full border-2"
                    style={{ borderColor: c.stage === 'complete' ? '#10b981' : c.stage === 'almost' ? '#14b8a6' : c.stage === 'in_progress' ? '#3b82f6' : c.stage === 'started' ? '#f59e0b' : '#475569' }}>
                    <span className={`text-[10px] font-bold tabular-nums ${ss.text}`}>{c.completion_pct}%</span>
                  </div>

                  {/* Name & meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{c.name}</span>
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${ss.bg} ${ss.text}`}>{ss.label}</span>
                      {c.stalled && <span className="text-[10px] font-medium rounded px-1.5 py-0.5 bg-amber-500/15 text-amber-400">Stalled</span>}
                      {!c.manager_id && <span className="text-[10px] font-medium rounded px-1.5 py-0.5 bg-rose-500/15 text-rose-400">Unassigned</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {c.manager_name ? `Mgr: ${c.manager_name}` : 'No manager'} · Registered {c.days_since}d ago
                    </p>
                  </div>

                  {/* Action */}
                  <Link href={`/manager/clients/${c.id}`}
                    className="shrink-0 h-7 px-2.5 rounded-lg border border-slate-700/40 text-[10px] text-slate-500 hover:text-slate-300 hover:border-slate-600 transition">
                    View →
                  </Link>
                </div>

                {/* Checklist */}
                <div className="mt-3 flex flex-wrap gap-3">
                  {CHECKS.map(ch => (
                    <div key={ch.key} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 border ${c.checklist[ch.key] ? 'border-emerald-500/20 bg-emerald-500/8' : 'border-slate-700/30 bg-slate-800/30'}`}>
                      {c.checklist[ch.key] ? (
                        <svg className="h-3 w-3 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                      <span className={`text-[10px] font-medium ${c.checklist[ch.key] ? 'text-emerald-300' : 'text-slate-500'}`}>{ch.label}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1 w-full rounded-full bg-slate-800">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    c.stage === 'complete' ? 'bg-emerald-500' : c.stage === 'almost' ? 'bg-teal-500' : c.stage === 'in_progress' ? 'bg-blue-500' : c.stage === 'started' ? 'bg-amber-500' : 'bg-slate-700'
                  }`} style={{ width: `${c.completion_pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
