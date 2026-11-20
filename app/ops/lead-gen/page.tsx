'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const STAGE_TABS = ['all', 'pending', 'in_progress', 'done', 'blocked'] as const;
const STAGE_LABELS: Record<string, string> = {
  pending: 'New', in_progress: 'Contacted', done: 'Qualified', blocked: 'Disqualified',
};
const STAGE_COLORS: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  done:        'text-green-400 bg-green-900/30',
  blocked:     'text-red-400 bg-red-900/30',
};

interface Lead {
  id: string;
  title: string;
  description: string | null;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_company: string | null;
  created_at: string;
}

export default function OpsLeadGenPage() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageTab, setStageTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ contact_name: '', contact_company: '', contact_phone: '', contact_email: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: stageTab, role_context: 'lead_gen' });
    const res = await fetch(`/api/ops/tasks?${params}`);
    const data = await res.json();
    setLeads(data.tasks ?? []);
    setLoading(false);
  }, [stageTab]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name.trim()) return;
    setSubmitting(true);
    await fetch('/api/ops/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, title: form.contact_name, role_context: 'lead_gen' }),
    });
    trackEvent('Ops Lead Created', {});
    setShowCreate(false);
    setForm({ contact_name: '', contact_company: '', contact_phone: '', contact_email: '', description: '' });
    setSubmitting(false);
    load();
  }

  async function advance(lead: Lead) {
    const order = ['pending', 'in_progress', 'done'];
    const idx = order.indexOf(lead.status);
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : lead.status;
    await fetch(`/api/ops/tasks/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    trackEvent('Ops Lead Advanced', { from_status: lead.status, to_status: next });
    load();
  }

  async function disqualify(lead: Lead) {
    await fetch(`/api/ops/tasks/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'blocked' }),
    });
    trackEvent('Ops Lead Disqualified', { from_status: lead.status });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Lead Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track leads from first contact through qualification</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Lead
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-700/60 overflow-x-auto">
        {STAGE_TABS.map(tab => (
          <button key={tab} onClick={() => setStageTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
              ${stageTab === tab ? 'border-rose-400 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
            {tab === 'all' ? 'All' : STAGE_LABELS[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-medium text-slate-400">No leads yet</p>
          <p className="text-sm mt-1">Add a lead to start the pipeline</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STAGE_COLORS[lead.status] ?? STAGE_COLORS.pending}`}>
                      {STAGE_LABELS[lead.status] ?? lead.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{lead.title}</p>
                  {lead.contact_company && <p className="text-xs text-slate-400 mt-0.5">{lead.contact_company}</p>}
                  <p className="text-[11px] text-slate-500 mt-1">
                    {[lead.contact_phone, lead.contact_email].filter(Boolean).join(' · ') || 'No contact details'}
                  </p>
                  {lead.description && <p className="mt-1.5 text-xs text-slate-400">{lead.description}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {(lead.status === 'pending' || lead.status === 'in_progress') && (
                    <button onClick={() => advance(lead)}
                      className="rounded-lg bg-blue-900/30 hover:bg-blue-900/60 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition">
                      {lead.status === 'pending' ? 'Mark Contacted' : 'Mark Qualified'}
                    </button>
                  )}
                  {lead.status !== 'blocked' && lead.status !== 'done' && (
                    <button onClick={() => disqualify(lead)}
                      className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition">
                      Disqualify
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
              <h2 className="font-semibold text-slate-100">New Lead</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name *</label>
                <input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company</label>
                <input value={form.contact_company} onChange={e => setForm(f => ({ ...f, contact_company: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Where this lead came from, interest area…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Adding…' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
