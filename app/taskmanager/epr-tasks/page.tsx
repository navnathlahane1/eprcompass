'use client';

/**
 * /taskmanager/epr-tasks
 *
 * Two-tab view for the Task Manager:
 *   Tab 1 — EPR Compliance Tasks   : cross-client view of client_epr_tasks
 *   Tab 2 — Manager Oversight      : epr_oversight portal_tasks linked to
 *                                    each client's EPR progress (for monitoring)
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EprTask {
  id: string;
  client_id: string;
  client_name: string;
  waste_category: string;
  title: string;
  description: string | null;
  frequency: string;
  due_date: string;
  period_label: string;
  status: string;
  priority: string;
  responsible_dept: string | null;
  notes: string | null;
}

interface ClientSummary {
  id: string;
  name: string;
  waste_categories: string[];
  has_tasks: boolean;
  manager_id: string | null;
  manager_name: string | null;
  summary: { total: number; pending: number; in_progress: number; completed: number; overdue: number };
}

interface OversightClient {
  client_id: string;
  client_name: string;
  manager_id: string | null;
  manager_name: string | null;
  has_delay_risk: boolean;
  all_done: boolean;
  epr_summary: { total: number; completed: number; in_progress: number; pending: number; overdue: number; pct_done: number };
  oversight_tasks: OversightTask[];
}

interface OversightTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string;
  is_overdue: boolean;
  manager_name: string | null;
  resolution_note: string | null;
}

interface OversightSummary {
  clients_total: number;
  oversight_total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue_oversight: number;
  at_risk: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CAT_LABEL: Record<string, string> = {
  plastic: 'Plastic', ewaste: 'E-Waste', battery: 'Battery', tyre: 'Tyre',
  used_oil: 'Used Oil', hazardous: 'Hazardous', cd_waste: 'C&D', governance: 'Governance',
};

const CAT_CHIP: Record<string, string> = {
  plastic:    'text-blue-400 border-blue-500/25',
  ewaste:     'text-violet-400 border-violet-500/25',
  battery:    'text-amber-400 border-amber-500/25',
  tyre:       'text-orange-400 border-orange-500/25',
  used_oil:   'text-yellow-400 border-yellow-500/20',
  hazardous:  'text-rose-400 border-rose-500/25',
  cd_waste:   'text-stone-400 border-stone-500/20',
  governance: 'text-teal-400 border-teal-500/25',
};

const STATUS_CHIP: Record<string, string> = {
  pending:     'bg-slate-700/50 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed:   'bg-emerald-500/20 text-emerald-300',
  overdue:     'bg-rose-500/20 text-rose-300',
  skipped:     'bg-slate-600/40 text-slate-500',
  na:          'bg-slate-700/30 text-slate-600',
  cancelled:   'bg-slate-600/30 text-slate-500',
};

function statusLabel(s: string) {
  return s === 'in_progress' ? 'In Progress' : s === 'na' ? 'N/A' : s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function TaskManagerEprPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'epr' | 'oversight'>(
    searchParams.get('tab') === 'oversight' ? 'oversight' : 'epr'
  );

  return (
    <div className="space-y-5">
      {/* Header + tab bar */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">EPR Compliance</h1>
        <p className="text-sm text-slate-400 mt-0.5">FY 2026-27 · Compliance tasks and manager oversight</p>
      </div>

      <div className="flex gap-1 border-b border-slate-800/70">
        {([
          { key: 'epr',      label: 'Client EPR Tasks'  },
          { key: 'oversight', label: 'Manager Oversight' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === key
                ? 'border-orange-400 text-orange-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'epr'      && <EprTasksTab />}
      {tab === 'oversight' && <OversightTab />}
    </div>
  );
}

// ─── Tab 1: Client EPR Tasks ──────────────────────────────────────────────────

function EprTasksTab() {
  const [tasks,    setTasks]    = useState<EprTask[]>([]);
  const [clients,  setClients]  = useState<ClientSummary[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [overall,  setOverall]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  const [fClient,   setFClient]   = useState('');
  const [fManager,  setFManager]  = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fStatus,   setFStatus]   = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fSearch,   setFSearch]   = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote,   setEditNote]   = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ fy: '2026-27' });
    if (fManager) params.set('manager', fManager);
    const res = await fetch(`/api/taskmanager/epr-tasks?${params}`);
    if (res.ok) {
      const d = await res.json();
      setTasks(d.tasks ?? []);
      setClients(d.clients ?? []);
      setOverall(d.summary ?? null);
      setManagers(d.managers ?? []);
    }
    setLoading(false);
  }, [fManager]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    let ts = tasks;
    if (fClient)   ts = ts.filter(t => t.client_id === fClient);
    if (fManager)  ts = ts.filter(t => (t as any).manager_id === fManager);
    if (fCategory) ts = ts.filter(t => t.waste_category === fCategory);
    if (fStatus === 'overdue') ts = ts.filter(t => t.status === 'overdue');
    else if (fStatus) ts = ts.filter(t => t.status === fStatus);
    if (fPriority) ts = ts.filter(t => t.priority === fPriority);
    if (fSearch) {
      const q = fSearch.toLowerCase();
      ts = ts.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.client_name ?? '').toLowerCase().includes(q)
      );
    }
    return ts;
  }, [tasks, fClient, fManager, fCategory, fStatus, fPriority, fSearch]);

  const categories = useMemo(() => [...new Set(tasks.map(t => t.waste_category))].sort(), [tasks]);

  function toggleRow(task: EprTask) {
    if (expandedId === task.id) { setExpandedId(null); return; }
    setExpandedId(task.id);
    setEditStatus(task.status);
    setEditNote(task.notes ?? '');
  }

  async function saveRow(taskId: string) {
    setSaving(true);
    const res = await fetch(`/api/taskmanager/epr-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: editStatus, notes: editNote }),
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: editStatus, notes: editNote } : t));
      setExpandedId(null);
    }
    setSaving(false);
  }

  const os = overall ?? { total: 0, completed: 0, in_progress: 0, pending: 0, overdue: 0 };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {overall && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {([
            { label: 'Total',       val: os.total,       color: 'text-slate-200'  },
            { label: 'Completed',   val: os.completed,   color: 'text-emerald-400'},
            { label: 'In Progress', val: os.in_progress, color: 'text-blue-400'   },
            { label: 'Pending',     val: os.pending,     color: 'text-slate-400'  },
            { label: 'Overdue',     val: os.overdue,     color: 'text-rose-400'   },
          ] as const).map(({ label, val, color }) => (
            <div key={label} className="rounded-lg border border-slate-800/60 bg-[#0c1022] px-3 py-2.5 text-center">
              <div className={`text-xl font-bold tabular-nums ${color}`}>{val}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Client cards */}
      {clients.filter(c => c.has_tasks).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {clients.filter(c => c.has_tasks).map(c => {
            const pct = c.summary.total ? Math.round((c.summary.completed / c.summary.total) * 100) : 0;
            return (
              <button key={c.id} onClick={() => setFClient(fClient === c.id ? '' : c.id)}
                className={`rounded-lg border p-3 text-left transition hover:border-orange-500/30 ${fClient === c.id ? 'border-orange-500/40 bg-orange-500/5' : 'border-slate-800/60 bg-[#0c1022]'}`}>
                <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                {c.manager_name && (
                  <p className="text-[9px] text-teal-400/70 truncate mt-0.5">{c.manager_name}</p>
                )}
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                  <span>{pct}%</span>
                  {c.summary.overdue > 0 && <span className="text-rose-400">⚠ {c.summary.overdue}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search…"
            className="h-8 pl-8 pr-3 w-40 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        {managers.length > 0 && (
          <select value={fManager} onChange={e => setFManager(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
            <option value="">All Managers</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <select value={fCategory} onChange={e => setFCategory(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Statuses</option>
          <option value="overdue">⚠ Overdue</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={fPriority} onChange={e => setFPriority(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        {(fClient || fManager || fCategory || fStatus || fPriority || fSearch) && (
          <button onClick={() => { setFClient(''); setFManager(''); setFCategory(''); setFStatus(''); setFPriority(''); setFSearch(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">
            Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} tasks</span>
      </div>

      {loading && <div className="space-y-2">{[...Array(8)].map((_,i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}
      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">No EPR tasks match your filters.</div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
          {displayed.map(task => {
            const isExpanded = expandedId === task.id;
            const isOver     = task.status === 'overdue';
            return (
              <div key={task.id}>
                <button type="button" onClick={() => toggleRow(task)}
                  className={`w-full text-left flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-slate-800/30 transition ${isExpanded ? 'bg-slate-800/20' : ''} ${isOver ? 'border-l-2 border-rose-500' : ''}`}>
                  <span className={`shrink-0 text-[10px] border rounded px-1.5 py-0.5 ${CAT_CHIP[task.waste_category] ?? 'text-slate-400 border-slate-700'}`}>
                    {CAT_LABEL[task.waste_category] ?? task.waste_category}
                  </span>
                  <span className="shrink-0 text-[10px] text-teal-400/80 border border-teal-500/20 bg-teal-500/5 rounded px-1.5 py-0.5 max-w-[110px] truncate">
                    {task.client_name}
                  </span>
                  <span className={`flex-1 min-w-0 text-xs font-medium truncate ${isOver ? 'text-rose-200' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                  <span className={`shrink-0 text-[10px] tabular-nums ${isOver ? 'text-rose-400' : 'text-slate-500'}`}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </span>
                  <span className={`shrink-0 text-[10px] font-medium rounded px-1.5 py-0.5 ${STATUS_CHIP[task.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                    {statusLabel(task.status)}
                  </span>
                  <svg className={`shrink-0 h-3.5 w-3.5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-slate-900/30 border-t border-slate-800/40 space-y-3">
                    {task.description && <p className="text-[11px] text-slate-400 leading-relaxed">{task.description}</p>}
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      {task.frequency && <span className="border border-slate-700/40 rounded px-1.5 py-0.5 capitalize">{task.frequency.replace('_',' ')}</span>}
                      {task.period_label && <span className="border border-slate-700/40 rounded px-1.5 py-0.5">{task.period_label}</span>}
                      {task.responsible_dept && <span className="border border-slate-700/40 rounded px-1.5 py-0.5">{task.responsible_dept}</span>}
                      <Link href={`/taskmanager/clients?highlight=${task.client_id}`} className="text-teal-400/70 hover:text-teal-300">View client →</Link>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
                        {['pending','in_progress','completed','skipped','na'].map(s =>
                          <option key={s} value={s}>{statusLabel(s)}</option>
                        )}
                      </select>
                      <input value={editNote} onChange={e => setEditNote(e.target.value)}
                        placeholder="Note (optional)…"
                        className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                      <button onClick={() => saveRow(task.id)} disabled={saving}
                        className="h-8 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-[11px] font-medium text-white transition disabled:opacity-50 shrink-0 flex items-center gap-1.5">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
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

// ─── Tab 2: Manager Oversight ─────────────────────────────────────────────────

function OversightTab() {
  const [clients,   setClients]   = useState<OversightClient[]>([]);
  const [summary,   setSummary]   = useState<OversightSummary | null>(null);
  const [managers,  setManagers]  = useState<{ id: string; name: string }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fManager,  setFManager]  = useState('');
  const [fStatus,   setFStatus]   = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Inline oversight task update
  const [editStatus,  setEditStatus]  = useState('');
  const [editNote,    setEditNote]    = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ fy: '2026-27' });
    if (fManager) params.set('manager', fManager);
    if (fStatus)  params.set('status', fStatus);
    const res = await fetch(`/api/taskmanager/epr-oversight?${params}`);
    if (res.ok) {
      const d = await res.json();
      setClients(d.clients ?? []);
      setSummary(d.summary ?? null);
      setManagers(d.managers ?? []);
    }
    setLoading(false);
  }, [fManager, fStatus]);

  useEffect(() => { load(); }, [load]);

  function toggleClient(id: string) {
    setExpandedId(prev => prev === id ? null : id);
    setSaveMsg(null);
  }

  function openTask(t: OversightTask) {
    setEditStatus(t.status);
    setEditNote(t.resolution_note ?? '');
    setEditAssignee('');
  }

  async function saveTask(taskId: string) {
    setSaving(true); setSaveMsg(null);
    const body: Record<string, unknown> = {};
    if (editStatus)  body.status          = editStatus;
    if (editNote)    body.resolution_note = editNote;
    if (editAssignee) body.assigned_to    = editAssignee;

    const res = await fetch(`/api/taskmanager/portal-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setSaveMsg({ id: taskId, ok: true, text: 'Updated.' });
      // Refresh clients
      await load();
    } else {
      setSaveMsg({ id: taskId, ok: false, text: d.error || 'Failed.' });
    }
    setSaving(false);
  }

  const displayed = useMemo(() => {
    return clients; // filtering is server-side via API params
  }, [clients]);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {([
            { label: 'Clients',      val: summary.clients_total,      color: 'text-slate-200'  },
            { label: 'Total Tasks',  val: summary.oversight_total,    color: 'text-slate-300'  },
            { label: 'Pending',      val: summary.pending,            color: 'text-slate-400'  },
            { label: 'In Progress',  val: summary.in_progress,        color: 'text-blue-400'   },
            { label: 'Completed',    val: summary.completed,          color: 'text-emerald-400'},
            { label: 'Overdue',      val: summary.overdue_oversight,  color: 'text-rose-400'   },
            { label: 'At Risk',      val: summary.at_risk,            color: 'text-amber-400'  },
          ] as const).map(({ label, val, color }) => (
            <div key={label} className="rounded-lg border border-slate-800/60 bg-[#0c1022] px-3 py-2.5 text-center">
              <div className={`text-xl font-bold tabular-nums ${color}`}>{val}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* At-risk alert */}
      {summary && summary.at_risk > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-300">
            <span className="font-semibold">{summary.at_risk} client{summary.at_risk > 1 ? 's' : ''}</span> have overdue EPR tasks but their oversight task is still <em>pending</em> — the assigned manager may not have reviewed yet.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={fManager} onChange={e => setFManager(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Managers</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Statuses</option>
          <option value="overdue">⚠ Overdue</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        {(fManager || fStatus) && (
          <button onClick={() => { setFManager(''); setFStatus(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">
            Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} clients</span>
      </div>

      {loading && <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}
      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">No oversight tasks found.</div>
      )}

      {/* Client rows */}
      {!loading && displayed.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
          {displayed.map(client => {
            const isExpanded = expandedId === client.client_id;
            const s = client.epr_summary;
            const pctBar = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
            const barColor = s.overdue > 0
              ? 'bg-rose-500/70'
              : pctBar >= 75
                ? 'bg-emerald-500/70'
                : 'bg-blue-500/70';

            return (
              <div key={client.client_id}>
                {/* Client row */}
                <button
                  type="button"
                  onClick={() => toggleClient(client.client_id)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-800/30 transition flex flex-wrap items-center gap-x-4 gap-y-2 ${isExpanded ? 'bg-slate-800/20' : ''} ${client.has_delay_risk ? 'border-l-2 border-amber-500' : ''}`}
                >
                  {/* Risk badge */}
                  {client.has_delay_risk && (
                    <span className="shrink-0 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400 px-1.5 py-0.5">AT RISK</span>
                  )}
                  {client.all_done && (
                    <span className="shrink-0 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 px-1.5 py-0.5">DONE</span>
                  )}

                  {/* Client name */}
                  <span className="font-semibold text-sm text-slate-200 flex-1 min-w-0 truncate">{client.client_name}</span>

                  {/* Manager chip */}
                  {client.manager_name && (
                    <span className="shrink-0 text-[10px] text-teal-400/80 border border-teal-500/20 bg-teal-500/5 rounded px-1.5 py-0.5">
                      {client.manager_name}
                    </span>
                  )}

                  {/* Oversight tasks count */}
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {client.oversight_tasks.length} oversight task{client.oversight_tasks.length !== 1 ? 's' : ''}
                  </span>

                  {/* EPR progress bar */}
                  <div className="hidden sm:flex shrink-0 items-center gap-2 w-40">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pctBar}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
                      {s.completed}/{s.total}
                      {s.overdue > 0 && <span className="text-rose-400 ml-1">⚠{s.overdue}</span>}
                    </span>
                  </div>

                  <svg className={`shrink-0 h-3.5 w-3.5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded — oversight tasks + EPR summary */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-slate-900/30 border-t border-slate-800/40 space-y-3">

                    {/* EPR summary mini-stats */}
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      <span className="text-slate-500">EPR Tasks:</span>
                      <span className="text-emerald-400">{s.completed} done</span>
                      <span className="text-blue-400">{s.in_progress} in progress</span>
                      <span className="text-slate-400">{s.pending} pending</span>
                      {s.overdue > 0 && <span className="text-rose-400 font-semibold">⚠ {s.overdue} overdue</span>}
                      <span className="text-slate-600">({s.pct_done}% complete)</span>
                      <Link href={`/manager/clients/${client.client_id}`}
                        className="ml-auto text-teal-400/70 hover:text-teal-300 text-[10px]">
                        View client →
                      </Link>
                    </div>

                    {/* Oversight tasks list */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Oversight Tasks</p>
                      {client.oversight_tasks.map(ot => (
                        <OversightTaskRow
                          key={ot.id}
                          task={ot}
                          managers={managers}
                          onSave={saveTask}
                          saving={saving}
                          saveMsg={saveMsg?.id === ot.id ? saveMsg : null}
                          onOpen={() => openTask(ot)}
                          editStatus={editStatus}
                          setEditStatus={setEditStatus}
                          editNote={editNote}
                          setEditNote={setEditNote}
                          editAssignee={editAssignee}
                          setEditAssignee={setEditAssignee}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-600 text-center">
        Oversight tasks are auto-generated when EPR tasks are created for a client.
        Update them to track manager progress and escalate delays.
      </p>
    </div>
  );
}

// ─── Oversight task row (inline edit) ────────────────────────────────────────

interface OtRowProps {
  task: OversightTask;
  managers: { id: string; name: string }[];
  onSave: (id: string) => void;
  saving: boolean;
  saveMsg: { ok: boolean; text: string } | null;
  onOpen: () => void;
  editStatus: string;
  setEditStatus: (s: string) => void;
  editNote: string;
  setEditNote: (n: string) => void;
  editAssignee: string;
  setEditAssignee: (a: string) => void;
}

function OversightTaskRow({
  task, managers, onSave, saving, saveMsg, onOpen,
  editStatus, setEditStatus, editNote, setEditNote, editAssignee, setEditAssignee,
}: OtRowProps) {
  const [open, setOpen] = useState(false);

  function toggle() {
    if (!open) onOpen();
    setOpen(p => !p);
  }

  const dueDate = new Date(task.due_at);
  const isPast  = dueDate < new Date();

  return (
    <div className="rounded-lg border border-slate-800/40 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className={`w-full text-left flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 hover:bg-slate-800/30 transition ${task.is_overdue ? 'border-l-2 border-rose-500' : ''}`}
      >
        {/* Title */}
        <span className={`flex-1 min-w-0 text-[11px] font-medium truncate ${task.is_overdue ? 'text-rose-300' : 'text-slate-200'}`}>
          {task.title}
        </span>

        {/* Due date */}
        <span className={`shrink-0 text-[10px] tabular-nums ${isPast && !['completed','cancelled'].includes(task.status) ? 'text-rose-400' : 'text-slate-500'}`}>
          Due {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>

        {/* Status */}
        <span className={`shrink-0 text-[10px] font-medium rounded px-1.5 py-0.5 ${STATUS_CHIP[task.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
          {statusLabel(task.status)}
        </span>

        <svg className={`shrink-0 h-3 w-3 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 bg-slate-900/40 border-t border-slate-800/30 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Status */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
                {['pending','in_progress','completed','cancelled'].map(s =>
                  <option key={s} value={s}>{statusLabel(s)}</option>
                )}
              </select>
            </div>
            {/* Reassign */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Reassign to</label>
              <select value={editAssignee} onChange={e => setEditAssignee(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
                <option value="">— Keep current ({task.manager_name ?? 'unassigned'}) —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {/* Note + save */}
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] text-slate-500">Resolution note</label>
              <div className="flex gap-1">
                <input value={editNote} onChange={e => setEditNote(e.target.value)}
                  placeholder="Optional note…"
                  className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                <button onClick={() => onSave(task.id)} disabled={saving}
                  className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-[10px] font-semibold text-white disabled:opacity-50 transition shrink-0">
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
          {saveMsg && (
            <p className={`text-[10px] ${saveMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{saveMsg.text}</p>
          )}
        </div>
      )}
    </div>
  );
}
