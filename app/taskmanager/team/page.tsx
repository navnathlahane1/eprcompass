'use client';

/**
 * /taskmanager/team
 * Team Performance & Accountability Dashboard for CCOO.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Member {
  id: string; name: string; role: string;
  total: number; completed: number; overdue: number;
  in_progress: number; pending: number; completion_pct: number;
  sla_pct: number | null; avg_resolution_hours: number | null;
  open_escalations: number; risk: string;
}
interface Department {
  role: string; label: string; member_count: number;
  total_tasks: number; completed_tasks: number; overdue_tasks: number;
  completion_pct: number; avg_sla_pct: number | null; efficiency_score: number;
}
interface Summary {
  total_members: number; avg_sla_pct: number;
  total_tasks: number; total_overdue: number; total_completed: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const RISK_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  low:      { label: 'Low',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  medium:   { label: 'Medium',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
  high:     { label: 'High',     bg: 'bg-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-500'  },
  critical: { label: 'Critical', bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-500'    },
};
const ROLE_COLOR: Record<string, string> = {
  manager:         'bg-rose-500/15 text-rose-300',
  task_manager:    'bg-orange-500/15 text-orange-300',
  user_manager:    'bg-slate-500/15 text-slate-300',
  telecaller:      'bg-violet-500/15 text-violet-300',
  'sales-executive': 'bg-amber-500/15 text-amber-300',
};
function slaColor(p: number | null) {
  if (p === null) return 'bg-slate-700';
  if (p >= 85) return 'bg-emerald-500';
  if (p >= 70) return 'bg-amber-500';
  if (p >= 50) return 'bg-orange-500';
  return 'bg-rose-500';
}
function effColor(e: number) {
  if (e >= 80) return 'bg-emerald-500';
  if (e >= 60) return 'bg-amber-500';
  if (e >= 40) return 'bg-orange-500';
  return 'bg-rose-500';
}
function fmtHours(h: number | null) {
  if (h === null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function TeamPerformancePage() {
  const [members,     setMembers]     = useState<Member[]>([]);
  const [departments, setDepts]       = useState<Department[]>([]);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fRole,       setFRole]       = useState('');
  const [fSearch,     setFSearch]     = useState('');
  const [fRisk,       setFRisk]       = useState('');
  const [sortKey,     setSortKey]     = useState<keyof Member>('overdue');
  const [sortAsc,     setSortAsc]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/team');
    if (res.ok) {
      const d = await res.json();
      setMembers(d.members ?? []);
      setDepts(d.departments ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const roles = useMemo(() => [...new Set(members.map(m => m.role))].sort(), [members]);

  const displayed = useMemo(() => {
    let ms = members;
    if (fRole)   ms = ms.filter(m => m.role   === fRole);
    if (fRisk)   ms = ms.filter(m => m.risk   === fRisk);
    if (fSearch) {
      const q = fSearch.toLowerCase();
      ms = ms.filter(m => m.name.toLowerCase().includes(q));
    }
    return [...ms].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [members, fRole, fRisk, fSearch, sortKey, sortAsc]);

  function toggleSort(k: keyof Member) {
    if (sortKey === k) setSortAsc(v => !v);
    else { setSortKey(k); setSortAsc(false); }
  }

  const SortBtn = ({ k, label }: { k: keyof Member; label: string }) => (
    <button onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${sortKey === k ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'} transition`}>
      {label}
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
        {sortKey === k && sortAsc
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
      </svg>
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Performance & Accountability</h1>
          <p className="text-sm text-slate-400 mt-0.5">KPI tracking · SLA adherence · Efficiency scores</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* KPI Summary Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Team Members',   value: summary.total_members,   suffix: '',  color: 'text-slate-200' },
            { label: 'Avg SLA %',      value: `${summary.avg_sla_pct}%`, suffix: '', color: summary.avg_sla_pct >= 85 ? 'text-emerald-400' : summary.avg_sla_pct >= 70 ? 'text-amber-400' : 'text-rose-400' },
            { label: 'Total Assigned', value: summary.total_tasks,     suffix: '',  color: 'text-slate-200' },
            { label: 'Completed',      value: summary.total_completed, suffix: '',  color: 'text-emerald-400' },
            { label: 'Overdue',        value: summary.total_overdue,   suffix: '',  color: summary.total_overdue > 0 ? 'text-rose-400' : 'text-slate-600' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Department Heatmap */}
      {departments.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/60">
            <h2 className="text-sm font-semibold text-slate-200">Department Efficiency Heatmap</h2>
          </div>
          <div className="divide-y divide-slate-800/40">
            {departments.map(d => (
              <div key={d.role} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{d.label}</p>
                  <p className="text-[10px] text-slate-500">{d.member_count} member{d.member_count !== 1 ? 's' : ''} · {d.total_tasks} tasks</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-500 mb-1">Completion</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${effColor(d.completion_pct)}`} style={{ width: `${d.completion_pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 tabular-nums">{d.completion_pct}%</span>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-500 mb-1">SLA Adherence</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${slaColor(d.avg_sla_pct)}`} style={{ width: `${d.avg_sla_pct ?? 0}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 tabular-nums">
                      {d.avg_sla_pct !== null ? `${d.avg_sla_pct}%` : '—'}
                    </span>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-[10px] text-slate-500 mb-1">Efficiency</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${effColor(d.efficiency_score)}`} style={{ width: `${d.efficiency_score}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 tabular-nums">{d.efficiency_score}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 mb-0.5">Overdue</p>
                  <span className={`text-sm font-bold tabular-nums ${d.overdue_tasks > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                    {d.overdue_tasks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search member…"
            className="h-8 pl-8 pr-3 w-40 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        <select value={fRole} onChange={e => setFRole(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={fRisk} onChange={e => setFRisk(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Risk</option>
          {['critical', 'high', 'medium', 'low'].map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
        </select>
        {(fRole || fRisk || fSearch) && (
          <button onClick={() => { setFRole(''); setFRisk(''); setFSearch(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} members</span>
      </div>

      {/* Member Table */}
      {loading && (
        <div className="space-y-2">{[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
        ))}</div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">
          No team members found.
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_repeat(5,auto)_auto_auto] gap-4 px-4 py-2 border-b border-slate-800/60 bg-slate-900/30">
            <SortBtn k="name"             label="Member"     />
            <SortBtn k="role"             label="Role"       />
            <SortBtn k="total"            label="Assigned"   />
            <SortBtn k="completed"        label="Done"       />
            <SortBtn k="overdue"          label="Overdue"    />
            <SortBtn k="sla_pct"          label="SLA %"      />
            <SortBtn k="avg_resolution_hours" label="Avg Time" />
            <SortBtn k="open_escalations" label="Escalations" />
            <SortBtn k="risk"             label="Risk"       />
          </div>

          <div className="divide-y divide-slate-800/40">
            {displayed.map(m => {
              const rs = RISK_STYLE[m.risk] ?? RISK_STYLE.low;
              return (
                <div key={m.id} className="grid md:grid-cols-[2fr_1fr_repeat(5,auto)_auto_auto] grid-cols-1 items-center gap-3 md:gap-4 px-4 py-3">
                  {/* Name */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[11px] font-bold text-orange-300 select-none">
                      {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-500 md:hidden capitalize">{m.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={`hidden md:inline-block text-[10px] font-medium rounded-md px-1.5 py-0.5 ${ROLE_COLOR[m.role] ?? 'bg-slate-700/40 text-slate-400'}`}>
                    {m.role.replace(/_/g, ' ')}
                  </span>

                  {/* Stats */}
                  <span className="text-xs tabular-nums text-slate-400">{m.total}</span>
                  <span className="text-xs tabular-nums text-emerald-400">{m.completed}</span>
                  <span className={`text-xs tabular-nums font-semibold ${m.overdue > 0 ? 'text-rose-400' : 'text-slate-600'}`}>{m.overdue}</span>

                  {/* SLA bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-800 hidden md:block">
                      <div className={`h-full rounded-full ${slaColor(m.sla_pct)}`}
                        style={{ width: `${m.sla_pct ?? 0}%` }} />
                    </div>
                    <span className={`text-xs tabular-nums font-semibold ${slaColor(m.sla_pct).replace('bg-', 'text-')}`}>
                      {m.sla_pct !== null ? `${m.sla_pct}%` : '—'}
                    </span>
                  </div>

                  {/* Avg time */}
                  <span className="text-xs tabular-nums text-slate-400">{fmtHours(m.avg_resolution_hours)}</span>

                  {/* Escalations */}
                  <span className={`text-xs tabular-nums ${m.open_escalations > 0 ? 'text-orange-400 font-semibold' : 'text-slate-600'}`}>
                    {m.open_escalations > 0 ? m.open_escalations : '—'}
                  </span>

                  {/* Risk */}
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${rs.bg} ${rs.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${rs.dot}`} />
                    {rs.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
