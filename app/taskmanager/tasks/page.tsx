'use client';

/**
 * /taskmanager/tasks
 * Cross-user view of all portal_tasks with reassign, priority change,
 * snooze, and inline notes.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  assignee_name: string | null;
  assigned_to: string | null;
  client_name: string | null;
  client_id: string | null;
  tat_minutes: number;
  due_at: string;
  created_at: string;
  is_overdue: boolean;
  elapsed_min: number;
  pct_elapsed: number;
  resolution_note: string | null;
}

interface Assignee { id: string; name: string; }
interface Summary  { total: number; pending: number; in_progress: number; overdue: number; urgent: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<string, string> = {
  pending:     'bg-slate-700/50 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed:   'bg-emerald-500/20 text-emerald-300',
  cancelled:   'bg-slate-600/40 text-slate-500',
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-rose-400', high: 'text-amber-400', normal: 'text-slate-300', low: 'text-slate-500',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-rose-400', high: 'bg-amber-400', normal: 'bg-blue-400', low: 'bg-slate-600',
};

function fmtDue(iso: string): string {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = d.getTime() - now.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 0)    return `${Math.abs(mins)}m overdue`;
  if (mins < 60)   return `in ${mins}m`;
  if (mins < 1440) return `in ${Math.round(mins / 60)}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskManagerTasksPage() {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);

  // Filters
  const [fStatus,   setFStatus]   = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fAssignee, setFAssignee] = useState('');
  const [fType,     setFType]     = useState('');
  const [fSearch,   setFSearch]   = useState('');

  // Expanded row state
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [editAssignee, setEditAssignee] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStatus,   setEditStatus]   = useState('');
  const [editNote,     setEditNote]     = useState('');
  const [snoozeMins,   setSnoozeMins]   = useState(60);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/portal-tasks');
    if (res.ok) {
      const d = await res.json();
      setTasks(d.tasks ?? []);
      setAssignees(d.assignees ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter
  const displayed = useMemo(() => {
    let ts = tasks;
    if (fStatus === 'overdue') ts = ts.filter(t => t.is_overdue);
    else if (fStatus)          ts = ts.filter(t => t.status === fStatus);
    if (fPriority) ts = ts.filter(t => t.priority === fPriority);
    if (fAssignee) ts = ts.filter(t => t.assigned_to === fAssignee);
    if (fType)     ts = ts.filter(t => t.task_type === fType);
    if (fSearch) {
      const q = fSearch.toLowerCase();
      ts = ts.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.client_name ?? '').toLowerCase().includes(q) ||
        (t.assignee_name ?? '').toLowerCase().includes(q)
      );
    }
    return ts;
  }, [tasks, fStatus, fPriority, fAssignee, fType, fSearch]);

  // Expand row
  function toggle(task: Task) {
    if (expandedId === task.id) { setExpandedId(null); return; }
    setExpandedId(task.id);
    setEditAssignee(task.assigned_to ?? '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditNote(task.resolution_note ?? '');
    setSnoozeMins(60);
    setSaveMsg(null);
  }

  async function saveChanges(task: Task) {
    setSaving(true);
    const body: Record<string, unknown> = {};
    if (editAssignee !== task.assigned_to) body.assigned_to = editAssignee || null;
    if (editPriority !== task.priority)    body.priority    = editPriority;
    if (editStatus   !== task.status)      body.status      = editStatus;
    if (editNote     !== (task.resolution_note ?? '')) body.resolution_note = editNote;

    const res = await fetch(`/api/taskmanager/portal-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setSaveMsg({ ok: true, text: 'Saved.' });
      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        assigned_to:     editAssignee || null,
        assignee_name:   assignees.find(a => a.id === editAssignee)?.name ?? null,
        priority:        editPriority,
        status:          editStatus,
        resolution_note: editNote,
      } : t));
    } else {
      setSaveMsg({ ok: false, text: d.error || 'Save failed.' });
    }
    setSaving(false);
  }

  async function snooze(task: Task) {
    setSaving(true);
    const newDue = new Date(Date.now() + snoozeMins * 60000).toISOString();
    const res = await fetch(`/api/taskmanager/portal-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_at: newDue }),
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_at: newDue, is_overdue: false } : t));
      setSaveMsg({ ok: true, text: `Snoozed ${snoozeMins}m.` });
    }
    setSaving(false);
  }

  // Unique task types for filter
  const taskTypes = useMemo(() => [...new Set(tasks.map(t => t.task_type))].sort(), [tasks]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Operational Tasks</h1>
        <p className="text-sm text-slate-400 mt-0.5">All portal_tasks across every assigned staff member</p>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {([
            { label: 'Total Open',   val: summary.total,       color: 'text-slate-200' },
            { label: 'Pending',      val: summary.pending,     color: 'text-slate-400' },
            { label: 'In Progress',  val: summary.in_progress, color: 'text-blue-400'  },
            { label: 'Urgent',       val: summary.urgent,      color: 'text-orange-400'},
            { label: 'Overdue',      val: summary.overdue,     color: 'text-rose-400'  },
          ] as const).map(({ label, val, color }) => (
            <div key={label} className="rounded-lg border border-slate-800/60 bg-[#0c1022] px-3 py-2.5 text-center">
              <div className={`text-xl font-bold tabular-nums ${color}`}>{val}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
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
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Search tasks…"
            className="h-8 pl-8 pr-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

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
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select value={fAssignee} onChange={e => setFAssignee(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Assignees</option>
          {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select value={fType} onChange={e => setFType(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">All Types</option>
          {taskTypes.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>

        {(fStatus || fPriority || fAssignee || fType || fSearch) && (
          <button onClick={() => { setFStatus(''); setFPriority(''); setFAssignee(''); setFType(''); setFSearch(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition">
            Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} tasks</span>
      </div>

      {/* Table */}
      {loading && <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">
          No tasks match your filters.
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
          {displayed.map(task => {
            const isExpanded = expandedId === task.id;
            const pctColor   = task.pct_elapsed >= 100 ? 'bg-rose-500' : task.pct_elapsed >= 80 ? 'bg-amber-500' : task.pct_elapsed >= 50 ? 'bg-blue-500' : 'bg-emerald-500';

            return (
              <div key={task.id}>
                <button type="button" onClick={() => toggle(task)}
                  className={`w-full text-left flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-slate-800/30 transition ${isExpanded ? 'bg-slate-800/20' : ''} ${task.is_overdue ? 'border-l-2 border-rose-500' : ''}`}>
                  {/* Priority dot */}
                  <span className={`shrink-0 h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-slate-600'}`} />

                  {/* Title */}
                  <span className={`flex-1 min-w-0 text-xs font-medium truncate ${task.is_overdue ? 'text-rose-200' : 'text-slate-200'}`}>{task.title}</span>

                  {/* Assignee */}
                  {task.assignee_name && (
                    <span className="hidden md:inline shrink-0 text-[10px] text-teal-400/80 border border-teal-500/20 bg-teal-500/5 rounded px-1.5 py-0.5">
                      {task.assignee_name}
                    </span>
                  )}

                  {/* Type */}
                  <span className="hidden lg:inline shrink-0 text-[10px] text-slate-500 border border-slate-700/40 rounded px-1.5 py-0.5 capitalize">
                    {task.task_type.replace(/_/g, ' ')}
                  </span>

                  {/* TAT bar */}
                  <div className="hidden sm:flex shrink-0 items-center gap-1.5 w-28">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${pctColor}`} style={{ width: `${Math.min(task.pct_elapsed, 100)}%` }} />
                    </div>
                    <span className={`text-[10px] tabular-nums font-medium ${task.is_overdue ? 'text-rose-400' : 'text-slate-500'}`}>
                      {fmtDue(task.due_at)}
                    </span>
                  </div>

                  {/* Status */}
                  <span className={`shrink-0 text-[10px] font-medium rounded px-1.5 py-0.5 ${STATUS_CHIP[task.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                    {task.status.replace('_',' ')}
                  </span>

                  <svg className={`shrink-0 h-3.5 w-3.5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-slate-900/30 border-t border-slate-800/40 space-y-3">
                    {task.description && <p className="text-[11px] text-slate-400">{task.description}</p>}

                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      <span>Created: {new Date(task.created_at).toLocaleDateString('en-IN')}</span>
                      {task.client_name && (
                        <Link href={`/manager/clients/${task.client_id}`} className="text-teal-400/80 hover:text-teal-300">
                          Client: {task.client_name} →
                        </Link>
                      )}
                      <span>TAT: {task.tat_minutes}m · Elapsed: {task.elapsed_min}m ({task.pct_elapsed}%)</span>
                    </div>

                    {/* Edit form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {/* Reassign */}
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Assignee</label>
                        <select value={editAssignee} onChange={e => setEditAssignee(e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
                          <option value="">— Unassign —</option>
                          {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Priority</label>
                        <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
                          {['urgent','high','normal','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Status</label>
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500">
                          {['pending','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                        </select>
                      </div>

                      {/* Snooze */}
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Snooze by</label>
                        <div className="flex gap-1">
                          <select value={snoozeMins} onChange={e => setSnoozeMins(Number(e.target.value))}
                            className="flex-1 h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none">
                            {[30,60,120,240,480,1440].map(m => <option key={m} value={m}>{m < 60 ? `${m}m` : `${m/60}h`}</option>)}
                          </select>
                          <button onClick={() => snooze(task)} disabled={saving}
                            className="h-8 px-2 rounded-lg border border-amber-500/30 text-[10px] text-amber-400 hover:bg-amber-500/10 transition disabled:opacity-50">
                            Snooze
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="flex gap-2">
                      <input value={editNote} onChange={e => setEditNote(e.target.value)}
                        placeholder="Resolution note (optional)…"
                        className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                      <button onClick={() => saveChanges(task)} disabled={saving}
                        className="h-8 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-[11px] font-medium text-white transition disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                        {saving ? <><svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving</> : 'Save Changes'}
                      </button>
                    </div>

                    {saveMsg && (
                      <p className={`text-[11px] ${saveMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{saveMsg.text}</p>
                    )}
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
