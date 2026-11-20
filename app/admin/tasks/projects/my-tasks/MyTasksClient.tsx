'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Profile = { id: string; full_name: string; role: string };
type Task = {
  id: string; title: string; status: string; priority: string;
  due_date: string; category: string; created_at: string;
  project?: { id: string; name: string; status: string };
  creator?: { full_name: string };
};

const PRIORITY_BADGE: Record<string, string> = {
  Urgent: 'bg-red-500/20 text-red-400',
  High: 'bg-orange-500/20 text-orange-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  Low: 'bg-slate-700 text-slate-400',
};

const STATUS_BADGE: Record<string, string> = {
  todo: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  blocked: 'bg-red-500/20 text-red-400',
};

export default function MyTasksClient({ currentUser }: { currentUser: Profile | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/projects/my-tasks');
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (taskId: string, projectId: string, status: string) => {
    await fetch(`/api/admin/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const filtered = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-[#020817] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Tasks assigned to {currentUser?.full_name || 'you'} across all projects</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{tasks.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total Open</div>
          </div>
          <div className={`border rounded-xl p-4 ${dueToday.length > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`text-2xl font-bold ${dueToday.length > 0 ? 'text-yellow-400' : 'text-white'}`}>{dueToday.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Due Today</div>
          </div>
          <div className={`border rounded-xl p-4 ${overdue.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-400' : 'text-white'}`}>{overdue.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Overdue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['all', 'todo', 'in_progress', 'review', 'blocked'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tasks list */}
        {loading ? (
          <div className="text-slate-400 text-sm">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-2">🎉</div>
            <p>No tasks assigned to you{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} className={`bg-slate-900 border rounded-xl p-4 ${isOverdue ? 'border-red-500/30' : 'border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] || 'bg-slate-700 text-slate-400'}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[task.status] || 'bg-slate-700 text-slate-300'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.project && (
                          <Link href={`/admin/tasks/projects/${task.project.id}`} className="text-xs text-teal-400 hover:underline">
                            {task.project.name}
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-white font-medium">{task.title}</p>
                      {task.creator && (
                        <p className="text-xs text-slate-500 mt-0.5">Assigned by {task.creator.full_name}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {task.due_date && (
                        <div className={`text-xs mb-2 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          {isOverdue ? '⚠️ ' : ''}
                          {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {task.project && (
                        <select
                          value={task.status}
                          onChange={e => updateStatus(task.id, task.project!.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-teal-600"
                        >
                          {['todo', 'in_progress', 'review', 'blocked', 'done'].map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
