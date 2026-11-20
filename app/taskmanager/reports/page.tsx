'use client';

/**
 * /taskmanager/reports
 * Management Reports for CCOO.
 * Tabs: Summary | Delayed | Department | Risk Items
 */
import { useEffect, useState, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */
type ReportTab = 'summary' | 'delayed' | 'department' | 'risk';

interface SummaryData {
  generated_at: string; risk_score: number;
  portal_tasks:     { total: number; overdue: number; pending: number; in_progress: number; done: number; critical: number; high: number };
  epr_tasks:        { total: number; overdue: number; pending: number; in_progress: number; completed: number; by_category: Record<string, number> };
  filings:          { total: number; overdue: number; by_status: Record<string, number> };
  service_requests: { total: number; stale: number; open: number };
  escalations:      { active: number; critical: number };
}
interface DelayedItem {
  id: string; source: string; title: string; subtitle: string;
  priority: string; due: string; hours_overdue: number;
  assignee: string | null; client: string | null;
}
interface Department {
  role: string; label: string; member_count: number;
  total_tasks: number; completed_tasks: number; overdue_tasks: number;
  completion_pct: number; sla_pct: number | null;
  avg_resolution_hours: number | null; efficiency: number;
}
interface RiskItem {
  source: string; risk_level: string; title: string;
  subtitle: string; due: string | null;
  assignee: string | null; risk_reason: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const SOURCE_COLOR: Record<string, string> = {
  portal_task:  'bg-violet-500/20 text-violet-300',
  epr_task:     'bg-blue-500/20 text-blue-300',
  filing:       'bg-teal-500/20 text-teal-300',
  escalation:   'bg-rose-500/20 text-rose-300',
};
function riskScoreStyle(s: number) {
  if (s >= 70) return { color: 'text-rose-400',    bar: 'bg-rose-500',    label: 'HIGH RISK'   };
  if (s >= 40) return { color: 'text-amber-400',   bar: 'bg-amber-500',   label: 'MODERATE'    };
  if (s >= 20) return { color: 'text-yellow-400',  bar: 'bg-yellow-500',  label: 'LOW RISK'    };
  return             { color: 'text-emerald-400',  bar: 'bg-emerald-500', label: 'HEALTHY'     };
}
function effColor(e: number) {
  if (e >= 80) return 'bg-emerald-500';
  if (e >= 60) return 'bg-amber-500';
  if (e >= 40) return 'bg-orange-500';
  return 'bg-rose-500';
}
function fmtHoursOvd(h: number) {
  if (h < 1)  return `${Math.round(h * 60)}m overdue`;
  if (h < 24) return `${Math.round(h)}h overdue`;
  return `${Math.round(h / 24)}d overdue`;
}

/* ─── Sub-component: Source-wise stat card ─────────────────────────────────── */
function SourceCard({ title, accent, items }: {
  title: string; accent: string;
  items: { label: string; value: number | string; highlight?: boolean }[];
}) {
  return (
    <div className={`rounded-xl border bg-[#0c1022] p-4 space-y-3 ${accent}`}>
      <p className="text-xs font-bold text-slate-300">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <div key={item.label} className="space-y-0.5">
            <p className="text-[10px] text-slate-500">{item.label}</p>
            <p className={`text-xl font-bold tabular-nums ${item.highlight ? 'text-rose-400' : 'text-slate-200'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [tab,          setTab]         = useState<ReportTab>('summary');
  const [summaryData,  setSummaryData] = useState<SummaryData | null>(null);
  const [delayedItems, setDelayedItems]= useState<DelayedItem[]>([]);
  const [departments,  setDepts]       = useState<Department[]>([]);
  const [riskItems,    setRiskItems]   = useState<RiskItem[]>([]);
  const [loading,      setLoading]     = useState(false);

  const load = useCallback(async (t: ReportTab) => {
    setLoading(true);
    const res = await fetch(`/api/taskmanager/reports?type=${t}`);
    if (res.ok) {
      const d = await res.json();
      if (t === 'summary')    setSummaryData(d);
      if (t === 'delayed')    setDelayedItems(d.items ?? []);
      if (t === 'department') setDepts(d.departments ?? []);
      if (t === 'risk')       setRiskItems(d.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const TAB_LIST: { key: ReportTab; label: string }[] = [
    { key: 'summary',    label: 'Executive Summary' },
    { key: 'delayed',    label: 'Delayed Tasks'      },
    { key: 'department', label: 'Department View'    },
    { key: 'risk',       label: 'Risk Items'         },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Management Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Operational health · Delay analysis · Department KPIs · Risk exposure</p>
        </div>
        <button onClick={() => load(tab)} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800/60 pb-0">
        {TAB_LIST.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${
              tab === key
                ? 'border-orange-500 text-orange-300 bg-orange-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />
        ))}</div>
      )}

      {/* ── Summary ── */}
      {!loading && tab === 'summary' && summaryData && (() => {
        const rs = riskScoreStyle(summaryData.risk_score);
        return (
          <div className="space-y-5">
            {/* Risk Score */}
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Overall Risk Score</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className={`text-4xl font-bold tabular-nums ${rs.color}`}>{summaryData.risk_score}</span>
                    <span className="text-slate-600 text-sm mb-1">/100</span>
                    <span className={`text-xs font-bold mb-1 ${rs.color}`}>{rs.label}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 text-right">
                  Generated<br />
                  {new Date(summaryData.generated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className={`h-full rounded-full transition-all ${rs.bar}`} style={{ width: `${summaryData.risk_score}%` }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Score based on overdue tasks, SLA breaches, stale service requests and active escalations.
              </p>
            </div>

            {/* Source cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SourceCard title="Operational Tasks" accent="border-violet-500/20"
                items={[
                  { label: 'Total',      value: summaryData.portal_tasks.total       },
                  { label: 'Overdue',    value: summaryData.portal_tasks.overdue,    highlight: summaryData.portal_tasks.overdue > 0 },
                  { label: 'In Progress',value: summaryData.portal_tasks.in_progress },
                  { label: 'Done',       value: summaryData.portal_tasks.done        },
                ]} />
              <SourceCard title="EPR Compliance Tasks" accent="border-blue-500/20"
                items={[
                  { label: 'Total',      value: summaryData.epr_tasks.total          },
                  { label: 'Overdue',    value: summaryData.epr_tasks.overdue,       highlight: summaryData.epr_tasks.overdue > 0 },
                  { label: 'In Progress',value: summaryData.epr_tasks.in_progress    },
                  { label: 'Completed',  value: summaryData.epr_tasks.completed      },
                ]} />
              <SourceCard title="Filing SLAs" accent="border-teal-500/20"
                items={[
                  { label: 'Total',    value: summaryData.filings.total             },
                  { label: 'Overdue',  value: summaryData.filings.overdue,          highlight: summaryData.filings.overdue > 0 },
                  { label: 'Open SR',  value: summaryData.service_requests.open     },
                  { label: 'Stale SR', value: summaryData.service_requests.stale,   highlight: summaryData.service_requests.stale > 0 },
                ]} />
              <SourceCard title="Escalations" accent="border-rose-500/20"
                items={[
                  { label: 'Active',    value: summaryData.escalations.active,   highlight: summaryData.escalations.active > 0 },
                  { label: 'Critical',  value: summaryData.escalations.critical, highlight: summaryData.escalations.critical > 0 },
                  { label: 'Critical PT', value: summaryData.portal_tasks.critical, highlight: summaryData.portal_tasks.critical > 0 },
                  { label: 'High PT',     value: summaryData.portal_tasks.high    },
                ]} />
            </div>

            {/* EPR by category */}
            {Object.keys(summaryData.epr_tasks.by_category).length > 0 && (
              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                <p className="text-xs font-semibold text-slate-300 mb-3">EPR Tasks by Category</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(summaryData.epr_tasks.by_category).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/30 px-3 py-2">
                      <span className="text-[10px] text-slate-500 truncate">{cat.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold text-slate-300 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filing by status */}
            {Object.keys(summaryData.filings.by_status).length > 0 && (
              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                <p className="text-xs font-semibold text-slate-300 mb-3">Filing Status Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(summaryData.filings.by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/30 px-3 py-2">
                      <span className="text-[10px] text-slate-500 truncate">{status}</span>
                      <span className="text-xs font-bold text-slate-300 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Delayed ── */}
      {!loading && tab === 'delayed' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">{delayedItems.length} overdue items across all sources — sorted by delay severity</p>
          {delayedItems.length === 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-8 text-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-400 font-medium">No overdue items. Zero delays.</p>
            </div>
          )}
          {delayedItems.map(item => (
            <div key={item.id} className="rounded-xl border border-slate-800/60 bg-[#0c1022] flex flex-wrap items-center gap-3 px-4 py-3">
              <span className={`shrink-0 text-[10px] font-medium rounded px-1.5 py-0.5 ${SOURCE_COLOR[item.source] ?? 'bg-slate-700/40 text-slate-400'}`}>
                {item.source.replace(/_/g, ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {item.subtitle}
                  {item.client && <span className="ml-1.5">· {item.client}</span>}
                  {item.assignee && <span className="ml-1.5 text-teal-400/80">· {item.assignee}</span>}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold tabular-nums text-rose-400">{fmtHoursOvd(item.hours_overdue)}</p>
                {item.due && (
                  <p className="text-[10px] text-slate-600">
                    was due {new Date(item.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Department ── */}
      {!loading && tab === 'department' && (
        <div className="space-y-2">
          {departments.length === 0 ? (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-8 text-center text-sm text-slate-600">
              No department data available.
            </div>
          ) : departments.map(d => (
            <div key={d.role} className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-200">{d.label}</p>
                  <p className="text-[10px] text-slate-500">{d.member_count} member{d.member_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${d.efficiency >= 80 ? 'text-emerald-400' : d.efficiency >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {d.efficiency}% efficiency
                  </p>
                  {d.overdue_tasks > 0 && (
                    <p className="text-[10px] text-rose-400">{d.overdue_tasks} overdue</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Assigned', value: d.total_tasks,      color: 'text-slate-300' },
                  { label: 'Completed',value: d.completed_tasks,  color: 'text-emerald-400' },
                  { label: 'Overdue',  value: d.overdue_tasks,    color: d.overdue_tasks > 0 ? 'text-rose-400' : 'text-slate-600' },
                  { label: 'SLA %',    value: d.sla_pct !== null ? `${d.sla_pct}%` : '—',
                    color: d.sla_pct === null ? 'text-slate-600' : d.sla_pct >= 85 ? 'text-emerald-400' : d.sla_pct >= 70 ? 'text-amber-400' : 'text-rose-400' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-slate-900/40 py-2">
                    <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-slate-600">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Efficiency bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                  <span>Completion {d.completion_pct}%</span>
                  {d.avg_resolution_hours && <span>Avg resolution: {d.avg_resolution_hours}h</span>}
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800">
                  <div className={`h-full rounded-full ${effColor(d.completion_pct)}`} style={{ width: `${d.completion_pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Risk Items ── */}
      {!loading && tab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{riskItems.length} high-risk items requiring immediate attention</p>
          {riskItems.length === 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-8 text-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-400 font-medium">No critical risk items at this time.</p>
            </div>
          )}
          {riskItems.map((item, i) => (
            <div key={`${item.source}-${i}`}
              className={`rounded-xl border border-l-4 px-4 py-3 ${
                item.risk_level === 'critical'
                  ? 'border-l-rose-500 border-slate-800/60 bg-rose-500/5'
                  : 'border-l-orange-500 border-slate-800/60 bg-orange-500/3'
              }`}>
              <div className="flex flex-wrap items-start gap-3">
                <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${SOURCE_COLOR[item.source] ?? 'bg-slate-700/40 text-slate-400'}`}>
                  {item.source.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${item.risk_level === 'critical' ? 'text-rose-200' : 'text-slate-200'}`}>
                    {item.title}
                  </p>
                  {item.subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{item.subtitle}</p>}
                  <p className={`text-[10px] mt-0.5 ${item.risk_level === 'critical' ? 'text-rose-400/80' : 'text-orange-400/80'}`}>
                    ⚡ {item.risk_reason}
                  </p>
                </div>
                {item.assignee && (
                  <span className="text-[10px] text-teal-400/70 shrink-0">
                    {item.assignee}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
