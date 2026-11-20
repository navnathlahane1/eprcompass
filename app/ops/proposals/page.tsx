'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

const STATUS_COLORS: Record<string, string> = {
  draft:      'text-slate-400 bg-slate-800',
  in_review:  'text-amber-400 bg-amber-900/30',
  sent:       'text-blue-400 bg-blue-900/30',
  approved:   'text-green-400 bg-green-900/30',
  rejected:   'text-red-400 bg-red-900/30',
};

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  role_context: string | null;
  created_at: string;
}

export default function OpsProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/ops/tasks?status=all&role_context=proposal&page=1');
    const data = await res.json();
    setProposals(data.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/ops/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role_context: 'proposal' }),
    });
    trackEvent('Ops Proposal Created', { priority: form.priority });
    setShowCreate(false);
    setForm({ title: '', description: '', due_date: '', priority: 'normal' });
    setSubmitting(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Proposals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Draft and track EPR service proposals</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Proposal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-slate-400">No proposals yet</p>
          <p className="text-sm mt-1">Create your first proposal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                    {p.due_date && (
                      <span className="text-[10px] text-slate-500">
                        Due {new Date(p.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{p.title}</p>
                  {p.description && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{p.description}</p>}
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    Created {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
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
              <h2 className="font-semibold text-slate-100">New Proposal</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Proposal Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. EPR Registration Proposal — Acme Corp"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Client details, scope, services…"
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
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
