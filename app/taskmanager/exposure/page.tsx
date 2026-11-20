'use client';

/**
 * /taskmanager/exposure
 * Revenue & EC Liability Exposure Dashboard
 */
import { useEffect, useState, useCallback } from 'react';

interface CategoryExposure {
  category: string; label: string; color: string;
  affected_clients: number;
  est_shortfall_mt: number;
  est_ec_liability: number;
  risk_level: string;
}
interface RiskClient {
  id: string; client_name: string; manager_name: string | null;
  risk_score: number; overdue_epr: number; overdue_filings: number;
  categories: string[]; est_ec_exposure: number;
}
interface Summary {
  total_ec_liability: number;
  revenue_at_risk: number;
  clients_at_risk: number;
  critical_categories: number;
}

const RISK_STYLE: Record<string, { label: string; text: string; bg: string; bar: string }> = {
  critical: { label: 'Critical', text: 'text-rose-400',    bg: 'bg-rose-500/15',   bar: 'bg-rose-500'    },
  high:     { label: 'High',     text: 'text-orange-400',  bg: 'bg-orange-500/10', bar: 'bg-orange-500'  },
  medium:   { label: 'Medium',   text: 'text-amber-400',   bg: 'bg-amber-500/8',   bar: 'bg-amber-500'   },
  low:      { label: 'Low',      text: 'text-emerald-400', bg: 'bg-emerald-500/5', bar: 'bg-emerald-500' },
};

function fmtCrore(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${(n / 1_000).toFixed(0)}K`;
}

export default function ExposurePage() {
  const [categories,  setCategories]  = useState<CategoryExposure[]>([]);
  const [topClients,  setTopClients]  = useState<RiskClient[]>([]);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [loading,     setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/exposure');
    if (res.ok) {
      const d = await res.json();
      setCategories(d.categories ?? []);
      setTopClients(d.top_risk_clients ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxLiability = categories.reduce((m, c) => Math.max(m, c.est_ec_liability), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Revenue & EC Liability Exposure</h1>
          <p className="text-sm text-slate-400 mt-0.5">Estimated Environmental Compensation risk and revenue exposure by category</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Warning banner */}
      {summary && summary.total_ec_liability > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 flex items-start gap-3">
          <svg className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-rose-300">Environmental Compensation Risk Detected</p>
            <p className="text-[11px] text-rose-400/80 mt-0.5">
              Estimated total EC liability of <strong>{fmtCrore(summary.total_ec_liability)}</strong> across {summary.critical_categories} critical categories. Immediate remediation required.
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Total EC Liability',  v: fmtCrore(summary.total_ec_liability),  color: summary.total_ec_liability > 0 ? 'text-rose-400' : 'text-slate-600', sub: 'est. exposure' },
            { label: 'Revenue at Risk',     v: fmtCrore(summary.revenue_at_risk),     color: summary.revenue_at_risk > 0 ? 'text-orange-400' : 'text-slate-600', sub: 'potential churn' },
            { label: 'Clients at Risk',     v: summary.clients_at_risk,               color: summary.clients_at_risk > 0 ? 'text-amber-400' : 'text-slate-600', sub: 'need intervention' },
            { label: 'Critical Categories', v: summary.critical_categories,           color: summary.critical_categories > 0 ? 'text-rose-400' : 'text-emerald-400', sub: 'urgent action' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
              <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.v}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      )}

      {/* Category exposure cards */}
      {!loading && categories.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">EC Liability by Category</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => {
              const rs = RISK_STYLE[cat.risk_level] ?? RISK_STYLE.low;
              const barPct = maxLiability > 0 ? (cat.est_ec_liability / maxLiability) * 100 : 0;
              return (
                <div key={cat.category} className={`rounded-xl border border-slate-800/60 p-4 space-y-3 ${cat.risk_level === 'critical' ? 'border-rose-500/20 bg-rose-500/5' : 'bg-[#0c1022]'}`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${rs.bar}`} />
                        <p className="text-xs font-bold text-slate-200 capitalize">{cat.label}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{cat.affected_clients} client{cat.affected_clients !== 1 ? 's' : ''} affected</p>
                    </div>
                    <span className={`text-[10px] font-semibold rounded px-2 py-0.5 ${rs.bg} ${rs.text}`}>{rs.label}</span>
                  </div>

                  {/* Liability */}
                  <div>
                    <p className={`text-2xl font-bold tabular-nums ${rs.text}`}>{fmtCrore(cat.est_ec_liability)}</p>
                    <p className="text-[10px] text-slate-600">{cat.est_shortfall_mt} MT est. shortfall</p>
                  </div>

                  {/* Bar */}
                  <div className="h-1 w-full rounded-full bg-slate-800">
                    <div className={`h-full rounded-full ${rs.bar} transition-all duration-500`} style={{ width: `${barPct}%` }} />
                  </div>

                  <p className="text-[10px] text-slate-600">
                    Rate: {cat.category === 'plastic' ? '₹10K' : cat.category === 'ewaste' ? '₹25K' : cat.category === 'battery' ? '₹15K' : cat.category === 'tyre' ? '₹8K' : cat.category === 'used_oil' ? '₹5K' : '₹30K'}/MT
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Top risk clients */}
      {!loading && topClients.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Top Risk Clients</h2>
          <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
            {topClients.map((c, i) => {
              const riskPct = Math.min(c.risk_score, 100);
              const rColor = c.risk_score >= 70 ? 'text-rose-400' : c.risk_score >= 50 ? 'text-orange-400' : c.risk_score >= 30 ? 'text-amber-400' : 'text-slate-400';
              const barColor = c.risk_score >= 70 ? 'bg-rose-500' : c.risk_score >= 50 ? 'bg-orange-500' : c.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="shrink-0 text-[10px] font-bold text-slate-600 w-5 text-center">#{i + 1}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{c.client_name}</span>
                      {c.categories.slice(0, 2).map(cat => (
                        <span key={cat} className="text-[9px] rounded px-1 py-0.5 bg-slate-700/40 text-slate-400 capitalize">{cat.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {c.manager_name ? `Mgr: ${c.manager_name}` : 'Unassigned'} · {c.overdue_epr} EPR OD · {c.overdue_filings} Filing OD
                    </p>
                  </div>

                  {/* EC exposure */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${rColor}`}>{fmtCrore(c.est_ec_exposure)}</p>
                    <p className="text-[10px] text-slate-600">est. EC</p>
                  </div>

                  {/* Risk score */}
                  <div className="shrink-0 w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-600">Risk</span>
                      <span className={`text-[10px] font-bold tabular-nums ${rColor}`}>{c.risk_score}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${riskPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
