'use client';

import { useState, useEffect, useCallback } from 'react';

interface Participant {
  id: string; full_name: string; role: string; email?: string;
  groupKey: string; total: number; done: number; open: number; overdue: number; blocked: number;
}
interface GroupStat {
  key: string; label: string; color: string;
  memberCount: number; total: number; done: number; overdue: number; completionRate: number;
}
interface Task {
  id: string; title: string; status: string; priority: string; due_date?: string; category?: string;
  assigned_to?: string; created_at: string;
  assignee?: { id: string; full_name: string; role: string } | null;
}
interface Warning { id: string; warning_type: string; severity: string; message: string; created_at: string; }
interface ActivityItem { id: string; action: string; created_at: string; actor?: { full_name: string }; meta?: any; }
interface Project { id: string; name: string; description?: string; status: string; start_date?: string; end_date?: string; }

const GROUP_COLORS: Record<string, { ring: string; bg: string; text: string; bar: string }> = {
  cepc:        { ring: 'border-violet-500/40', bg: 'bg-violet-500/10',  text: 'text-violet-300', bar: 'bg-violet-500' },
  employees:   { ring: 'border-blue-500/40',   bg: 'bg-blue-500/10',    text: 'text-blue-300',   bar: 'bg-blue-500'   },
  interns:     { ring: 'border-amber-500/40',  bg: 'bg-amber-500/10',   text: 'text-amber-300',  bar: 'bg-amber-500'  },
  freelancers: { ring: 'border-teal-500/40',   bg: 'bg-teal-500/10',    text: 'text-teal-300',   bar: 'bg-teal-500'   },
};

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: 'bg-red-500/20 text-red-400', High: 'bg-orange-500/20 text-orange-400',
  Medium: 'bg-yellow-500/20 text-yellow-400', Low: 'bg-slate-700 text-slate-400',
};

const STATUS_COLOR: Record<string, string> = {
  todo: 'bg-slate-700 text-slate-300', in_progress: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400', blocked: 'bg-red-500/20 text-red-400',
  done: 'bg-green-500/20 text-green-400',
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/10 text-red-300',
  high:     'border-orange-500/40 bg-orange-500/10 text-orange-300',
  medium:   'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  low:      'border-slate-700 bg-slate-800 text-slate-400',
};

const TABS = ['Overview', 'Tasks', 'People', 'Warnings', 'Activity'];

const EMPTY_TASK_FORM = { title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', category: 'general', sla_hours: '' };

export default function SixtyDaysClient({ currentUserId, currentUserRole }: { currentUserId: string; currentUserRole: string }) {
  const [tab, setTab] = useState('Overview');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [daysRemaining, setDaysRemaining] = useState(60);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ ...EMPTY_TASK_FORM });
  const [saving, setSaving] = useState(false);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchPeople, setSearchPeople] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/projects/sixty-days');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setProject(data.project);
    setTasks(data.tasks || []);
    setParticipants(data.participants || []);
    setGroupStats(data.groupStats || []);
    setWarnings(data.warnings || []);
    setActivity(data.activity || []);
    setDaysRemaining(data.daysRemaining ?? 60);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadComments = async (taskId: string) => {
    if (!project) return;
    const res = await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}/comments`);
    const data = await res.json();
    setComments(data.comments || []);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    await fetch(`/api/admin/projects/${project.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, sla_hours: taskForm.sla_hours ? Number(taskForm.sla_hours) : null }),
    });
    setSaving(false);
    setShowTaskModal(false);
    setTaskForm({ ...EMPTY_TASK_FORM });
    load();
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    if (!project) return;
    await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, status } : prev);
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim() || !project) return;
    await fetch(`/api/admin/projects/${project.id}/tasks/${selectedTask.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentText }),
    });
    setCommentText('');
    loadComments(selectedTask.id);
  };

  const resolveWarning = async (wid: string) => {
    if (!project) return;
    await fetch(`/api/admin/projects/${project.id}/warnings/${wid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    });
    setWarnings(prev => prev.filter(w => w.id !== wid));
  };

  const openTask = async (task: Task) => {
    setSelectedTask(task);
    await loadComments(task.id);
  };

  // Derived data
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !['done', 'cancelled'].includes(t.status)).length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const daysElapsed = project?.start_date ? Math.max(0, Math.ceil((new Date().getTime() - new Date(project.start_date).getTime()) / 86400000)) : 0;

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterGroup) {
      const p = participants.find(p => p.id === t.assigned_to);
      if (!p || p.groupKey !== filterGroup) return false;
    }
    return true;
  });

  const filteredParticipants = participants.filter(p =>
    (!filterGroup || p.groupKey === filterGroup) &&
    (!searchPeople || p.full_name.toLowerCase().includes(searchPeople.toLowerCase()))
  );

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading 60 Days Project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#0c1022] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                Active Initiative
              </span>
              {warnings.length > 0 && (
                <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  ⚠ {warnings.length} warnings
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">60 Days Project</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">{project?.description}</p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            + Assign Task
          </button>
        </div>

        {/* Progress + countdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Days Remaining', value: daysRemaining, sub: `Day ${daysElapsed} of 60`, color: daysRemaining <= 10 ? 'text-red-400' : daysRemaining <= 20 ? 'text-amber-400' : 'text-teal-400' },
            { label: 'Tasks Complete', value: `${completionPct}%`, sub: `${doneTasks} of ${totalTasks} done`, color: completionPct >= 70 ? 'text-green-400' : 'text-white' },
            { label: 'Overdue Tasks',  value: overdueTasks, sub: 'need attention', color: overdueTasks > 0 ? 'text-red-400' : 'text-slate-400' },
            { label: 'Participants',   value: participants.length, sub: `${groupStats.length} groups`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 rounded-xl p-4">
              <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Project progress</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        {/* Time progress bar */}
        {project?.start_date && project.end_date && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Time elapsed</span>
              <span>{Math.min(100, Math.round((daysElapsed / 60) * 100))}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${daysRemaining <= 10 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, Math.round((daysElapsed / 60) * 100))}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Group stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {groupStats.map(g => {
          const c = GROUP_COLORS[g.key] || GROUP_COLORS.employees;
          return (
            <button
              key={g.key}
              onClick={() => setFilterGroup(filterGroup === g.key ? '' : g.key)}
              className={`text-left bg-[#0c1022] border rounded-xl p-4 transition-all ${filterGroup === g.key ? c.ring + ' ' + c.bg : 'border-slate-800 hover:border-slate-700'}`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${c.text}`}>{g.label}</div>
              <div className="text-2xl font-bold text-white">{g.memberCount}</div>
              <div className="text-[10px] text-slate-500 mb-2">participants</div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                <span>{g.done}/{g.total} tasks</span>
                <span className={g.overdue > 0 ? 'text-red-400' : 'text-slate-600'}>{g.overdue} overdue</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${g.completionRate}%` }} />
              </div>
              <div className={`text-[10px] mt-1 font-medium ${c.text}`}>{g.completionRate}% complete</div>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              {t}
              {t === 'Warnings' && warnings.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full">{warnings.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Task status breakdown */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Task Status Breakdown</h3>
              <div className="grid grid-cols-5 gap-2 text-center mb-4">
                {Object.entries({ todo: tasks.filter(t => t.status === 'todo'), in_progress: tasks.filter(t => t.status === 'in_progress'), review: tasks.filter(t => t.status === 'review'), blocked: tasks.filter(t => t.status === 'blocked'), done: tasks.filter(t => t.status === 'done') }).map(([s, list]) => (
                  <div key={s} className={`rounded-lg p-3 border ${s === 'blocked' ? 'border-red-500/20 bg-red-500/5' : 'bg-slate-800/60 border-slate-700/30'}`}>
                    <div className="text-xl font-bold text-white">{list.length}</div>
                    <div className="text-[10px] text-slate-400 capitalize mt-0.5">{s.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Priority breakdown */}
              {tasks.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-500 font-medium mb-2">By Priority</div>
                  {(['Urgent', 'High', 'Medium', 'Low'] as const).map(p => {
                    const count = tasks.filter(t => t.priority === p && !['done', 'cancelled'].includes(t.status)).length;
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                    if (!count) return null;
                    return (
                      <div key={p} className="flex items-center gap-3">
                        <span className={`text-[10px] w-12 text-right font-medium ${PRIORITY_COLOR[p].split(' ')[1]}`}>{p}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${p === 'Urgent' ? 'bg-red-500' : p === 'High' ? 'bg-orange-500' : p === 'Medium' ? 'bg-yellow-500' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top performers & attention needed */}
            <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">People Snapshot</h3>
              <div className="space-y-1">
                {participants.filter(p => p.total > 0).sort((a, b) => b.done - a.done).slice(0, 8).map(p => {
                  const c = GROUP_COLORS[p.groupKey] || GROUP_COLORS.employees;
                  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                      <div className={`h-7 w-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${c.ring} ${c.bg} ${c.text}`}>
                        {p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-200 truncate">{p.full_name}</span>
                          <span className={`text-[9px] px-1.5 rounded ${c.bg} ${c.text} shrink-0`}>{p.groupKey}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full max-w-[80px]">
                            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-600">{pct}%</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-right shrink-0">
                        <div><div className="text-xs font-bold text-white">{p.done}</div><div className="text-[9px] text-slate-600">done</div></div>
                        <div><div className={`text-xs font-bold ${p.overdue > 0 ? 'text-red-400' : 'text-slate-400'}`}>{p.overdue}</div><div className="text-[9px] text-slate-600">overdue</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: activity + warnings */}
          <div className="space-y-4">
            {warnings.length > 0 && (
              <div className="bg-[#0c1022] border border-amber-500/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠ Warnings</h3>
                <div className="space-y-2">
                  {warnings.slice(0, 4).map(w => (
                    <div key={w.id} className={`text-xs p-2.5 rounded-lg border flex justify-between items-start gap-2 ${SEVERITY_COLOR[w.severity]}`}>
                      <span>{w.message}</span>
                      <button onClick={() => resolveWarning(w.id)} className="text-[10px] opacity-60 hover:opacity-100 shrink-0">✓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
              {activity.length === 0 ? (
                <p className="text-slate-500 text-xs">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activity.slice(0, 10).map(a => (
                    <div key={a.id} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-xs text-white font-medium">{a.actor?.full_name || 'System'}</span>
                        <span className="text-xs text-slate-400"> {a.action.replace(/_/g, ' ')}</span>
                        {a.meta?.title && <span className="text-xs text-slate-300"> "{a.meta.title}"</span>}
                        <div className="text-[10px] text-slate-600 mt-0.5">{new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TASKS TAB */}
      {tab === 'Tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {(['', 'todo', 'in_progress', 'review', 'blocked', 'done'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {s === '' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
            <button onClick={() => setShowTaskModal(true)} className="ml-auto px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium">+ Assign Task</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {Object.entries(tasksByStatus).map(([status, list]) => (
              <div key={status} className="bg-[#0c1022] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">{status.replace('_', ' ')}</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map(task => {
                    const p = task.assignee;
                    const grp = participants.find(x => x.id === task.assigned_to)?.groupKey || '';
                    const c = GROUP_COLORS[grp] || GROUP_COLORS.employees;
                    return (
                      <div key={task.id} onClick={() => openTask(task)}
                        className="bg-slate-800/60 hover:bg-slate-700/60 rounded-lg p-3 cursor-pointer transition-colors">
                        <p className="text-xs text-white font-medium leading-snug mb-2">{task.title}</p>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLOR[task.priority] || 'bg-slate-700 text-slate-400'}`}>{task.priority}</span>
                          {p && <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{p.full_name.split(' ')[0]}</span>}
                        </div>
                        {task.due_date && (
                          <div className={`text-[10px] ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-slate-500'}`}>
                            📅 {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PEOPLE TAB */}
      {tab === 'People' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input value={searchPeople} onChange={e => setSearchPeople(e.target.value)} placeholder="Search person..."
              className="h-8 px-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
            {groupStats.map(g => {
              const c = GROUP_COLORS[g.key] || GROUP_COLORS.employees;
              return (
                <button key={g.key} onClick={() => setFilterGroup(filterGroup === g.key ? '' : g.key)}
                  className={`h-8 px-3 rounded-lg border text-[11px] font-medium transition-colors ${filterGroup === g.key ? `${c.ring} ${c.bg} ${c.text}` : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="bg-[#0c1022] border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_80px_80px_80px_80px_80px] gap-x-3 px-5 py-2.5 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              <span>Person</span><span>Group</span><span className="text-center">Total</span><span className="text-center">Done</span><span className="text-center">Open</span><span className="text-center">Overdue</span><span className="text-center">Blocked</span>
            </div>
            <div className="divide-y divide-slate-800/40">
              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No participants found.</div>
              ) : filteredParticipants.map(p => {
                const c = GROUP_COLORS[p.groupKey] || GROUP_COLORS.employees;
                const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                return (
                  <div key={p.id} className="grid grid-cols-[2fr_1fr_80px_80px_80px_80px_80px] gap-x-3 items-center px-5 py-3 hover:bg-slate-800/20 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${c.ring} ${c.bg} ${c.text}`}>
                        {p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{p.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-600">{pct}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{p.groupKey}</span>
                    </div>
                    <div className="text-center"><span className="text-sm font-bold text-white tabular-nums">{p.total}</span></div>
                    <div className="text-center"><span className="text-sm font-bold text-green-400 tabular-nums">{p.done}</span></div>
                    <div className="text-center"><span className="text-sm font-bold text-blue-400 tabular-nums">{p.open}</span></div>
                    <div className="text-center"><span className={`text-sm font-bold tabular-nums ${p.overdue > 0 ? 'text-red-400' : 'text-slate-600'}`}>{p.overdue}</span></div>
                    <div className="text-center"><span className={`text-sm font-bold tabular-nums ${p.blocked > 0 ? 'text-orange-400' : 'text-slate-600'}`}>{p.blocked}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WARNINGS TAB */}
      {tab === 'Warnings' && (
        <div className="space-y-3">
          {warnings.length === 0 ? (
            <div className="text-center py-16 text-slate-500"><div className="text-4xl mb-2">✅</div><p>No active warnings</p></div>
          ) : warnings.map(w => (
            <div key={w.id} className={`border rounded-xl p-4 flex items-center justify-between ${SEVERITY_COLOR[w.severity]}`}>
              <div>
                <div className="text-sm font-medium">{w.message}</div>
                <div className="text-xs opacity-70 mt-0.5 capitalize">{w.severity} · {w.warning_type.replace(/_/g, ' ')} · {new Date(w.created_at).toLocaleString('en-IN')}</div>
              </div>
              <button onClick={() => resolveWarning(w.id)} className="ml-4 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors shrink-0">Resolve</button>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === 'Activity' && (
        <div className="space-y-2">
          {activity.map(a => (
            <div key={a.id} className="flex gap-4 py-3 border-b border-slate-800">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-medium">{a.actor?.full_name || 'System'}</span>
                <span className="text-sm text-slate-400"> {a.action.replace(/_/g, ' ')}</span>
                {a.meta?.title && <span className="text-sm text-slate-300"> "{a.meta.title}"</span>}
              </div>
              <div className="text-xs text-slate-500 shrink-0">{new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{selectedTask.title}</h2>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[selectedTask.status]}`}>{selectedTask.status.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-400">{selectedTask.priority}</span>
                  {selectedTask.assignee && <span className="text-xs text-teal-400">{selectedTask.assignee.full_name}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Change Status</label>
                <div className="flex flex-wrap gap-2">
                  {['todo', 'in_progress', 'review', 'blocked', 'done'].map(s => (
                    <button key={s} onClick={() => updateTaskStatus(selectedTask.id, s)}
                      className={`text-xs px-2.5 py-1 rounded transition-colors capitalize ${selectedTask.status === s ? STATUS_COLOR[s] + ' ring-1 ring-teal-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Comments</label>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-500">No comments yet</p>
                  ) : comments.map(c => (
                    <div key={c.id} className="bg-slate-800 rounded-lg p-2.5">
                      <div className="text-xs font-medium text-teal-400">{c.author?.full_name}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{c.content}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{new Date(c.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={addComment} className="flex gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
                  <button type="submit" className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs">Post</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showTaskModal && project && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Assign Task</h2>
              <p className="text-xs text-slate-400 mt-0.5">Create a task and assign it to a project participant</p>
            </div>
            <form onSubmit={createTask} className="p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Task Title *</label>
                <input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Submit CEPC report"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Assign To</label>
                <select value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600">
                  <option value="">Unassigned</option>
                  {groupStats.map(g => (
                    <optgroup key={g.key} label={g.label}>
                      {participants.filter(p => p.groupKey === g.key).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600">
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600">
                    {['general', 'cepc', 'academy', 'compliance', 'reporting', 'training', 'onboarding'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">SLA (hours)</label>
                  <input type="number" value={taskForm.sla_hours} onChange={e => setTaskForm(f => ({ ...f, sla_hours: e.target.value }))} placeholder="e.g. 48"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowTaskModal(false); setTaskForm({ ...EMPTY_TASK_FORM }); }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium">
                  {saving ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
