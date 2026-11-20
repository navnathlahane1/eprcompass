'use client';

import { useEffect, useState } from 'react';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildTenderingSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function daysLabel(d: number) {
  if (d < 0) return { text: 'Overdue', cls: 'text-rose-400' };
  if (d === 0) return { text: 'Today', cls: 'text-rose-400 animate-pulse' };
  if (d <= 2) return { text: `${d}d left`, cls: 'text-rose-400 font-bold' };
  if (d <= 7) return { text: `${d}d left`, cls: 'text-amber-400' };
  return { text: `${d}d left`, cls: 'text-slate-400' };
}

const STATUS_COLORS: Record<string, string> = {
  new:        'bg-blue-500/10 text-blue-300 border-blue-500/20',
  evaluating: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  bidding:    'bg-amber-500/10 text-amber-300 border-amber-500/20',
  submitted:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  won:        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  lost:       'bg-rose-500/10 text-rose-300 border-rose-500/20',
  cancelled:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_BAR_COLORS: Record<string, string> = {
  new:        'bg-blue-500',
  evaluating: 'bg-violet-500',
  bidding:    'bg-amber-500',
  submitted:  'bg-indigo-500',
  won:        'bg-emerald-500',
  lost:       'bg-rose-500',
  cancelled:  'bg-slate-500',
};

interface DashboardData {
  kpis: {
    totalTenders: number; activeBids: number; wonTenders: number; lostTenders: number;
    successRate: number; totalContractValue: number; avgBidValue: number; tendersDueIn7Days: number;
  };
  statusBreakdown: { status: string; label: string; count: number; value: number }[];
  urgentTenders: any[];
  recentActivity: any[];
  topCategories: { category: string; count: number; won: number }[];
}

export default function TenderingDashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/tendering/dashboard');
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-rose-400 text-sm">{error}</p>
      <button onClick={load} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
    </div>
  );

  if (!data) return null;

  const { kpis, statusBreakdown, urgentTenders, recentActivity, topCategories } = data;
  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1);

  const kpiCards = [
    { label: 'Total Tenders',       value: kpis.totalTenders,                       sub: `${kpis.tendersDueIn7Days} due this week`, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'amber'  },
    { label: 'Active Bids',         value: kpis.activeBids,                          sub: 'in progress',                              icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', color: 'blue'    },
    { label: 'Tenders Won',         value: kpis.wonTenders,                          sub: 'awarded',                                  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       color: 'emerald' },
    { label: 'Tenders Lost',        value: kpis.lostTenders,                         sub: 'not awarded',                              icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               color: 'rose'    },
    { label: 'Success Rate',        value: `${kpis.successRate}%`,                   sub: 'win rate',                                 icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          color: 'violet'  },
    { label: 'Contract Value',      value: fmt(kpis.totalContractValue),             sub: 'active contracts',                         icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           color: 'amber'  },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    amber:   { bg: 'bg-amber-500/10',   icon: 'text-amber-400',   text: 'text-amber-300'   },
    blue:    { bg: 'bg-blue-500/10',    icon: 'text-blue-400',    text: 'text-blue-300'    },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', text: 'text-emerald-300' },
    rose:    { bg: 'bg-rose-500/10',    icon: 'text-rose-400',    text: 'text-rose-300'    },
    violet:  { bg: 'bg-violet-500/10',  icon: 'text-violet-400',  text: 'text-violet-300'  },
  };

  const tenderingSetupSteps = buildTenderingSetupSteps({
    hasActiveTenders: (data?.kpis?.totalTenders ?? 0) > 0,
    hasReviewedDeadlines: (data?.kpis?.tendersDueIn7Days ?? 0) > 0,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={tenderingSetupSteps}
          portalKey="tendering"
          accentColor="blue"
          dark={true}
        />
      </TourTarget>
      <div>
        <h1 className="text-xl font-bold text-slate-100">Tendering Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Overview of your tendering pipeline and bid performance.</p>
      </div>

      {/* KPI Cards */}
      <TourTarget id="dash-kpi-cards" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((k) => {
          const c = colorMap[k.color];
          return (
            <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${c.icon}`} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d={k.icon} />
                </svg>
              </div>
              <div>
                <p className={`text-2xl font-bold ${c.text}`}>{k.value}</p>
                <p className="text-[11px] text-slate-400">{k.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
              </div>
            </div>
          );
        })}
      </TourTarget>

      <TourTarget id="dash-status-breakdown" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {statusBreakdown.map(s => (
              <div key={s.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[s.status] ?? 'bg-slate-500/10 text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>{s.count} tenders</span>
                    <span className="text-slate-600">{fmt(s.value)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[s.status] ?? 'bg-slate-500'}`}
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Top Categories</h2>
          {topCategories.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(cat => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-300 capitalize">{cat.category}</p>
                    <p className="text-[10px] text-slate-500">{cat.won} won / {cat.count} total</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {cat.count > 0 ? `${Math.round((cat.won / cat.count) * 100)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TourTarget>

      {/* Urgent Tenders */}
      {urgentTenders.length > 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-rose-300">Urgent — Deadlines within 7 days</h2>
          </div>
          <div className="space-y-2">
            {urgentTenders.map((t: any) => {
              const dl = daysLabel(t.days_remaining);
              return (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500">{t.authority} · {t.tender_no}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-xs font-bold ${dl.cls}`}>{dl.text}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[t.status] ?? ''}`}>
                      {t.status}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:block">{t.assigned_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <TourTarget id="dash-recent-activity" className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No tenders yet. Create your first tender to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tender</th>
                  <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Category</th>
                  <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentActivity.map((t: any) => {
                  const dl = t.days_remaining != null ? daysLabel(t.days_remaining) : null;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-slate-200 truncate max-w-[200px]">{t.title}</p>
                        <p className="text-[11px] text-slate-500">{t.tender_no}</p>
                      </td>
                      <td className="py-2.5 pr-3 hidden md:table-cell">
                        <span className="text-xs text-slate-400 capitalize">{t.category}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[t.status] ?? ''}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {dl && <span className={`text-xs font-medium ${dl.cls}`}>{dl.text}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TourTarget>
    </div>
  );
}
