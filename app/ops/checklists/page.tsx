'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

export default function OpsChecklistsPage() {
  const [items, setItems]     = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/ops/tasks?status=all&role_context=checklist&page=1');
    const data = await res.json();
    setItems(data.tasks ?? []);
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
      body: JSON.stringify({ ...form, role_context: 'checklist' }),
    });
    trackEvent('Ops Checklist Item Created', {});
    setShowCreate(false);
    setForm({ title: '', description: '', due_date: '' });
    setSubmitting(false);
    load();
  }

  async function toggle(item: ChecklistItem) {
    const nextStatus = item.status === 'done' ? 'pending' : 'done';
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    trackEvent('Ops Checklist Item Toggled', { status: nextStatus });
    await fetch(`/api/ops/tasks/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  function fmt(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const done = items.filter(i => i.status === 'done').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Checklists</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {items.length > 0 ? `${done} of ${items.length} items complete` : 'Compliance document checklist items'}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Item
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="font-medium text-slate-400">No checklist items yet</p>
          <p className="text-sm mt-1">Add the first item to start tracking</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <button key={item.id} onClick={() => toggle(item)}
              className="w-full flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-slate-700 transition">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition
                ${item.status === 'done' ? 'bg-emerald-600 border-emerald-500' : 'border-slate-600'}`}>
                {item.status === 'done' && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${item.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{item.title}</p>
                {item.description && <p className="mt-1 text-xs text-slate-400">{item.description}</p>}
                {item.due_date && (
                  <p className="mt-1.5 text-[11px] text-slate-600">Due {fmt(item.due_date)}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">New Checklist Item</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Item *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Verify CTO renewal document for Acme Corp"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional context…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Adding…' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
