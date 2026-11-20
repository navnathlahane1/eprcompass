'use client';

/**
 * /taskmanager/renewals
 * Certificate Expiry & Renewal Calendar.
 */
import { useEffect, useState, useCallback } from 'react';

interface Certificate {
  id: string; client_id: string; client_name: string;
  manager_name: string | null; category: string; fy_label: string;
  status: string; expiry_date: string | null; days_to_expiry: number | null;
  expiry_tier: string; last_updated: string;
}
interface Summary { total: number; expired: number; critical: number; urgent: number; warning: number; ok: number }

const TIER_STYLE: Record<string, { label: string; bg: string; border: string; text: string; dot: string; pulse?: boolean }> = {
  expired:  { label: 'Expired',    bg: 'bg-rose-900/20',   border: 'border-rose-700/40',    text: 'text-rose-400',   dot: 'bg-rose-600',    pulse: true  },
  critical: { label: 'Critical',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30',    text: 'text-rose-400',   dot: 'bg-rose-500',    pulse: true  },
  urgent:   { label: 'Urgent',     bg: 'bg-orange-500/8',  border: 'border-orange-500/25',  text: 'text-orange-400', dot: 'bg-orange-500'              },
  warning:  { label: 'Warning',    bg: 'bg-amber-500/8',   border: 'border-amber-500/20',   text: 'text-amber-400',  dot: 'bg-amber-500'               },
  soon:     { label: 'Soon',       bg: 'bg-yellow-500/5',  border: 'border-yellow-500/15',  text: 'text-yellow-400', dot: 'bg-yellow-500'              },
  ok:       { label: 'Valid',      bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', text: 'text-emerald-400',dot: 'bg-emerald-500'             },
  unknown:  { label: 'Unknown',    bg: 'bg-slate-800/30',  border: 'border-slate-700/30',   text: 'text-slate-500',  dot: 'bg-slate-600'               },
};
const STATUS_BADGE: Record<string, string> = {
  'Certificate Issued': 'bg-emerald-500/20 text-emerald-300',
  'Approved':           'bg-teal-500/20 text-teal-300',
  'Submitted':          'bg-blue-500/20 text-blue-300',
};

export default function RenewalsPage() {
  const [certs,    setCerts]    = useState<Certificate[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fTier,    setFTier]    = useState('');
  const [fSearch,  setFSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fTier)   params.set('tier',   fTier);
    if (fSearch) params.set('search', fSearch);
    const res = await fetch(`/api/taskmanager/renewals?${params}`);
    if (res.ok) { const d = await res.json(); setCerts(d.certificates ?? []); setSummary(d.summary ?? null); }
    setLoading(false);
  }, [fTier, fSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Certificate Expiry & Renewal Calendar</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track EPR certificate validity and renewal timelines</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { key: 'expired',  label: 'Expired',  v: summary.expired  },
            { key: 'critical', label: 'Critical', v: summary.critical },
            { key: 'urgent',   label: 'Urgent',   v: summary.urgent   },
            { key: 'warning',  label: 'Warning',  v: summary.warning  },
            { key: 'ok',       label: 'Valid',    v: summary.ok       },
            { key: '',         label: 'Total',    v: summary.total    },
          ].map(item => {
            const ts = TIER_STYLE[item.key] ?? { text: 'text-slate-400', bg: 'bg-[#0c1022]', border: 'border-slate-800/60', dot: '', label: '' };
            return (
              <button key={item.key} onClick={() => setFTier(fTier === item.key ? '' : item.key)}
                className={`rounded-xl border p-3 text-center transition hover:brightness-110 ${fTier === item.key ? `${ts.bg} ${ts.border}` : 'bg-[#0c1022] border-slate-800/60'}`}>
                <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${item.v > 0 ? ts.text : 'text-slate-600'}`}>{item.v}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search client or category…"
            className="h-8 pl-8 pr-3 w-52 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        {(fTier || fSearch) && (
          <button onClick={() => { setFTier(''); setFSearch(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{certs.length} certificates</span>
      </div>

      {/* Certificate list */}
      {loading && <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

      {!loading && certs.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">No certificates match.</div>
      )}

      {!loading && certs.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
          {certs.map(cert => {
            const ts = TIER_STYLE[cert.expiry_tier] ?? TIER_STYLE.unknown;
            return (
              <div key={cert.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${cert.expiry_tier === 'expired' || cert.expiry_tier === 'critical' ? ts.bg : ''}`}>
                <span className={`shrink-0 h-2 w-2 rounded-full ${ts.dot} ${ts.pulse ? 'animate-pulse' : ''}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold ${cert.expiry_tier === 'expired' || cert.expiry_tier === 'critical' ? ts.text : 'text-slate-200'}`}>
                      {cert.client_name}
                    </span>
                    <span className="text-[10px] border border-slate-700/40 rounded px-1.5 py-0.5 text-slate-500">{cert.category}</span>
                    <span className="text-[10px] border border-slate-700/40 rounded px-1.5 py-0.5 text-slate-600">{cert.fy_label}</span>
                    <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${STATUS_BADGE[cert.status] ?? 'bg-slate-700/40 text-slate-400'}`}>{cert.status}</span>
                  </div>
                  {cert.manager_name && (
                    <p className="text-[10px] text-slate-500 mt-0.5">Mgr: {cert.manager_name}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold tabular-nums ${ts.text}`}>
                    {cert.days_to_expiry === null ? '—'
                      : cert.days_to_expiry < 0 ? `${Math.abs(cert.days_to_expiry)}d expired`
                      : cert.days_to_expiry === 0 ? 'Expires today!'
                      : `${cert.days_to_expiry}d`}
                  </p>
                  {cert.expiry_date && (
                    <p className="text-[10px] text-slate-600">
                      {new Date(cert.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <span className={`shrink-0 text-[10px] font-semibold rounded px-2 py-1 ${ts.bg} ${ts.text} border ${ts.border}`}>
                  {ts.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
