'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import TourTarget from '@/components/portal/tour/TourTarget';
import { trackEvent } from '@/lib/analytics';

// ─── Constants ────────────────────────────────────────────────────────────────

const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Used Oil', 'Solar', 'Non-Ferrous'];
const SERVICE_OPTIONS = ['EPR Registration', 'Annual Return Filing', 'Credit Procurement', 'Compliance Advisory'];
const INDIA_STATES = INDIA_STATES_UTS;

const STAGES = ['New','Contacted','Qualified','Proposal Sent','Negotiation','Converted','Lost'] as const;

function stageBadge(stage: string) {
  if (stage === 'Converted') return 'bg-emerald-100 text-emerald-800';
  if (stage === 'Lost') return 'bg-slate-100 text-slate-600';
  if (stage === 'Negotiation') return 'bg-blue-100 text-blue-800';
  if (stage === 'Proposal Sent') return 'bg-indigo-100 text-indigo-800';
  if (stage === 'Qualified') return 'bg-violet-100 text-violet-800';
  if (stage === 'Contacted') return 'bg-cyan-100 text-cyan-800';
  return 'bg-amber-100 text-amber-800'; // New
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatINR(v: number) {
  if (!v) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

// ─── Blank form ───────────────────────────────────────────────────────────────

const BLANK = {
  client_company: '',
  contact_name: '',
  phone: '',
  email: '',
  state: '',
  waste_categories: [] as string[],
  service_interest: [] as string[],
  deal_value_inr: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerLeadsClient({
  partnerId,
  initialLeads,
}: {
  partnerId: string;
  initialLeads: any[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter((l) => l.stage === 'Converted').length;
    const active = leads.filter((l) => !['Converted', 'Lost'].includes(l.stage)).length;
    const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, converted, active, convRate };
  }, [leads]);

  // Filtered list
  const filtered = useMemo(() => {
    let out = leads;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((l) =>
        l.client_company?.toLowerCase().includes(q) ||
        l.contact_name?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q)
      );
    }
    if (filterStage) out = out.filter((l) => l.stage === filterStage);
    return out;
  }, [leads, search, filterStage]);

  function toggle(field: 'waste_categories' | 'service_interest', val: string) {
    setForm((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_company.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await (supabase as any)
        .from('partner_leads')
        .insert({
          partner_id: partnerId,
          client_company: form.client_company.trim(),
          contact_name: form.contact_name || null,
          phone: form.phone || null,
          email: form.email || null,
          state: form.state || null,
          waste_categories: form.waste_categories,
          service_interest: form.service_interest,
          deal_value_inr: form.deal_value_inr ? Number(form.deal_value_inr) : 0,
          notes: form.notes || null,
          stage: 'New',
        })
        .select()
        .single();

      if (err) { setError(err.message); return; }
      trackEvent('Partner Lead Submitted', { waste_categories: form.waste_categories, service_interest: form.service_interest, state: form.state, deal_value_inr: form.deal_value_inr ? Number(form.deal_value_inr) : 0 });
      setLeads((prev) => [data, ...prev]);
      setForm(BLANK);
      setShowForm(false);
      setSuccess(`"${data.client_company}" added to your leads.`);
      setTimeout(() => setSuccess(''), 4000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Leads</h1>
          <p className="text-sm text-slate-500">Track and manage your referred prospects.</p>
        </div>
        <TourTarget id="leads-add-action">
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Lead
          </button>
        </TourTarget>
      </div>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Stat pills */}
      <TourTarget id="leads-summary-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-50 text-slate-800' },
          { label: 'Active', value: stats.active, color: 'bg-indigo-50 text-indigo-800' },
          { label: 'Converted', value: stats.converted, color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Conv. Rate', value: `${stats.convRate}%`, color: 'bg-violet-50 text-violet-800' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-slate-200 p-3 ${s.color}`}>
            <p className="text-xs opacity-70">{s.label}</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </TourTarget>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search company, contact, state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-700">
            {leads.length === 0 ? 'No leads yet' : 'No leads match your filter'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {leads.length === 0 ? 'Click "Add Lead" to submit your first referral.' : 'Try clearing the search or stage filter.'}
          </p>
        </div>
      ) : (
        <TourTarget id="leads-table" className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Deal Value</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <>
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.client_company}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{lead.contact_name || '—'}</p>
                      {lead.phone && <p className="text-xs text-slate-400">{lead.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{lead.state || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(lead.waste_categories || []).slice(0, 2).map((c: string) => (
                          <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{c}</span>
                        ))}
                        {(lead.waste_categories || []).length > 2 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">+{lead.waste_categories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${stageBadge(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{formatINR(lead.deal_value_inr)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(lead.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedId === lead.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr key={`${lead.id}-expand`} className="bg-slate-50 border-b border-slate-100">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Contact Details</p>
                            <p className="text-slate-700">{lead.contact_name || '—'}</p>
                            {lead.email && <p className="text-slate-500">{lead.email}</p>}
                            {lead.phone && <p className="text-slate-500">{lead.phone}</p>}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Services Interested</p>
                            <div className="flex flex-wrap gap-1">
                              {(lead.service_interest || []).length > 0
                                ? lead.service_interest.map((s: string) => (
                                    <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{s}</span>
                                  ))
                                : <span className="text-slate-400">Not specified</span>
                              }
                            </div>
                          </div>
                          {lead.notes && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                              <p className="text-slate-700">{lead.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </TourTarget>
      )}

      {/* ── Add Lead Slide-Over ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Add New Lead</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              {/* Company name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.client_company}
                  onChange={(e) => setForm((p) => ({ ...p, client_company: e.target.value }))}
                  placeholder="Acme Industries Pvt Ltd"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Rajesh Kumar"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Email + State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contact@company.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="">Select state</option>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Waste categories */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Waste Categories</label>
                <div className="flex flex-wrap gap-2">
                  {WASTE_OPTIONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggle('waste_categories', w)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        form.waste_categories.includes(w)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Services Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle('service_interest', s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        form.service_interest.includes(s)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal value */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Estimated Deal Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.deal_value_inr}
                  onChange={(e) => setForm((p) => ({ ...p, deal_value_inr: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any context about this lead…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>
            </form>

            <div className="border-t border-slate-200 px-5 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="lead-form"
                onClick={handleSubmit as any}
                disabled={saving || !form.client_company.trim()}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? 'Submitting…' : 'Submit Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
