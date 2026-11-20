'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { useSearchParams } from 'next/navigation';
import type { ClientComplianceTask } from '@/lib/complianceKnowledge/types';
import {
  TASK_STATUS_COLORS, TASK_STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS,
  TASK_TYPE_LABELS, FILING_TYPE_LABELS, daysUntil, formatDaysRemaining, getUrgency, URGENCY_CONFIG
} from '@/lib/complianceKnowledge/constants';

const STATUS_OPTIONS = ['', 'pending', 'in_progress', 'completed', 'overdue', 'waived', 'blocked'];
const PRIORITY_OPTIONS = ['', 'urgent', 'high', 'normal', 'low'];

// ─── Create Task Modal ────────────────────────────────────────────────────────

interface CreatedTask {
  id: string;
  title: string;
  status: string;
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
      trackEvent('Client Compliance Task Created', { priority });
      onCreate(data.task);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">Request Action from Your Manager</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Review my EPR filing documents"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Describe what you need help with…"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>}

          <p className="text-[11px] text-slate-400">
            This task will be assigned to your Relationship Manager (or our team if none is assigned).
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition">
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
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-teal-200 bg-white px-4 py-3 shadow-lg max-w-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Task created</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{task.title}</p>
        {task.assignee_name && (
          <p className="text-[11px] text-teal-600 mt-0.5">Assigned to {task.assignee_name}</p>
        )}
      </div>
      <button onClick={onDismiss} className="shrink-0 text-slate-400 hover:text-slate-600">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ComplianceTasksPage() {
  const searchParams = useSearchParams();
  const preFilterStatus = searchParams?.get('status') || '';
  const preFilterCompliance = searchParams?.get('compliance_id') || '';

  const [tasks, setTasks] = useState<ClientComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(preFilterStatus);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [complianceFilter] = useState(preFilterCompliance);
  const [showModal, setShowModal]   = useState(false);
  const [successTask, setSuccessTask] = useState<CreatedTask | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [startingTask, setStartingTask] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (complianceFilter) params.set('compliance_id', complianceFilter);

    try {
      const res = await fetch(`/api/portal/compliance-hub/tasks?${params}`, { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tasks could not be loaded');
      if (!controller.signal.aborted) { setTasks(data.tasks || []); setLoadError(''); }
    } catch (error) {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Tasks could not be loaded');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    }
    void load();
    return () => controller.abort();
  }, [statusFilter, priorityFilter, complianceFilter, reload]);

  async function markInProgress(taskId: string) {
    setStartingTask(taskId);
    setActionError('');
    try {
    const response = await fetch('/api/portal/compliance-hub/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: 'in_progress' }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Task could not be started');
    trackEvent('Client Compliance Task Marked In Progress', {});
    setLoading(true);
    setReload(value => value + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Task could not be started');
    } finally {
      setStartingTask(null);
    }
  }

  function handleTaskCreated(task: CreatedTask) {
    setShowModal(false);
    setSuccessTask(task);
  }

  const grouped = tasks.reduce<Record<string, ClientComplianceTask[]>>((acc, t) => {
    const fw = (t.client_compliances as { compliance_frameworks?: { short_name?: string; name?: string } } | undefined)
      ?.compliance_frameworks;
    const key = fw?.short_name || fw?.name || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const overdue = tasks.filter(t => t.due_date && daysUntil(t.due_date) < 0 && !['completed','waived'].includes(t.status));
  const active = tasks.filter(t => ['pending','in_progress','blocked'].includes(t.status));
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/portal/compliance-hub" className="text-sm text-slate-500 hover:text-slate-800 transition">
              ← Compliance Hub
            </Link>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Compliance Tasks</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Request Action
        </button>
      </div>

      {/* Stats */}
      {!loading && !loadError && <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-xl font-bold text-red-700">{overdue.length}</p>
          <p className="text-xs text-red-500">Overdue</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{active.length}</p>
          <p className="text-xs text-blue-500">Active</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-xl font-bold text-green-700">{completed.length}</p>
          <p className="text-xs text-green-500">Completed</p>
        </div>
      </div>}
      {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => { setLoading(true); setStatusFilter(e.target.value); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s ? TASK_STATUS_LABELS[s as keyof typeof TASK_STATUS_LABELS] : 'All Statuses'}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={e => { setLoading(true); setPriorityFilter(e.target.value); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {PRIORITY_OPTIONS.map(p => (
            <option key={p} value={p}>{p ? PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS] : 'All Priorities'}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading tasks…</p>
      ) : loadError ? (
        <div role="alert" className="text-sm text-red-700">
          <p>{loadError}</p>
          <button onClick={() => { setLoading(true); setReload(value => value + 1); }} className="mt-2 underline">Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([groupName, groupTasks]) => (
            <div key={groupName}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{groupName}</p>
              <div className="space-y-2">
                {groupTasks.map(task => {
                  const days = task.due_date ? daysUntil(task.due_date) : null;
                  const urgency = days !== null ? getUrgency(days) : 'low';
                  const uc = URGENCY_CONFIG[urgency];
                  const isOverdue = days !== null && days < 0 && !['completed','waived'].includes(task.status);
                  const deadline = task.compliance_deadlines as { title?: string; filing_type?: string; penalty_info?: string } | undefined;

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border p-4 transition ${
                        isOverdue ? 'border-red-200 bg-red-50' :
                        task.status === 'completed' ? 'border-green-100 bg-green-50 opacity-70' :
                        'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority dot */}
                        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${uc.dotColor}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.title}
                            </p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TASK_STATUS_COLORS[task.status]}`}>
                              {TASK_STATUS_LABELS[task.status]}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                          </div>

                          {task.description && (
                            <p className="mt-1 text-xs text-slate-500">{task.description}</p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                            <span>{TASK_TYPE_LABELS[task.task_type]}</span>
                            {task.due_date && (
                              <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                                Due: {new Date(task.due_date).toLocaleDateString()} · {formatDaysRemaining(days!)}
                              </span>
                            )}
                            {deadline?.filing_type && (
                              <span>{FILING_TYPE_LABELS[deadline.filing_type as keyof typeof FILING_TYPE_LABELS] || deadline.filing_type}</span>
                            )}
                          </div>

                          {isOverdue && deadline?.penalty_info && (
                            <p className="mt-1.5 rounded bg-red-100 px-2 py-1 text-[10px] text-red-700">
                              ⚠ {deadline.penalty_info}
                            </p>
                          )}

                          {task.notes && (
                            <p className="mt-1.5 text-xs text-slate-500 italic">{task.notes}</p>
                          )}
                        </div>

                        {/* Action */}
                        <div className="shrink-0">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => markInProgress(task.id)}
                              disabled={startingTask !== null}
                              className="rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 transition"
                            >
                              {startingTask === task.id ? 'Starting...' : 'Start'}
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={handleTaskCreated}
        />
      )}

      {/* Success Toast */}
      {successTask && (
        <SuccessToast task={successTask} onDismiss={() => setSuccessTask(null)} />
      )}
    </div>
  );
}
