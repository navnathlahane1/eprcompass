'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'done', 'blocked'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'Scheduled', in_progress: 'Confirmed', done: 'Completed', blocked: 'Cancelled',
};
const STATUS_COLORS: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  done:        'text-green-400 bg-green-900/30',
  blocked:     'text-red-400 bg-red-900/30',
};

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
}

export default function OpsAppointmentsPage() {
  const [appts, setAppts]     = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', contact_name: '', contact_phone: '', contact_email: '', due_date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusTab, role_context: 'appointment' });
    const res = await fetch(`/api/ops/tasks?${params}`);
    const data = await res.json();
    setAppts(data.tasks ?? []);
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
      body: JSON.stringify({ ...form, role_context: 'appointment' }),
    });
    setShowCreate(false);
    setForm({ title: '', contact_name: '', contact_phone: '', contact_email: '', due_date: '', description: '' });
    setSubmitting(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ops/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function fmt(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Scheduled calls and meetings with leads or clients</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
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
      ) : appts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-medium text-slate-400">No appointments yet</p>
          <p className="text-sm mt-1">Schedule your first appointment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map(a => (
            <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[a.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                    {a.due_date && <span className="text-[10px] text-slate-500">{fmt(a.due_date)}</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{a.title}</p>
                  {a.contact_name && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {a.contact_name}{[a.contact_phone, a.contact_email].filter(Boolean).length ? ` · ${[a.contact_phone, a.contact_email].filter(Boolean).join(' · ')}` : ''}
                    </p>
                  )}
                  {a.description && <p className="mt-1.5 text-xs text-slate-400">{a.description}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {a.status === 'pending' && (
                    <button onClick={() => updateStatus(a.id, 'in_progress')}
                      className="rounded-lg bg-blue-900/30 hover:bg-blue-900/60 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition">
                      Confirm
                    </button>
                  )}
                  {(a.status === 'pending' || a.status === 'in_progress') && (
                    <button onClick={() => updateStatus(a.id, 'done')}
                      className="rounded-lg bg-green-900/30 hover:bg-green-900/60 border border-green-700/30 px-3 py-1.5 text-xs font-semibold text-green-400 transition">
                      Mark Done
                    </button>
                  )}
                  {a.status !== 'blocked' && a.status !== 'done' && (
                    <button onClick={() => updateStatus(a.id, 'blocked')}
                      className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition">
                      Cancel
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
              <h2 className="font-semibold text-slate-100">New Appointment</h2>
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
                  placeholder="e.g. Discovery call — Acme Corp"
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
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
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
                  {submitting ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
