'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  client_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  tat_minutes: number;
  due_at: string;
  created_at: string;
  completed_at: string | null;
  elapsed_min: number;
  is_overdue: boolean;
  actual_tat_min: number | null;
  resolution_note: string | null;
}

interface Summary {
  pending: number;
  in_progress: number;
  overdue: number;
  completed: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TASK_TYPE_LABEL: Record<string, string> = {
  document_review:         'Document Review',
  document_rereview:       'Document Re-review',
  client_onboarding:       'Client Onboarding',
  filing_review:           'Filing Review',
  filing_status_oversight: 'Filing Oversight',
  general:                 'General',
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  high:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  normal: 'bg-slate-700/40 text-slate-400 border-slate-700/40',
  low:    'bg-slate-800/40 text-slate-500 border-slate-700/30',
};

const TYPE_ICON: Record<string, string> = {
  document_review:         'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  document_rereview:       'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  client_onboarding:       'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  filing_review:           'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  filing_status_oversight: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  general:                 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
};

function formatElapsed(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatRemaining(task: PortalTask): string {
  const remainingMs = new Date(task.due_at).getTime() - Date.now();
  if (remainingMs <= 0) return 'overdue';
  const min = Math.floor(remainingMs / 60000);
  return `${formatElapsed(min)} left`;
}

// ─── TAT Badge ────────────────────────────────────────────────────────────────

function TATBadge({ task }: { task: PortalTask }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Tick every 30 seconds to keep elapsed time fresh
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (task.status === 'completed' && task.actual_tat_min !== null) {
    const overBudget = task.actual_tat_min > task.tat_minutes;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
        overBudget
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      }`}>
        {overBudget ? '⚠' : '✓'} TAT: {formatElapsed(task.actual_tat_min)}
        {overBudget && ` (+${formatElapsed(task.actual_tat_min - task.tat_minutes)})`}
      </span>
    );
  }

  if (['cancelled'].includes(task.status)) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-slate-700/40 text-slate-500 border-slate-700/40">
        Cancelled
      </span>
    );
  }

  const elapsedMs  = now - new Date(task.created_at).getTime();
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const isOverdue  = task.due_at < new Date(now).toISOString();
  const pct        = Math.min((elapsedMin / task.tat_minutes) * 100, 100);

  if (isOverdue) {
    const overMin = elapsedMin - task.tat_minutes;
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse">
        ⚠ OVERDUE +{formatElapsed(overMin)}
      </span>
    );
  }

  const color = pct < 50
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : pct < 80
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${color}`}>
      {formatElapsed(elapsedMin)} / {task.tat_minutes}m
    </span>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onUpdate,
}: {
  task: PortalTask;
  onUpdate: (id: string, newStatus: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const isDone = ['completed', 'cancelled'].includes(task.status);

  async function handleAction(newStatus: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resolution_note: note || undefined }),
      });
      if (res.ok) {
        onUpdate(task.id, newStatus);
        setNote('');
        setShowNote(false);
      }
    } finally {
      setSaving(false);
    }
  }

  const typeIcon = TYPE_ICON[task.task_type] || TYPE_ICON.general;
  const typeLabel = TASK_TYPE_LABEL[task.task_type] || task.task_type;

  const borderColor = task.is_overdue
    ? 'border-rose-500/40'
    : task.status === 'completed'
    ? 'border-emerald-500/20'
    : task.status === 'in_progress'
    ? 'border-teal-500/30'
    : 'border-slate-800/70';

  const bgColor = task.is_overdue
    ? 'bg-rose-500/5'
    : task.status === 'completed'
    ? 'bg-emerald-500/5'
    : 'bg-[#0c1022]';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 transition`}>
      <div className="flex flex-wrap items-start gap-3 justify-between">

        {/* Left: icon + title */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            task.is_overdue ? 'bg-rose-500/15' : task.status === 'completed' ? 'bg-emerald-500/15' : 'bg-teal-500/15'
          }`}>
            <svg viewBox="0 0 24 24" className={`h-4 w-4 ${task.is_overdue ? 'text-rose-400' : task.status === 'completed' ? 'text-emerald-400' : 'text-teal-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={typeIcon} />
            </svg>
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold leading-snug ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[10px] text-slate-600">{typeLabel}</span>
              <span className="text-[10px] text-slate-700">·</span>
              <span className="text-[10px] text-slate-600">
                Created {new Date(task.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <>
                  <span className="text-[10px] text-slate-700">·</span>
                  <span className={`text-[10px] font-medium ${task.is_overdue ? 'text-rose-400' : 'text-slate-500'}`}>
                    Due {new Date(task.due_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: badges + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <TATBadge task={task} />
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_COLOR[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          {!isDone && (
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {task.status === 'pending' && (
                <button
                  onClick={() => handleAction('in_progress')}
                  disabled={saving}
                  className="rounded-md border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 text-[11px] font-semibold text-teal-300 transition disabled:opacity-50"
                >
                  {saving ? '…' : 'Start'}
                </button>
              )}
              <button
                onClick={() => { setShowNote(v => !v); }}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition"
              >
                Complete
              </button>
              <button
                onClick={() => handleAction('cancelled')}
                disabled={saving}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-300 hover:border-slate-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {task.status === 'completed' && task.completed_at && (
            <p className="text-[10px] text-emerald-500/70">
              Completed {new Date(task.completed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          )}
        </div>
      </div>

      {/* Resolution note input */}
      {showNote && !isDone && (
        <div className="mt-3 flex gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional resolution note…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          />
          <button
            onClick={() => handleAction('completed')}
            disabled={saving}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            {saving ? 'Saving…' : 'Mark Done'}
          </button>
          <button
            onClick={() => setShowNote(false)}
            className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ✕
          </button>
        </div>
      )}

      {task.resolution_note && (
        <p className="mt-2 text-[11px] text-slate-500 italic border-t border-slate-800/60 pt-2">
          Note: {task.resolution_note}
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'pending' | 'in_progress' | 'overdue' | 'completed';

export default function ManagerTasksPage() {
  const [tasks, setTasks]       = useState<PortalTask[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState<FilterTab>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async (tab: FilterTab = filter) => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ limit: '100' });
    if (tab !== 'all') params.set('status', tab);
    if (typeFilter) params.set('type', typeFilter);
    const res = await fetch(`/api/tasks?${params}`);
    if (!res.ok) { setError('Failed to load tasks.'); setLoading(false); return; }
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
  }, [filter, typeFilter]);

  useEffect(() => { load(filter); }, [filter, typeFilter]); // eslint-disable-line

  function handleUpdate(id: string, newStatus: string) {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, status: newStatus as PortalTask['status'],
            completed_at: newStatus === 'completed' ? new Date().toISOString() : t.completed_at,
            is_overdue: newStatus !== 'pending' && newStatus !== 'in_progress' ? false : t.is_overdue }
        : t
    ));
    // Refresh summary
    load(filter);
  }

  const TAB_CONFIG: { id: FilterTab; label: string; count?: number; color: string }[] = [
    { id: 'all',         label: 'All',         count: summary?.total,      color: 'text-slate-300' },
    { id: 'pending',     label: 'Pending',      count: summary?.pending,    color: 'text-blue-300' },
    { id: 'in_progress', label: 'In Progress',  count: summary?.in_progress, color: 'text-teal-300' },
    { id: 'overdue',     label: 'Overdue',      count: summary?.overdue,    color: 'text-rose-300' },
    { id: 'completed',   label: 'Completed',    count: summary?.completed,  color: 'text-emerald-300' },
  ];

  const TYPES = ['', 'document_review', 'document_rereview', 'client_onboarding', 'filing_review', 'filing_status_oversight'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Tasks</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Auto-generated tasks from portal actions. TAT target: 120 minutes.
          </p>
        </div>
        <button
          onClick={() => load(filter)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Pending',    val: summary.pending,     bg: 'bg-blue-500/10 border-blue-500/20',     text: 'text-blue-300' },
            { label: 'In Progress',val: summary.in_progress, bg: 'bg-teal-500/10 border-teal-500/20',     text: 'text-teal-300' },
            { label: 'Overdue ⚠',  val: summary.overdue,     bg: 'bg-rose-500/10 border-rose-500/20',     text: 'text-rose-300' },
            { label: 'Completed',  val: summary.completed,   bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
              <div className={`text-2xl font-bold tabular-nums ${s.text}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex rounded-lg border border-slate-800/70 overflow-hidden">
          {TAB_CONFIG.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                filter === t.id
                  ? `bg-slate-800 ${t.color}`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              } ${t.id === 'overdue' && (summary?.overdue ?? 0) > 0 ? 'relative' : ''}`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1 ${filter === t.id ? t.color : 'text-slate-600'}`}>({t.count})</span>
              )}
              {t.id === 'overdue' && (summary?.overdue ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-1.5 text-xs text-slate-300 focus:outline-none transition cursor-pointer"
        >
          {TYPES.map(t => (
            <option key={t} value={t}>{t ? TASK_TYPE_LABEL[t] || t : 'All Types'}</option>
          ))}
        </select>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/40" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] py-12 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No tasks found</p>
          <p className="text-xs text-slate-700 mt-1">Tasks are auto-created when clients or admins take actions.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
