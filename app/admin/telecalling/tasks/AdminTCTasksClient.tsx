'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'escalated', 'completed'] as const;
const STATUS_COLORS: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  completed:   'text-green-400 bg-green-900/30',
  escalated:   'text-red-400 bg-red-900/30',
  cancelled:   'text-slate-500 bg-slate-800',
};
const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-slate-400',
  normal: 'text-blue-400',
  high:   'text-amber-400',
  urgent: 'text-red-400',
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  allocated_at: string | null;
  escalated_at: string | null;
  completed_at: string | null;
  lead: { company_name: string | null; name: string | null } | null;
  assignee: { id: string; full_name: string | null } | null;
  creator: { id: string; full_name: string | null } | null;
}

interface Agent {
  id: string;
  full_name: string | null;
  role: string;
  taskCount?: number;
}

interface Summary { pending: number; in_progress: number; escalated: number; completed: number; total: number }

export default function AdminTCTasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, in_progress: 0, escalated: 0, completed: 0, total: 0 });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statusTab, setStatusTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal', due_date: '', assigned_to: '', lead_id: '' });
  const [leads, setLeads] = useState<{ id: string; company_name: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusTab });
    const res = await fetch(`/api/admin/telecalling/tasks?${params}`);
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setTotal(data.total ?? 0);
    setSummary(data.summary ?? { pending: 0, in_progress: 0, escalated: 0, completed: 0, total: 0 });
    setAgents(data.agents ?? []);
    setLoading(false);
  }, [page, statusTab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/admin/telecalling/leads?limit=100&page=1')
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []));
  }, []);

  async function assignTask(taskId: string, agentId: string) {
    if (!agentId) return;
    setAssigning(taskId);
    await fetch(`/api/admin/telecalling/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: agentId }),
    });
    setAssigning(null);
    load();
  }

  async function escalateTask(taskId: string) {
    await fetch(`/api/admin/telecalling/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'escalated' }),
    });
    load();
  }

  async function completeTask(taskId: string) {
    await fetch(`/api/admin/telecalling/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/admin/telecalling/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowCreate(false);
    setForm({ title: '', description: '', priority: 'normal', due_date: '', assigned_to: '', lead_id: '' });
    setSubmitting(false);
    load();
  }

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function hoursAgo(d: string | null) {
    if (!d) return '';
    const h = Math.round((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }

  function isOverdue(due: string | null) {
    return !!due && new Date(due) < new Date();
  }

  // Compute per-agent workload from task list
  const workload = agents.map(a => ({
    ...a,
    taskCount: tasks.filter(t => t.assignee?.id === a.id && !['completed', 'cancelled'].includes(t.status)).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Telecalling Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and assign tasks from telecallers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Assign Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: summary.pending, color: 'text-yellow-400' },
          { label: 'In Progress', value: summary.in_progress, color: 'text-blue-400' },
          { label: 'Escalated', value: summary.escalated, color: 'text-red-400' },
          { label: 'Completed', value: summary.completed, color: 'text-green-400' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Agent Workload */}
      {workload.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Agent Workload (Active Tasks)</h2>
          <div className="flex flex-wrap gap-3">
            {workload.map(a => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
                <div className="h-6 w-6 flex items-center justify-center rounded-full bg-teal-500/15 text-[10px] font-bold text-teal-400">
                  {(a.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-300">{a.full_name ?? '—'}</span>
                <span className={`text-xs font-bold ${(a.taskCount ?? 0) > 5 ? 'text-red-400' : (a.taskCount ?? 0) > 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {a.taskCount ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-slate-700/60 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setStatusTab(tab); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              statusTab === tab ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No tasks in this category</div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className={`rounded-xl border p-4 ${task.status === 'escalated' ? 'border-red-800/50 bg-red-950/10' : 'border-slate-800 bg-slate-900/60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[task.status] ?? STATUS_COLORS.pending}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-semibold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className={`text-[10px] ${isOverdue(task.due_date) ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                        Due {fmt(task.due_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    {task.creator && <span>From: {task.creator.full_name ?? '—'}</span>}
                    {task.lead && <span>Lead: {task.lead.company_name || task.lead.name || '—'}</span>}
                    <span>Created {hoursAgo(task.created_at)}</span>
                    {task.escalated_at && <span className="text-red-400">Escalated {hoursAgo(task.escalated_at)}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {/* Assign dropdown */}
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <select
                      value={task.assignee?.id ?? ''}
                      onChange={e => assignTask(task.id, e.target.value)}
                      disabled={assigning === task.id}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 focus:border-teal-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Assign to…</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex gap-1">
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => completeTask(task.id)}
                        className="rounded-lg bg-green-900/30 hover:bg-green-900/60 border border-green-700/30 px-2.5 py-1.5 text-[11px] font-semibold text-green-400 transition"
                      >
                        Complete
                      </button>
                    )}
                    {task.status !== 'escalated' && task.status !== 'completed' && task.status !== 'cancelled' && (
                      <button
                        onClick={() => escalateTask(task.id)}
                        className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition"
                      >
                        Escalate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 30 && (
        <div className="flex justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-500">{page}</span>
          <button disabled={tasks.length < 30} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create/Assign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">Assign Task to Telecaller</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Task title"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Assign To</label>
                  <select
                    value={form.assigned_to}
                    onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Auto (admin)</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Linked Lead</label>
                  <select
                    value={form.lead_id}
                    onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">— None —</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.company_name || l.id}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
