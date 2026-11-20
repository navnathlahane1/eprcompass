'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const STAGES = ['Qualification', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;
type Stage = typeof STAGES[number];

const STAGE_COLORS: Record<string, string> = {
  'Qualification':  'border-blue-600/40 bg-blue-900/10',
  'Proposal Sent':  'border-purple-600/40 bg-purple-900/10',
  'Negotiation':    'border-amber-600/40 bg-amber-900/10',
  'Closed Won':     'border-green-600/40 bg-green-900/10',
  'Closed Lost':    'border-slate-700 bg-slate-800/30',
};
const STAGE_BADGE: Record<string, string> = {
  'Qualification':  'text-blue-400 bg-blue-900/30',
  'Proposal Sent':  'text-purple-400 bg-purple-900/30',
  'Negotiation':    'text-amber-400 bg-amber-900/30',
  'Closed Won':     'text-green-400 bg-green-900/30',
  'Closed Lost':    'text-slate-400 bg-slate-800',
};
const STAGE_PROB: Record<string, number> = {
  'Qualification': 20, 'Proposal Sent': 40, 'Negotiation': 65, 'Closed Won': 100, 'Closed Lost': 0,
};

interface Deal {
  id: string;
  title: string;
  stage: Stage;
  amount_inr: number | null;
  probability: number | null;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  lead: { company_name: string | null; name: string | null } | null;
  assignee: { full_name: string | null } | null;
}

interface Summary { count: number; value: number }
type Pipeline = Partial<Record<Stage, Summary>>;

export default function DealsClient() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leads, setLeads] = useState<{ id: string; company_name: string | null }[]>([]);
  const [form, setForm] = useState({
    lead_id: '', title: '', stage: 'Qualification' as Stage,
    amount_inr: '', expected_close_date: '', notes: '',
  });
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ stage: stageFilter });
    const res = await fetch(`/api/telecalling/deals?${params}`);
    const data = await res.json();
    setDeals(data.deals ?? []);
    setPipeline(data.pipeline ?? {});
    setLoading(false);
  }, [stageFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/admin/telecalling/leads?limit=200&page=1')
      .then(r => r.json())
      .then(d => setLeads((d.leads ?? []).slice(0, 100)));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/telecalling/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    trackEvent('Deal Created', { stage: form.stage, amount_inr: form.amount_inr || null });
    setShowCreate(false);
    setForm({ lead_id: '', title: '', stage: 'Qualification', amount_inr: '', expected_close_date: '', notes: '' });
    setSubmitting(false);
    load();
  }

  async function moveStage(deal: Deal, newStage: Stage) {
    setUpdatingStage(deal.id);
    await fetch(`/api/telecalling/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    trackEvent('Deal Stage Changed', { from_stage: deal.stage, to_stage: newStage, amount_inr: deal.amount_inr });
    setUpdatingStage(null);
    load();
  }

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtMoney(n: number | null) {
    if (!n) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }

  const totalPipeline = Object.values(pipeline).reduce((sum, s) => sum + (s?.value ?? 0), 0);
  const activeDeals = Object.entries(pipeline)
    .filter(([s]) => s !== 'Closed Won' && s !== 'Closed Lost')
    .reduce((sum, [, s]) => sum + (s?.count ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Deal Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your sales deals</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Deal
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Pipeline</p>
          <p className="text-lg font-bold text-teal-400">{fmtMoney(totalPipeline)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500 mb-1">Active Deals</p>
          <p className="text-lg font-bold text-slate-100">{activeDeals}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500 mb-1">Won</p>
          <p className="text-lg font-bold text-green-400">{fmtMoney(pipeline['Closed Won']?.value ?? null)}</p>
          <p className="text-[10px] text-slate-600">{pipeline['Closed Won']?.count ?? 0} deals</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500 mb-1">Lost</p>
          <p className="text-lg font-bold text-slate-400">{pipeline['Closed Lost']?.count ?? 0} deals</p>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex gap-1 mb-6 border-b border-slate-700/60 overflow-x-auto">
        {['all', ...STAGES].map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              stageFilter === s ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {s === 'all' ? 'All' : s}
            {s !== 'all' && pipeline[s as Stage] ? ` (${pipeline[s as Stage]!.count})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-medium text-slate-400">No deals yet</p>
          <p className="text-sm mt-1">Create your first deal to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => (
            <div key={deal.id} className={`rounded-xl border p-4 ${STAGE_COLORS[deal.stage] ?? 'border-slate-800 bg-slate-900/60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_BADGE[deal.stage] ?? ''}`}>
                      {deal.stage}
                    </span>
                    {deal.probability !== null && (
                      <span className="text-[10px] text-slate-500">{deal.probability}% probability</span>
                    )}
                    {deal.amount_inr && (
                      <span className="text-[11px] font-bold text-emerald-400">{fmtMoney(deal.amount_inr)}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{deal.title}</p>
                  {deal.lead && (
                    <p className="text-xs text-slate-400 mt-0.5">{deal.lead.company_name || deal.lead.name || '—'}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    {deal.expected_close_date && <span>Close by {fmt(deal.expected_close_date)}</span>}
                    {deal.assignee && <span>Assigned: {deal.assignee.full_name}</span>}
                    <span>Created {fmt(deal.created_at)}</span>
                  </div>
                  {deal.notes && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{deal.notes}</p>}
                </div>

                {/* Stage mover */}
                {deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost' && (
                  <div className="shrink-0 flex flex-col gap-1">
                    {updatingStage === deal.id ? (
                      <span className="text-[10px] text-slate-500">Updating…</span>
                    ) : (
                      <select
                        value={deal.stage}
                        onChange={e => moveStage(deal, e.target.value as Stage)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 focus:border-teal-500 focus:outline-none"
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Probability bar */}
              <div className="mt-3 h-1 w-full rounded-full bg-slate-800">
                <div
                  className={`h-1 rounded-full transition-all ${deal.stage === 'Closed Won' ? 'bg-green-500' : deal.stage === 'Closed Lost' ? 'bg-slate-600' : 'bg-teal-500'}`}
                  style={{ width: `${deal.probability ?? STAGE_PROB[deal.stage] ?? 20}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Deal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">New Deal</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Deal Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. EPR Package — Acme Plastics"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Client Lead</label>
                <select
                  value={form.lead_id}
                  onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">— Select lead —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.company_name || l.id}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Stage</label>
                  <select
                    value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={form.amount_inr}
                    onChange={e => setForm(f => ({ ...f, amount_inr: e.target.value }))}
                    placeholder="e.g. 75000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Expected Close Date</label>
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any context about this deal…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>
              <p className="text-[10px] text-slate-600">Probability auto-set by stage: {STAGE_PROB[form.stage]}%</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
