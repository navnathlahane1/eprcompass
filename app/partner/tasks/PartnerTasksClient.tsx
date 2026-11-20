'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TourTarget from '@/components/portal/tour/TourTarget';
import { trackEvent } from '@/lib/analytics';

function priorityBadge(p: string) {
  if (p === 'High') return 'bg-rose-100 text-rose-800';
  if (p === 'Medium') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function statusBadge(s: string) {
  if (s === 'Done') return 'bg-emerald-100 text-emerald-800';
  if (s === 'In Progress') return 'bg-blue-100 text-blue-800';
  if (s === 'Cancelled') return 'bg-slate-100 text-slate-500';
  return 'bg-amber-100 text-amber-800'; // Open
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(`${d}T00:00:00Z`).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function PartnerTasksClient({
  partnerId,
  initialTasks,
}: {
  partnerId: string;
  initialTasks: any[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const stats = useMemo(() => ({
    open: tasks.filter((t) => t.status === 'Open').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
    overdue: tasks.filter((t) => {
      if (['Done', 'Cancelled'].includes(t.status)) return false;
      const d = daysUntil(t.due_date);
      return d !== null && d < 0;
    }).length,
  }), [tasks]);

  const filtered = useMemo(() => {
    if (filterStatus === 'active') return tasks.filter((t) => ['Open', 'In Progress'].includes(t.status));
    if (filterStatus === 'done') return tasks.filter((t) => t.status === 'Done');
    return tasks;
  }, [tasks, filterStatus]);

  async function updateStatus(taskId: string, newStatus: string) {
    setUpdating(taskId);
    const { error } = await (supabase as any)
      .from('partner_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'Done' ? new Date().toISOString() : null,
      })
      .eq('id', taskId);
    if (!error) {
      trackEvent('Partner Task Status Changed', { status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus, completed_at: newStatus === 'Done' ? new Date().toISOString() : null } : t));
    }
    setUpdating(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500">Tasks assigned across your client accounts.</p>
      </div>

      {/* Stats */}
      <TourTarget id="tasks-summary-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-amber-700' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-700' },
          { label: 'Done', value: stats.done, color: 'text-emerald-700' },
          { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? 'text-rose-700' : 'text-slate-900' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </TourTarget>

      {/* Filter tabs */}
      <TourTarget id="tasks-filter-tabs" className="flex gap-1 border-b border-slate-200">
        {[
          { key: 'active', label: 'Active' },
          { key: 'done', label: 'Completed' },
          { key: 'all', label: 'All' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterStatus(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === t.key ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </TourTarget>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-700">No tasks here</p>
          <p className="mt-1 text-xs text-slate-400">Tasks assigned by the operations team will appear here.</p>
        </div>
      ) : (
        <TourTarget id="tasks-list" className="space-y-2">
          {filtered.map((task) => {
            const days = daysUntil(task.due_date);
            const isOverdue = days !== null && days < 0 && !['Done', 'Cancelled'].includes(task.status);
            const isDueSoon = days !== null && days >= 0 && days <= 3 && !['Done', 'Cancelled'].includes(task.status);

            return (
              <div
                key={task.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                  isOverdue ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={() => updateStatus(task.id, task.status === 'Done' ? 'Open' : 'Done')}
                      disabled={updating === task.id || task.status === 'Cancelled'}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                        task.status === 'Done'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 hover:border-indigo-400'
                      } disabled:opacity-40`}
                    >
                      {updating === task.id ? (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      ) : task.status === 'Done' ? (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{task.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {task.client_name && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{task.client_name}</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className={`text-[11px] font-medium ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                            {isOverdue ? '⚠ Overdue · ' : isDueSoon ? '⏰ Due soon · ' : ''}
                            Due {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                    disabled={updating === task.id}
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-40 ${statusBadge(task.status)}`}
                    style={{ borderColor: 'transparent' }}
                  >
                    {['Open', 'In Progress', 'Done', 'Cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </TourTarget>
      )}
    </div>
  );
}
