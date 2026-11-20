'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-slate-400 bg-slate-800',
  normal: 'text-blue-400 bg-blue-900/30',
  high:   'text-amber-400 bg-amber-900/30',
  urgent: 'text-red-400 bg-red-900/30',
};

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

export default function OpsSupportQueuePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', contact_name: '', contact_email: '', contact_phone: '', priority: 'normal', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/ops/tasks?status=all&role_context=support_ticket');
    const data = await res.json();
    const open = (data.tasks ?? []).filter((t: Ticket) => t.status === 'pending' || t.status === 'in_progress');
    setTickets(open);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    await fetch('/api/ops/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role_context: 'support_ticket' }),
    });
    trackEvent('Ops Support Ticket Created', { priority: form.priority });
    setShowCreate(false);
    setForm({ title: '', contact_name: '', contact_email: '', contact_phone: '', priority: 'normal', description: '' });
    setSubmitting(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ops/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    trackEvent('Ops Support Ticket Status Changed', { status });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Support Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Open tickets that need action — see My Tickets for full history</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="font-medium text-slate-400">Queue is empty</p>
          <p className="text-sm mt-1">No open tickets right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.normal}`}>
                      {t.priority}
                    </span>
                    {t.status === 'in_progress' && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400 bg-blue-900/30">
                        In progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{t.title}</p>
                  {t.contact_name && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.contact_name}{[t.contact_phone, t.contact_email].filter(Boolean).length ? ` · ${[t.contact_phone, t.contact_email].filter(Boolean).join(' · ')}` : ''}
                    </p>
                  )}
                  {t.description && <p className="mt-1.5 text-xs text-slate-400">{t.description}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {t.status === 'pending' && (
                    <button onClick={() => updateStatus(t.id, 'in_progress')}
                      className="rounded-lg bg-blue-900/30 hover:bg-blue-900/60 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition">
                      Claim
                    </button>
                  )}
                  <button onClick={() => updateStatus(t.id, 'done')}
                    className="rounded-lg bg-green-900/30 hover:bg-green-900/60 border border-green-700/30 px-3 py-1.5 text-xs font-semibold text-green-400 transition">
                    Resolve
                  </button>
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
              <h2 className="font-semibold text-slate-100">New Ticket</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Issue Summary *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Cannot download EPR certificate"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Name</label>
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
                  <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Details</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Adding…' : 'Add Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
