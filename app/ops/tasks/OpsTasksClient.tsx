'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'done', 'blocked'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-slate-400 bg-slate-800',
  normal: 'text-blue-400 bg-blue-900/30',
  high:   'text-amber-400 bg-amber-900/30',
  urgent: 'text-red-400 bg-red-900/30',
};
const STATUS_COLORS: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  done:        'text-green-400 bg-green-900/30',
  blocked:     'text-red-400 bg-red-900/30',
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  role_context: string | null;
  created_at: string;
}

export default function OpsTasksClient() {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState({ title: '', description: '', priority: 'normal', due_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusTab });
    const res = await fetch(`/api/ops/tasks?${params}`);
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, statusTab]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    await fetch('/api/ops/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    trackEvent('Ops Task Created', { priority: form.priority });
    setShowCreate(false);
    setForm({ title: '', description: '', priority: 'normal', due_date: '' });
    setSubmitting(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ops/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    trackEvent('Ops Task Status Changed', { status });
    load();
  }

  function fmt(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function isOverdue(d: string | null) { return !!d && new Date(d) < new Date(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your assigned and self-created tasks</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-700/60 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => { setStatusTab(tab); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
              ${statusTab === tab ? 'border-rose-400 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
            {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium text-slate-400">No tasks</p>
          <p className="text-sm mt-1">Create a task or wait for an assignment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[task.status] ?? STATUS_COLORS.pending}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className={`text-[10px] font-medium ${isOverdue(task.due_date) ? 'text-red-400' : 'text-slate-500'}`}>
                        Due {fmt(task.due_date)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-100">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-slate-600">Created {fmt(task.created_at)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {task.status === 'pending' && (
                    <button onClick={() => updateStatus(task.id, 'in_progress')}
                      className="rounded-lg bg-blue-900/30 hover:bg-blue-900/60 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition">
                      Start
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button onClick={() => updateStatus(task.id, 'done')}
                      className="rounded-lg bg-green-900/30 hover:bg-green-900/60 border border-green-700/30 px-3 py-1.5 text-xs font-semibold text-green-400 transition">
                      Mark Done
                    </button>
                  )}
                  {(task.status === 'pending' || task.status === 'in_progress') && (
                    <button onClick={() => updateStatus(task.id, 'blocked')}
                      className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition">
                      Blocked
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 30 && (
        <div className="flex justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-500">{page}</span>
          <button disabled={tasks.length < 30} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 disabled:opacity-40">Next</button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">New Task</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional context…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
