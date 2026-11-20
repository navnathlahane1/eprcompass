'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'done', 'blocked'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'Due', in_progress: 'In Progress', done: 'Resolved', blocked: 'No Response',
};
const STATUS_COLORS: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  done:        'text-green-400 bg-green-900/30',
  blocked:     'text-red-400 bg-red-900/30',
};

interface Followup {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
}

export default function OpsFollowupsPage() {
  const [items, setItems]     = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', contact_name: '', contact_phone: '', due_date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusTab, role_context: 'followup' });
    const res = await fetch(`/api/ops/tasks?${params}`);
    const data = await res.json();
    setItems(data.tasks ?? []);
    setLoading(false);
  }, [statusTab]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    await fetch('/api/ops/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role_context: 'followup' }),
    });
    trackEvent('Ops Followup Created', {});
    setShowCreate(false);
    setForm({ title: '', contact_name: '', contact_phone: '', due_date: '', description: '' });
    setSubmitting(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ops/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    trackEvent('Ops Followup Status Changed', { status });
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
          <h1 className="text-xl font-bold text-slate-100">Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-0.5">Leads and clients due for a follow-up contact</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Follow-up
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-700/60 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
              ${statusTab === tab ? 'border-rose-400 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
            {tab === 'all' ? 'All' : STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-slate-400">No follow-ups yet</p>
          <p className="text-sm mt-1">Add one to stay on top of open conversations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(f => (
            <div key={f.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[f.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[f.status] ?? f.status}
                    </span>
                    {f.due_date && (
                      <span className={`text-[10px] font-medium ${isOverdue(f.due_date) && f.status === 'pending' ? 'text-red-400' : 'text-slate-500'}`}>
                        Due {fmt(f.due_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{f.title}</p>
                  {f.contact_name && (
                    <p className="text-xs text-slate-400 mt-0.5">{f.contact_name}{f.contact_phone ? ` · ${f.contact_phone}` : ''}</p>
                  )}
                  {f.description && <p className="mt-1.5 text-xs text-slate-400">{f.description}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {f.status === 'pending' && (
                    <button onClick={() => updateStatus(f.id, 'in_progress')}
                      className="rounded-lg bg-blue-900/30 hover:bg-blue-900/60 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition">
                      Contacting
                    </button>
                  )}
                  {(f.status === 'pending' || f.status === 'in_progress') && (
                    <button onClick={() => updateStatus(f.id, 'done')}
                      className="rounded-lg bg-green-900/30 hover:bg-green-900/60 border border-green-700/30 px-3 py-1.5 text-xs font-semibold text-green-400 transition">
                      Resolved
                    </button>
                  )}
                  {f.status !== 'blocked' && f.status !== 'done' && (
                    <button onClick={() => updateStatus(f.id, 'blocked')}
                      className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition">
                      No Response
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">New Follow-up</h2>
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
                  placeholder="e.g. Follow up on pricing question"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Adding…' : 'Add Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
