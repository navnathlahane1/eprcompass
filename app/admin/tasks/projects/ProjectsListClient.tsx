'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Profile = { id: string; full_name: string; role: string };
type Project = {
  id: string; name: string; description: string; status: string;
  start_date: string; end_date: string; owner_id: string;
  member_count?: number; task_count?: number; warning_count?: number;
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-teal-500/20 text-teal-400',
  planning: 'bg-blue-500/20 text-blue-400',
  on_hold: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function ProjectsListClient({
  currentUser,
  allUsers,
}: {
  currentUser: Profile | null;
  allUsers: Profile[];
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', start_date: '', end_date: '',
    member_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/projects');
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, owner_id: currentUser?.id }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: '', description: '', start_date: '', end_date: '', member_ids: [] });
    load();
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const toggleMember = (uid: string) => {
    setForm(f => ({
      ...f,
      member_ids: f.member_ids.includes(uid)
        ? f.member_ids.filter(id => id !== uid)
        : [...f.member_ids, uid],
    }));
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-slate-400 text-sm mt-1">Manage team projects and track progress</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'planning', 'on_hold', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="text-slate-400 text-sm">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3">📋</div>
            <p>No projects found. Create your first project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <Link key={project.id} href={`/admin/tasks/projects/${project.id}`}>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-teal-600 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm leading-snug">{project.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${STATUS_COLORS[project.status] || 'bg-slate-700 text-slate-300'}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-slate-400 text-xs mb-4 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>👥 {project.member_count ?? 0} members</span>
                    <span>✅ {project.task_count ?? 0} tasks</span>
                    {(project.warning_count ?? 0) > 0 && (
                      <span className="text-amber-400">⚠️ {project.warning_count} warnings</span>
                    )}
                  </div>
                  {project.end_date && (
                    <div className="mt-3 text-xs text-slate-500">
                      Due: {new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Create New Project</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Project Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. EPR Filing Q1 2025"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Project goals and scope..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Target Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Add Team Members</label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-800 rounded-lg p-2">
                  {allUsers.filter(u => u.id !== currentUser?.id).map(u => (
                    <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.member_ids.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                        className="accent-teal-500"
                      />
                      <span className="text-sm text-white">{u.full_name}</span>
                      <span className="text-xs text-slate-500 ml-auto">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
