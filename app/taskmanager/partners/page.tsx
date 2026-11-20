'use client';

/**
 * /taskmanager/partners
 * Partner Network Tracker — EPR intermediaries, channel partners & consultants
 * (profiles with role = 'partner').
 */
import { useEffect, useState, useCallback } from 'react';

interface Partner {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  is_banned: boolean;
  created_at: string;
  last_sign_in: string | null;
  days_since_login: number | null;
  responsiveness: string;
  clients_managed: number;
  tasks: { total: number; done: number; overdue: number; completion_pct: number };
}

interface Summary {
  total: number; active: number; occasional: number;
  inactive: number; dormant: number; never_logged_in: number; banned: number;
}

const RESP_STYLE: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:          { label: 'Active',          dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  occasional:      { label: 'Occasional',      dot: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10'  },
  inactive:        { label: 'Inactive',        dot: 'bg-orange-500',  text: 'text-orange-400',  bg: 'bg-orange-500/10' },
  dormant:         { label: 'Dormant',         dot: 'bg-slate-600',   text: 'text-slate-400',   bg: 'bg-slate-700/20'  },
  never_logged_in: { label: 'Never logged in', dot: 'bg-rose-600',    text: 'text-rose-400',    bg: 'bg-rose-500/10'   },
  banned:          { label: 'Banned',          dot: 'bg-rose-500',    text: 'text-rose-400',    bg: 'bg-rose-900/20'   },
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fResp,    setFResp]    = useState('');
  const [fSearch,  setFSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fResp)   params.set('responsiveness', fResp);
    if (fSearch) params.set('search', fSearch);
    const res = await fetch(`/api/taskmanager/partners?${params}`);
    if (res.ok) {
      const d = await res.json();
      setPartners(d.partners ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, [fResp, fSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Partner Network</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            EPR intermediaries, channel partners and consultants — engagement & activity
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: 'Total',           v: summary.total,           color: 'text-slate-200' },
            { label: 'Active',          v: summary.active,          color: 'text-emerald-400' },
            { label: 'Occasional',      v: summary.occasional,      color: 'text-amber-400' },
            { label: 'Inactive',        v: summary.inactive,        color: 'text-orange-400' },
            { label: 'Dormant',         v: summary.dormant,         color: 'text-slate-400' },
            { label: 'Never Logged In', v: summary.never_logged_in, color: summary.never_logged_in > 0 ? 'text-rose-400' : 'text-slate-600' },
            { label: 'Banned',          v: summary.banned,          color: summary.banned > 0 ? 'text-rose-500' : 'text-slate-600' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-3 text-center">
              <p className="text-[9px] text-slate-500 mb-1 truncate">{item.label}</p>
              <p className={`text-xl font-bold tabular-nums ${item.color}`}>{item.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)}
            placeholder="Search name or email…"
            className="h-8 pl-8 pr-3 w-48 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {(['active','occasional','inactive','dormant','never_logged_in'] as const).map(key => {
          const s = RESP_STYLE[key];
          return (
            <button key={key} onClick={() => setFResp(fResp === key ? '' : key)}
              className={`h-7 px-3 rounded-full text-[11px] font-semibold transition border flex items-center gap-1.5 ${
                fResp === key
                  ? `${s.bg} border-transparent ${s.text}`
                  : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </button>
          );
        })}

        {(fResp || fSearch) && (
          <button onClick={() => { setFResp(''); setFSearch(''); }}
            className="h-7 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">
            Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{partners.length} partners</span>
      </div>

      {/* Table */}
      {loading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      )}

      {!loading && partners.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-12 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-600">No partners match the current filters.</p>
          <p className="text-[11px] text-slate-700 mt-1">Partners are users with role = &apos;partner&apos; in the profiles table.</p>
        </div>
      )}

      {!loading && partners.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-12 px-4 py-2 border-b border-slate-800/50 bg-slate-900/30">
            {[
              { h: 'Partner',        span: 'col-span-4' },
              { h: 'Responsiveness', span: 'col-span-2' },
              { h: 'Clients',        span: 'col-span-1' },
              { h: 'Last Login',     span: 'col-span-2' },
              { h: 'Tasks',          span: 'col-span-2' },
              { h: 'Since',          span: 'col-span-1' },
            ].map(({ h, span }) => (
              <p key={h} className={`text-[10px] font-semibold uppercase tracking-wider text-slate-600 ${span}`}>{h}</p>
            ))}
          </div>

          <div className="divide-y divide-slate-800/40">
            {partners.map(p => {
              const rs = p.is_banned ? RESP_STYLE.banned : (RESP_STYLE[p.responsiveness] ?? RESP_STYLE.dormant);
              const taskPct = p.tasks.total > 0 ? p.tasks.completion_pct : null;

              return (
                <div key={p.id} className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-800/20 transition ${p.is_banned ? 'opacity-50' : ''}`}>

                  {/* Name & email */}
                  <div className="col-span-4 min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {p.company_name || p.name}
                    </p>
                    {p.email && <p className="text-[10px] text-slate-500 truncate">{p.email}</p>}
                    {p.phone && <p className="text-[10px] text-slate-600">{p.phone}</p>}
                  </div>

                  {/* Responsiveness */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${rs.dot}`} />
                    <span className={`text-[10px] font-semibold ${rs.text}`}>{rs.label}</span>
                  </div>

                  {/* Clients managed */}
                  <div className="col-span-1">
                    {p.clients_managed > 0 ? (
                      <span className="text-xs font-bold text-purple-400 tabular-nums">{p.clients_managed}</span>
                    ) : (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </div>

                  {/* Last login */}
                  <div className="col-span-2">
                    {p.days_since_login !== null ? (
                      <span className={`text-xs font-bold tabular-nums ${
                        p.days_since_login <= 7  ? 'text-emerald-400' :
                        p.days_since_login <= 30 ? 'text-amber-400' :
                        p.days_since_login <= 90 ? 'text-orange-400' : 'text-slate-500'
                      }`}>{p.days_since_login}d ago</span>
                    ) : (
                      <span className="text-[10px] text-rose-400/70">Never</span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="col-span-2">
                    {p.tasks.total > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${taskPct === 100 ? 'bg-emerald-500' : 'bg-purple-500/70'}`}
                            style={{ width: `${taskPct ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums">
                          {p.tasks.done}/{p.tasks.total}
                        </span>
                        {p.tasks.overdue > 0 && (
                          <span className="text-[10px] text-rose-400">⚠{p.tasks.overdue}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-700">No tasks</span>
                    )}
                  </div>

                  {/* Joined */}
                  <div className="col-span-1">
                    <span className="text-[10px] text-slate-600">
                      {new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
