'use client';

/**
 * /portal/epr-tasks
 *
 * FY 2026-27 EPR Compliance Task Calendar for Clients
 * ────────────────────────────────────────────────────
 * - Shows all compliance tasks for the client's waste categories
 * - Organized by Category → Month timeline
 * - Status tracking: pending / in_progress / completed / overdue / skipped / na
 * - One-click status update with notes
 * - Progress bars per category
 * - Critical deadline highlights
 * - "Create Task" to request RM / admin action
 */

import { useCallback, useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped' | 'na';
type Priority   = 'critical' | 'high' | 'normal' | 'low';
type Frequency  = 'monthly' | 'quarterly' | 'annual' | 'one_time' | 'half_yearly' | 'project_based';
type Category   = 'plastic' | 'ewaste' | 'battery' | 'tyre' | 'used_oil' | 'hazardous' | 'cd_waste' | 'governance';

interface EprTask {
  id: string;
  waste_category: Category;
  title: string;
  description: string | null;
  frequency: Frequency;
  responsible_dept: string | null;
  due_date: string;
  period_label: string;
  status: TaskStatus;
  priority: Priority;
  completed_at: string | null;
  notes: string | null;
  evidence_url: string | null;
  fy: string;
}

// ─── Config maps ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<Category, { label: string; short: string; color: string; bg: string; border: string; icon: string }> = {
  plastic:    { label: 'Plastic Waste EPR',      short: 'Plastic',    color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: '♻' },
  ewaste:     { label: 'E-Waste EPR',             short: 'E-Waste',    color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  icon: '⚡' },
  battery:    { label: 'Battery Waste EPR',       short: 'Battery',    color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: '🔋' },
  tyre:       { label: 'Tyre Waste EPR',          short: 'Tyre',       color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  icon: '🔄' },
  used_oil:   { label: 'Used Oil EPR',            short: 'Used Oil',   color: 'text-yellow-300',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  icon: '🛢' },
  hazardous:  { label: 'Hazardous Waste',         short: 'Hazardous',  color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    icon: '⚠' },
  cd_waste:   { label: 'C&D Waste',               short: 'C&D',        color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30',   icon: '🏗' },
  governance: { label: 'Internal Governance',     short: 'Governance', color: 'text-teal-300',    bg: 'bg-teal-500/10',    border: 'border-teal-500/30',    icon: '📋' },
};

const STATUS_META: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  pending:     { label: 'Pending',     color: 'bg-slate-700/60 text-slate-300',   dot: 'bg-slate-500' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300',     dot: 'bg-blue-400' },
  completed:   { label: 'Completed',   color: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400' },
  overdue:     { label: 'Overdue',     color: 'bg-rose-500/20 text-rose-300',     dot: 'bg-rose-400 animate-pulse' },
  skipped:     { label: 'Skipped',     color: 'bg-slate-600/40 text-slate-500',   dot: 'bg-slate-600' },
  na:          { label: 'N/A',         color: 'bg-slate-700/40 text-slate-500',   dot: 'bg-slate-700' },
};

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-rose-400' },
  high:     { label: 'High',     color: 'text-amber-400' },
  normal:   { label: 'Normal',   color: 'text-slate-400' },
  low:      { label: 'Low',      color: 'text-slate-500' },
};

const CATEGORY_ORDER: Category[] = ['plastic', 'ewaste', 'battery', 'tyre', 'used_oil', 'hazardous', 'cd_waste', 'governance'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function daysLeft(d: string) {
  const diff = new Date(d + 'T23:59:59').getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function progressPct(tasks: EprTask[]) {
  if (!tasks.length) return 0;
  const done = tasks.filter(t => t.status === 'completed' || t.status === 'na').length;
  return Math.round((done / tasks.length) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>{label}</span>
        <span className={value >= 80 ? 'text-emerald-400' : value >= 40 ? 'text-amber-400' : 'text-rose-400'}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Task row component ───────────────────────────────────────────────────────

function TaskRow({
  task,
  onUpdate,
}: {
  task: EprTask;
  onUpdate: (id: string, status: TaskStatus, notes: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);
  const [localNotes, setLocalNotes] = useState(task.notes ?? '');
  const days = daysLeft(task.due_date);
  const isOverdue = task.status === 'overdue' || (task.status === 'pending' && days < 0);
  const isCriticalSoon = days >= 0 && days <= 7 && task.status === 'pending';

  async function save() {
    setSaving(true);
    await onUpdate(task.id, localStatus, localNotes);
    setSaving(false);
    setExpanded(false);
  }

  const daysLabel = task.status === 'completed'
    ? ''
    : days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? 'Due today'
        : `${days}d left`;

  const daysColor = task.status === 'completed'
    ? 'text-emerald-500'
    : days < 0
      ? 'text-rose-400 font-bold'
      : days <= 7
        ? 'text-amber-400'
        : 'text-slate-500';

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isOverdue
          ? 'border-rose-500/40 bg-rose-500/5'
          : isCriticalSoon
            ? 'border-amber-500/40 bg-amber-500/5'
            : task.status === 'completed'
              ? 'border-slate-700/30 bg-slate-900/20 opacity-75'
              : 'border-slate-800/60 bg-[#0c1022]'
      }`}
    >
      {/* Row header */}
      <div
        className="flex cursor-pointer items-start gap-3 px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Priority dot */}
        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
          task.priority === 'critical' ? 'bg-rose-500' :
          task.priority === 'high'     ? 'bg-amber-500' :
          task.priority === 'normal'   ? 'bg-slate-500' : 'bg-slate-700'
        }`} />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium ${
              task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'
            }`}>
              {task.title}
            </p>
            {task.priority === 'critical' && (
              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">CRITICAL</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span>{task.period_label}</span>
            <span>·</span>
            <span>{fmtDate(task.due_date)}</span>
            {daysLabel && <span className={daysLabel ? daysColor : ''}>{daysLabel}</span>}
            {task.responsible_dept && (
              <>
                <span>·</span>
                <span>{task.responsible_dept}</span>
              </>
            )}
          </div>
        </div>

        {/* Status badge + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={task.status} />
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-800/60 px-4 py-4 space-y-3">
          {task.description && (
            <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
          )}

          {/* Status selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Update Status</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(['in_progress', 'completed', 'skipped', 'na'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setLocalStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    localStatus === s
                      ? STATUS_META[s].color + ' ring-1 ring-white/20'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Notes / Evidence</label>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              rows={2}
              placeholder="Add completion notes, reference numbers, or evidence URL..."
              className="mt-1 w-full resize-none rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-teal-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {/* Completion timestamp */}
          {task.completed_at && (
            <p className="text-[10px] text-slate-600">
              Completed: {new Date(task.completed_at).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

interface CreatedTask {
  id: string;
  title: string;
  assignee_name: string | null;
}

function CreateTaskModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (task: CreatedTask) => void;
}) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [priority, setPriority] = useState('normal');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/portal/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), priority }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create task.'); return; }
      trackEvent('Client EPR Task Created', { priority });
      onCreate(data.task);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c1022] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100">Request Action from Your Manager</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Creates a task assigned to your RM</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Help with my annual return filing"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Describe what you need help with…"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition">
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────

function SuccessToast({ task, onDismiss }: { task: CreatedTask; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-teal-500/30 bg-[#0c1022] px-4 py-3 shadow-2xl max-w-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/15">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">Task created</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{task.title}</p>
        {task.assignee_name && (
          <p className="text-[11px] text-teal-400 mt-0.5">Assigned to {task.assignee_name}</p>
        )}
      </div>
      <button onClick={onDismiss} className="shrink-0 text-slate-600 hover:text-slate-400">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EprTasksPage() {
  const [tasks, setTasks]           = useState<EprTask[]>([]);
  const [summary, setSummary]       = useState<Record<string, any> | null>(null);
  const [byCategory, setByCategory] = useState<Record<string, any>>({});
  const [loading, setLoading]       = useState(true);
  const [noTasks, setNoTasks]       = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter]     = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [showModal, setShowModal]           = useState(false);
  const [successTask, setSuccessTask]       = useState<CreatedTask | null>(null);

  const FY = '2026-27';

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, summaryRes] = await Promise.all([
        fetch(`/api/portal/epr-tasks?fy=${FY}`),
        fetch(`/api/portal/epr-tasks?fy=${FY}&summary=1`),
      ]);

      if (tasksRes.ok) {
        const d = await tasksRes.json();
        const t = d.tasks ?? [];
        setTasks(t);
        setNoTasks(t.length === 0);
      }

      if (summaryRes.ok) {
        const s = await summaryRes.json();
        setSummary(s.summary ?? null);
        setByCategory(s.byCategory ?? {});
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function handleUpdate(id: string, status: TaskStatus, notes: string) {
    const res = await fetch(`/api/portal/epr-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (res.ok) {
      trackEvent('Client EPR Task Updated', { status });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status, notes, completed_at: status === 'completed' ? new Date().toISOString() : t.completed_at }
            : t
        )
      );
    }
  }

  // Filter tasks
  const filtered = tasks.filter((t) => {
    if (activeCategory !== 'all' && t.waste_category !== activeCategory) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  // Get unique categories present in tasks
  const presentCategories = CATEGORY_ORDER.filter((c) =>
    tasks.some((t) => t.waste_category === c)
  );

  // Group filtered tasks by category
  const grouped: Partial<Record<Category, EprTask[]>> = {};
  for (const t of filtered) {
    if (!grouped[t.waste_category]) grouped[t.waste_category] = [];
    grouped[t.waste_category]!.push(t);
  }

  // Sort each group by due_date
  for (const cat in grouped) {
    grouped[cat as Category]!.sort((a, b) => a.due_date.localeCompare(b.due_date));
  }

  // Critical upcoming tasks (next 30 days, not completed)
  const criticalTasks = tasks
    .filter((t) => {
      const d = daysLeft(t.due_date);
      return (t.priority === 'critical' || t.status === 'overdue') &&
             !['completed', 'na', 'skipped'].includes(t.status) &&
             d <= 30;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);

  if (loading) return (
    <div className="space-y-4 p-1">
      <div className="h-24 rounded-xl bg-slate-800/40 animate-pulse" />
      <div className="h-64 rounded-xl bg-slate-800/30 animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">EPR Compliance Calendar</h1>
                <p className="text-xs text-slate-500">Financial Year {FY} — India EPR Master Task List</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 font-semibold">
              Annual Return Deadline: 30 June 2027
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-[11px] font-semibold text-teal-300 hover:bg-teal-500/20 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Request Action
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { label: 'Total',       value: summary.total,       color: 'text-slate-100' },
              { label: 'Completed',   value: summary.completed,   color: 'text-emerald-400' },
              { label: 'In Progress', value: summary.in_progress, color: 'text-blue-400' },
              { label: 'Pending',     value: summary.pending,     color: 'text-slate-400' },
              { label: 'Overdue',     value: summary.overdue,     color: 'text-rose-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-center">
                <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value ?? 0}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Category progress */}
        {Object.keys(byCategory).length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_ORDER
              .filter((c) => byCategory[c])
              .map((c) => {
                const meta = CATEGORY_META[c];
                const cat  = byCategory[c];
                const pct  = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                return (
                  <div key={c} className={`rounded-lg border p-3 ${meta.bg} ${meta.border}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">{meta.icon}</span>
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.short}</span>
                      {cat.overdue > 0 && (
                        <span className="ml-auto rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">
                          {cat.overdue} overdue
                        </span>
                      )}
                    </div>
                    <ProgressBar value={pct} label={`${cat.completed}/${cat.total} done`} />
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* No tasks state */}
      {noTasks && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-12 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-3 text-sm font-semibold text-slate-400">No compliance tasks generated yet</p>
          <p className="mt-1 text-xs text-slate-600">Your compliance manager will generate your FY 2026-27 task list shortly. Contact support if this persists.</p>
        </div>
      )}

      {/* Critical / Overdue Alert */}
      {criticalTasks.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-rose-300">Action Required — Critical & Overdue Tasks</p>
          </div>
          <div className="space-y-1.5">
            {criticalTasks.map((t) => {
              const d = daysLeft(t.due_date);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-rose-100">{t.title}</p>
                    <p className="text-[10px] text-rose-300/70">{CATEGORY_META[t.waste_category].short} · {fmtDate(t.due_date)}</p>
                  </div>
                  <span className={`text-xs font-bold tabular-nums shrink-0 ${d < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `${d}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeCategory === 'all'
                  ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                  : 'bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({tasks.length})
            </button>
            {presentCategories.map((c) => {
              const meta = CATEGORY_META[c];
              const count = tasks.filter(t => t.waste_category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeCategory === c
                      ? `${meta.bg} border ${meta.border} ${meta.color}`
                      : 'bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {meta.icon} {meta.short} ({count})
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-full border border-slate-700/40 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
            <option value="na">N/A</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-full border border-slate-700/40 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      {/* Task lists by category */}
      {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((c) => {
        const meta = CATEGORY_META[c];
        const catTasks = grouped[c]!;
        const pct = progressPct(catTasks);
        return (
          <section key={c}>
            {/* Category header */}
            <div className={`flex items-center justify-between rounded-t-xl border border-b-0 px-4 py-3 ${meta.bg} ${meta.border}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <h2 className={`text-sm font-bold ${meta.color}`}>{meta.label}</h2>
                  <p className="text-[10px] text-slate-500">{catTasks.length} tasks · {pct}% complete</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block w-24">
                  <ProgressBar value={pct} label="" />
                </div>
              </div>
            </div>

            {/* Task rows */}
            <div className={`rounded-b-xl border border-t-0 ${meta.border} divide-y divide-slate-800/40 overflow-hidden`}>
              {catTasks.map((t) => (
                <TaskRow key={t.id} task={t} onUpdate={handleUpdate} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Legal notes footer */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold text-amber-300 mb-2">⚖ Important Legal Notes — FY 2026-27</p>
          <ul className="space-y-1 text-[11px] text-amber-200/70 list-disc list-inside">
            <li>100% EPR fulfilment obligation continues under phased implementation for all categories.</li>
            <li>Environmental Compensation (EC) may apply for any shortfall in EPR targets.</li>
            <li>Annual returns for all categories are due <strong>June 30, 2027</strong> unless extended by MoEFCC.</li>
            <li>All EPR certificates must be from CPCB-registered recyclers/processors — verify before procurement.</li>
            <li>Fake recycling certificates and recycler fraud are high-risk areas — conduct internal audit quarterly.</li>
            <li>Timeline extensions, if granted by MoEFCC, will be communicated separately.</li>
          </ul>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={(task) => { setShowModal(false); setSuccessTask(task); }}
        />
      )}

      {/* Success Toast */}
      {successTask && (
        <SuccessToast task={successTask} onDismiss={() => setSuccessTask(null)} />
      )}
    </div>
  );
}
