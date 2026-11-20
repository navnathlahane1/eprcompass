'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

type Profile = { id: string; full_name: string; role: string };
type Project = { id: string; name: string; description: string; status: string; start_date: string; end_date: string; owner_id: string };
type Task = { id: string; title: string; status: string; priority: string; assigned_to: string; due_date: string; category: string; sla_hours: number; created_at: string; profiles?: { full_name: string } };
type Member = { user_id: string; role: string; profiles: { full_name: string; role: string } };
type Warning = { id: string; warning_type: string; severity: string; message: string; created_at: string };
type ActivityItem = { id: string; action: string; created_at: string; actor?: { full_name: string }; meta?: any };

const STATUS_BG: Record<string, string> = {
  todo: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  blocked: 'bg-red-500/20 text-red-400',
  done: 'bg-green-500/20 text-green-400',
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-400 border-red-500/30 bg-red-500/10',
  high: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  low: 'text-slate-400 border-slate-600 bg-slate-800',
};

const TABS = ['Overview', 'Tasks', 'Members', 'Warnings', 'Activity'];

export default function ProjectDetailClient({
  projectId,
  currentUser,
  allUsers,
}: {
  projectId: string;
  currentUser: Profile | null;
  allUsers: Profile[];
}) {
  const [tab, setTab] = useState('Overview');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', sla_hours: '', category: 'general' });
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/projects/${projectId}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setProject(data.project);
    setTasks(data.tasks || []);
    setMembers(data.members || []);
    setWarnings(data.warnings || []);
    setActivity(data.activity || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const loadComments = async (taskId: string) => {
    const res = await fetch(`/api/admin/projects/${projectId}/tasks/${taskId}/comments`);
    const data = await res.json();
    setComments(data.comments || []);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, sla_hours: taskForm.sla_hours ? Number(taskForm.sla_hours) : null }),
    });
    setSaving(false);
    trackEvent('Taskmanager Task Created', { priority: taskForm.priority, category: taskForm.category });
    setShowTaskModal(false);
    setTaskForm({ title: '', description: '', priority: 'Medium', assigned_to: '', due_date: '', sla_hours: '', category: 'general' });
    load();
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/admin/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    trackEvent('Taskmanager Task Status Changed', { status });
    load();
  };

  const resolveWarning = async (warningId: string) => {
    await fetch(`/api/admin/projects/${projectId}/warnings/${warningId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    });
    trackEvent('Taskmanager Warning Resolved', {});
    setWarnings(w => w.filter(x => x.id !== warningId));
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;
    await fetch(`/api/admin/projects/${projectId}/tasks/${selectedTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentText }),
    });
    trackEvent('Taskmanager Comment Added', {});
    setCommentText('');
    loadComments(selectedTask.id);
  };

  const addMember = async (userId: string, role: string) => {
    await fetch(`/api/admin/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    });
    trackEvent('Taskmanager Member Added', { role });
    setShowMemberModal(false);
    load();
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the project?')) return;
    await fetch(`/api/admin/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
    trackEvent('Taskmanager Member Removed', {});
    load();
  };

  const openTaskDetail = async (task: Task) => {
    setSelectedTask(task);
    await loadComments(task.id);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-slate-400">Loading project...</div>
    </div>
  );

  if (!project) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-slate-400">Project not found</div>
    </div>
  );

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    blocked: tasks.filter(t => t.status === 'blocked'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/taskmanager/projects" className="hover:text-white transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-white">{project.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            {project.description && <p className="text-slate-400 text-sm mt-0.5">{project.description}</p>}
          </div>
          <div className="flex gap-2">
            {warnings.length > 0 && (
              <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                ⚠️ {warnings.length} warnings
              </span>
            )}
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Add Task
            </button>
          </div>
        </div>
        <div className="flex gap-6 mt-2 text-xs text-slate-400">
          <span>📋 {tasks.length} tasks</span>
          <span>👥 {members.length} members</span>
          <span>✅ {tasksByStatus.done.length} done</span>
          {project.end_date && <span>📅 Due {new Date(project.end_date).toLocaleDateString('en-IN')}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 mb-5">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
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
      {tab === 'Overview' && (() => {
        const now = new Date();
        const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && !['done','cancelled'].includes(t.status));
        const completionPct = tasks.length > 0 ? Math.round((tasksByStatus.done.length / tasks.length) * 100) : 0;
        return (
          <div className="space-y-5">
            {/* KPI bar */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Tasks',   value: tasks.length,               color: 'text-white' },
                { label: 'Done',          value: tasksByStatus.done.length,   color: 'text-green-400' },
                { label: 'In Progress',   value: tasksByStatus.in_progress.length, color: 'text-blue-400' },
                { label: 'Blocked',       value: tasksByStatus.blocked.length,color: tasksByStatus.blocked.length > 0 ? 'text-red-400' : 'text-slate-400' },
                { label: 'Overdue',       value: overdueTasks.length,         color: overdueTasks.length > 0 ? 'text-red-400' : 'text-slate-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#0c1022] border border-slate-800 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                {/* Progress bar */}
                <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Completion Progress</h3>
                    <span className="text-sm font-bold text-teal-400">{completionPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                  </div>
                  {/* Status breakdown */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {Object.entries(tasksByStatus).map(([status, list]) => (
                      <div key={status} className={`rounded-lg p-2.5 ${status === 'blocked' && list.length > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/60'}`}>
                        <div className="text-lg font-bold text-white">{list.length}</div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">{status.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Priority breakdown */}
                  {tasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                      <div className="text-xs text-slate-500 font-medium mb-2">Open tasks by priority</div>
                      {(['Urgent', 'High', 'Medium', 'Low'] as const).map(p => {
                        const count = tasks.filter(t => t.priority === p && !['done','cancelled'].includes(t.status)).length;
                        const total = tasks.filter(t => !['done','cancelled'].includes(t.status)).length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        if (!count) return null;
                        return (
                          <div key={p} className="flex items-center gap-3">
                            <span className={`text-[10px] w-12 text-right font-medium ${p === 'Urgent' ? 'text-red-400' : p === 'High' ? 'text-orange-400' : p === 'Medium' ? 'text-yellow-400' : 'text-slate-400'}`}>{p}</span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${p === 'Urgent' ? 'bg-red-500' : p === 'High' ? 'bg-orange-500' : p === 'Medium' ? 'bg-yellow-500' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 w-5 text-right tabular-nums">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Per-member performance */}
                {members.length > 0 && (
                  <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Member Performance</h3>
                    <div className="space-y-3">
                      {members.map(m => {
                        const mTasks = tasks.filter(t => t.assigned_to === m.user_id);
                        const mDone = mTasks.filter(t => t.status === 'done').length;
                        const mOpen = mTasks.filter(t => !['done','cancelled'].includes(t.status)).length;
                        const mOverdue = mTasks.filter(t => t.due_date && new Date(t.due_date) < now && !['done','cancelled'].includes(t.status)).length;
                        const mPct = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;
                        return (
                          <div key={m.user_id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                            <div className="h-8 w-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[10px] font-bold text-teal-300 shrink-0">
                              {(m.profiles?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-200 truncate">{m.profiles?.full_name}</span>
                                {m.user_id === project.owner_id && <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 rounded">owner</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${mPct >= 80 ? 'bg-green-500' : mPct >= 50 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${mPct}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-600">{mPct}%</span>
                              </div>
                            </div>
                            <div className="flex gap-4 text-right shrink-0">
                              <div><div className="text-xs font-bold text-white tabular-nums">{mTasks.length}</div><div className="text-[9px] text-slate-600">total</div></div>
                              <div><div className="text-xs font-bold text-green-400 tabular-nums">{mDone}</div><div className="text-[9px] text-slate-600">done</div></div>
                              <div><div className={`text-xs font-bold tabular-nums ${mOverdue > 0 ? 'text-red-400' : 'text-slate-400'}`}>{mOverdue}</div><div className="text-[9px] text-slate-600">overdue</div></div>
                              {mOpen > 10 && <div className="text-[10px] text-amber-400">⚠ overloaded</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent activity */}
                <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
                  {activity.length === 0 ? (
                    <p className="text-slate-500 text-sm">No activity yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activity.slice(0, 8).map(item => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                          <div>
                            <span className="text-xs text-white">{item.actor?.full_name || 'System'}</span>
                            <span className="text-xs text-slate-400"> {item.action.replace(/_/g, ' ')}</span>
                            {item.meta?.title && <span className="text-xs text-slate-300"> "{item.meta.title}"</span>}
                            <div className="text-xs text-slate-600">{new Date(item.created_at).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Team Members</h3>
                    <button onClick={() => setShowMemberModal(true)} className="text-xs text-teal-400 hover:text-teal-300">+ Add</button>
                  </div>
                  <div className="space-y-3">
                    {members.map(m => {
                      const mOpen = tasks.filter(t => t.assigned_to === m.user_id && !['done','cancelled'].includes(t.status)).length;
                      return (
                        <div key={m.user_id} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-white">{m.profiles?.full_name}</div>
                            <div className="text-xs text-slate-500 capitalize">{m.role} · {mOpen} open</div>
                          </div>
                          {m.user_id !== project.owner_id && (
                            <button onClick={() => removeMember(m.user_id)} className="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100">✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project dates */}
                {(project.start_date || project.end_date) && (
                  <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">Timeline</h3>
                    <div className="space-y-2 text-xs">
                      {project.start_date && <div className="flex justify-between"><span className="text-slate-500">Start</span><span className="text-slate-300">{new Date(project.start_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span></div>}
                      {project.end_date && <div className="flex justify-between"><span className="text-slate-500">Target</span><span className={`font-medium ${new Date(project.end_date) < now ? 'text-red-400' : 'text-slate-300'}`}>{new Date(project.end_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span></div>}
                    </div>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="bg-[#0c1022] border border-amber-500/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠️ Active Warnings</h3>
                    <div className="space-y-2">
                      {warnings.slice(0, 3).map(w => (
                        <div key={w.id} className={`text-xs p-2 rounded border ${SEVERITY_COLOR[w.severity]}`}>{w.message}</div>
                      ))}
                      {warnings.length > 3 && (
                        <button onClick={() => setTab('Warnings')} className="text-xs text-slate-400 hover:text-white">+{warnings.length - 3} more →</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TASKS TAB */}
      {tab === 'Tasks' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowTaskModal(true)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm transition-colors">
              + Add Task
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {Object.entries(tasksByStatus).map(([status, list]) => (
              <div key={status} className="bg-[#0c1022] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">{status.replace('_', ' ')}</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map(task => (
                    <div
                      key={task.id}
                      onClick={() => openTaskDetail(task)}
                      className="bg-slate-800/60 hover:bg-slate-700/60 rounded-lg p-3 cursor-pointer transition-colors"
                    >
                      <p className="text-xs text-white font-medium leading-snug mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${task.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' : task.priority === 'High' ? 'bg-orange-500/20 text-orange-400' : task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                          {task.priority}
                        </span>
                        {task.profiles && <span className="text-[10px] text-slate-500">{task.profiles.full_name.split(' ')[0]}</span>}
                      </div>
                      {task.due_date && (
                        <div className={`text-[10px] mt-1 ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
                          📅 {new Date(task.due_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'Members' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowMemberModal(true)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm transition-colors">
              + Add Member
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => {
              const taskCount = tasks.filter(t => t.assigned_to === m.user_id && t.status !== 'done').length;
              return (
                <div key={m.user_id} className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{m.profiles?.full_name}</div>
                      <div className="text-xs text-slate-500 capitalize mt-0.5">{m.role}</div>
                    </div>
                    {m.user_id === project.owner_id && (
                      <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Owner</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{taskCount} open tasks</span>
                    {m.user_id !== project.owner_id && (
                      <button onClick={() => removeMember(m.user_id)} className="text-red-400 hover:text-red-300">Remove</button>
                    )}
                  </div>
                  {taskCount > 10 && (
                    <div className="mt-2 text-xs text-amber-400">⚠️ Overloaded</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WARNINGS TAB */}
      {tab === 'Warnings' && (
        <div className="space-y-3">
          {warnings.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-4xl mb-2">✅</div>
              <p>No active warnings</p>
            </div>
          ) : warnings.map(w => (
            <div key={w.id} className={`border rounded-xl p-4 flex items-center justify-between ${SEVERITY_COLOR[w.severity]}`}>
              <div>
                <div className="text-sm font-medium">{w.message}</div>
                <div className="text-xs opacity-70 mt-0.5 capitalize">{w.severity} · {w.warning_type.replace(/_/g, ' ')} · {new Date(w.created_at).toLocaleString('en-IN')}</div>
              </div>
              <button
                onClick={() => resolveWarning(w.id)}
                className="ml-4 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors shrink-0"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === 'Activity' && (
        <div className="space-y-2">
          {activity.map(item => (
            <div key={item.id} className="flex gap-4 py-3 border-b border-slate-800">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-medium">{item.actor?.full_name || 'System'}</span>
                <span className="text-sm text-slate-400"> {item.action.replace(/_/g, ' ')}</span>
                {item.meta?.title && <span className="text-sm text-slate-300"> "{item.meta.title}"</span>}
              </div>
              <div className="text-xs text-slate-500 shrink-0">{new Date(item.created_at).toLocaleString('en-IN')}</div>
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
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BG[selectedTask.status]}`}>{selectedTask.status.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-400">{selectedTask.priority}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Change Status</label>
                <div className="flex flex-wrap gap-2">
                  {['todo', 'in_progress', 'review', 'blocked', 'done'].map(s => (
                    <button
                      key={s}
                      onClick={() => { updateTaskStatus(selectedTask.id, s); setSelectedTask({ ...selectedTask, status: s }); }}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${selectedTask.status === s ? STATUS_BG[s] + ' ring-1 ring-teal-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
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
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-600"
                  />
                  <button type="submit" className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs transition-colors">Post</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Add Task</h2>
            </div>
            <form onSubmit={createTask} className="p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Title *</label>
                <input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Assign To</label>
                  <select value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600">
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600">
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">SLA (hours)</label>
                  <input type="number" value={taskForm.sla_hours} onChange={e => setTaskForm(f => ({ ...f, sla_hours: e.target.value }))} placeholder="e.g. 24" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium">
                  {saving ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Add Member</h2>
            </div>
            <div className="p-5">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allUsers
                  .filter(u => !members.find(m => m.user_id === u.id))
                  .map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                      <div>
                        <div className="text-sm text-white">{u.full_name}</div>
                        <div className="text-xs text-slate-500">{u.role}</div>
                      </div>
                      <button onClick={() => addMember(u.id, 'member')} className="text-xs px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded transition-colors">
                        Add
                      </button>
                    </div>
                  ))}
              </div>
              <button onClick={() => setShowMemberModal(false)} className="w-full mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
