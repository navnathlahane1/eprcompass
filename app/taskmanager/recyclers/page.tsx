'use client';

/**
 * /taskmanager/recyclers
 * Recycler Network Tracker — profiles with role = 'recycler'.
 */
import { useEffect, useState, useCallback } from 'react';

interface Vendor {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  categories: string[];
  responsiveness: string;
  days_since_login: number | null;
  last_sign_in: string | null;
  created_at: string;
  is_banned: boolean;
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

const CAT_COLOR: Record<string, string> = {
  plastic:   'bg-blue-500/15 text-blue-400',
  ewaste:    'bg-purple-500/15 text-purple-400',
  battery:   'bg-amber-500/15 text-amber-400',
  tyre:      'bg-green-500/15 text-green-400',
  used_oil:  'bg-orange-500/15 text-orange-400',
  hazardous: 'bg-rose-500/15 text-rose-400',
};

export default function RecyclersPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fResp,   setFResp]   = useState('');
  const [fSearch, setFSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fResp)   params.set('responsiveness', fResp);
    if (fSearch) params.set('search', fSearch);
    const res = await fetch(`/api/taskmanager/recyclers?${params}`);
    if (res.ok) {
      const d = await res.json();
      setVendors(d.vendors ?? []);
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
          <h1 className="text-xl font-bold text-slate-100">Recycler Network</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitor recycler engagement, login activity, and task completion
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
            className="h-8 pl-8 pr-3 w-48 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
        <span className="ml-auto text-[11px] text-slate-600">{vendors.length} recyclers</span>
      </div>

      {/* Table */}
      {loading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      )}

      {!loading && vendors.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-12 text-center text-sm text-slate-600">
          No recyclers match the current filters.
        </div>
      )}

      {!loading && vendors.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-12 px-4 py-2 border-b border-slate-800/50 bg-slate-900/30">
            {[
              { h: 'Recycler',       span: 'col-span-4' },
              { h: 'Categories',     span: 'col-span-2' },
              { h: 'Responsiveness', span: 'col-span-2' },
              { h: 'Last Login',     span: 'col-span-2' },
              { h: 'Tasks',          span: 'col-span-1' },
              { h: 'Since',          span: 'col-span-1' },
            ].map(({ h, span }) => (
              <p key={h} className={`text-[10px] font-semibold uppercase tracking-wider text-slate-600 ${span}`}>{h}</p>
            ))}
          </div>

          <div className="divide-y divide-slate-800/40">
            {vendors.map(v => {
              const rs = v.is_banned ? RESP_STYLE.banned : (RESP_STYLE[v.responsiveness] ?? RESP_STYLE.dormant);
              return (
                <div key={v.id} className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-800/20 transition ${v.is_banned ? 'opacity-50' : ''}`}>

                  {/* Name & email */}
                  <div className="col-span-4 min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {v.company_name || v.name}
                    </p>
                    {v.email && <p className="text-[10px] text-slate-500 truncate">{v.email}</p>}
                    {v.phone && <p className="text-[10px] text-slate-600">{v.phone}</p>}
                  </div>

                  {/* Categories */}
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {(v.categories ?? []).slice(0, 2).map(cat => (
                      <span key={cat} className={`text-[9px] rounded px-1.5 py-0.5 font-medium capitalize ${CAT_COLOR[cat] ?? 'bg-slate-700/40 text-slate-400'}`}>
                        {cat.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {(v.categories ?? []).length > 2 && (
                      <span className="text-[9px] text-slate-600">+{(v.categories ?? []).length - 2}</span>
                    )}
                    {(v.categories ?? []).length === 0 && (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </div>

                  {/* Responsiveness */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${rs.dot}`} />
                    <span className={`text-[10px] font-semibold ${rs.text}`}>{rs.label}</span>
                  </div>

                  {/* Last login */}
                  <div className="col-span-2">
                    {v.days_since_login !== null ? (
                      <span className={`text-xs font-bold tabular-nums ${
                        v.days_since_login <= 7  ? 'text-emerald-400' :
                        v.days_since_login <= 30 ? 'text-amber-400' :
                        v.days_since_login <= 90 ? 'text-orange-400' : 'text-slate-500'
                      }`}>{v.days_since_login}d ago</span>
                    ) : (
                      <span className="text-[10px] text-rose-400/70">Never</span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="col-span-1">
                    {v.tasks.total > 0 ? (
                      <div>
                        <span className="text-[10px] text-slate-400 tabular-nums">{v.tasks.done}/{v.tasks.total}</span>
                        {v.tasks.overdue > 0 && (
                          <span className="ml-1 text-[10px] text-rose-400">⚠{v.tasks.overdue}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </div>

                  {/* Joined */}
                  <div className="col-span-1">
                    <span className="text-[10px] text-slate-600">
                      {new Date(v.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
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
