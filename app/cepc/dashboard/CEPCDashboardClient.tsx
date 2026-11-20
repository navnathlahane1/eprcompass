'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { INDIA_STATES_UTS, COUNTRIES } from '@/lib/indiaGeo';
import { ComplianceStatusBadge, type ComplianceStatus } from '@/components/eco/ComplianceStatusBadge';
import { CopyableCode } from '@/components/eco/CopyableCode';
import { getDirection } from '@/lib/i18n/portal';
import TourTarget from '@/components/portal/tour/TourTarget';
import { trackEvent } from '@/lib/analytics';

const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function stageBadge(stage: string) {
  if (stage === 'Converted') return 'bg-emerald-100 text-emerald-800';
  if (stage === 'Accepted') return 'bg-blue-100 text-blue-800';
  if (stage === 'Rejected') return 'bg-red-100 text-red-800';
  if (stage === 'Reviewed') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function mapConsultantStatus(status: string): ComplianceStatus {
  if (status === 'Active') return 'compliant';
  if (status === 'Pending') return 'pending';
  if (status === 'Suspended' || status === 'Rejected') return 'overdue';
  return 'under_review';
}

export default function CEPCDashboardClient({ consultant, initialLeads, initialEarnings }: { consultant: any; initialLeads: any[]; initialEarnings: any[] }) {
  const dir = getDirection('en');
  const [leads, setLeads] = useState(initialLeads || []);
  const [earnings] = useState(initialEarnings || []);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_company: '',
    contact_name: '',
    phone: '',
    country: 'India',
    state: '',
    waste_categories: [] as string[],
    notes: ''
  });

  const stats = useMemo(() => {
    const submitted = leads.length;
    const accepted = leads.filter((l) => l.stage === 'Accepted').length;
    const converted = leads.filter((l) => l.stage === 'Converted').length;
    const pendingCommission = earnings
      .filter((e) => e.payment_status !== 'Paid')
      .reduce((sum, e) => sum + Number(e.commission_inr || 0), 0);

    return { submitted, accepted, converted, pendingCommission };
  }, [leads, earnings]);

  function toggleWaste(item: string) {
    setForm((prev) => {
      const has = prev.waste_categories.includes(item);
      return {
        ...prev,
        waste_categories: has
          ? prev.waste_categories.filter((w) => w !== item)
          : [...prev.waste_categories, item]
      };
    });
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        cepc_id: consultant.id,
        client_company: form.client_company,
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        state: form.state || null,
        waste_categories: form.waste_categories,
        service_interest: form.waste_categories,
        notes: form.notes || null,
        stage: 'Submitted'
      };

      const { data, error } = await (supabase as any)
        .from('cepc_leads')
        .insert(payload)
        .select('id, client_company, contact_name, phone, state, waste_categories, service_interest, stage, deal_value_inr, submitted_at, notes')
        .single();

      if (error) throw error;
      trackEvent('CEPC Lead Submitted', { waste_categories: form.waste_categories, state: form.state, portal: 'cepc' });
      setLeads((prev) => [data, ...prev]);
      setForm({ client_company: '', contact_name: '', phone: '', country: 'India', state: '', waste_categories: [], notes: '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir={dir} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">My CEPC Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">{consultant.full_name} · {consultant.certification_tier} · {consultant.state || '-'}</p>
          </div>
          <ComplianceStatusBadge status={mapConsultantStatus(consultant.status || '')} />
        </div>
        <div className="mt-3">
          <CopyableCode value={consultant.id || ''} label="CEPC Consultant ID" />
        </div>
      </div>

      <TourTarget id="dash-summary-cards" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Leads Submitted</p><p className="mt-2 text-2xl font-semibold text-slate-900">{stats.submitted}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Accepted</p><p className="mt-2 text-2xl font-semibold text-slate-900">{stats.accepted}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Converted</p><p className="mt-2 text-2xl font-semibold text-slate-900">{stats.converted}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Pending Commission</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(stats.pendingCommission)}</p></article>
      </TourTarget>

      <TourTarget id="dash-submit-lead" className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Submit New Lead</h3>
        <form onSubmit={submitLead} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required value={form.client_company} onChange={(e) => setForm((p) => ({ ...p, client_company: e.target.value }))} placeholder="Company" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} placeholder="Contact" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {/* Country selector */}
          <select
            value={form.country}
            onChange={(e) => setForm((p) => ({ ...p, country: e.target.value, state: '' }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* State: dropdown for India, free text otherwise */}
          {form.country === 'India' ? (
            <select
              value={form.state}
              onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select State / UT</option>
              {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="State / Province" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          )}

          <div className="sm:col-span-2 rounded-md border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Waste Categories</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {WASTE_OPTIONS.map((item) => (
                <label key={item} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.waste_categories.includes(item)} onChange={() => toggleWaste(item)} />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="sm:col-span-2 min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm" />

          <button disabled={saving} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </TourTarget>

      <TourTarget id="dash-my-leads" className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">My Leads</h3>
        <div className="mt-3 space-y-2">
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{lead.client_company}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stageBadge(lead.stage)}`}>{lead.stage}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{lead.contact_name || '-'} · {lead.phone || '-'} · {lead.state || '-'}</p>
            </article>
          ))}
          {leads.length === 0 ? <p className="text-sm text-slate-500">No leads submitted yet.</p> : null}
        </div>
      </TourTarget>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">My Earnings</h3>
        <div className="mt-3 space-y-2">
          {earnings.map((row) => (
            <article key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">Period: {row.period_month}</p>
              <p className="mt-1 text-xs text-slate-600">Gross: {formatINR(Number(row.gross_revenue_inr || 0))}</p>
              <p className="text-xs text-slate-600">Commission: {formatINR(Number(row.commission_inr || 0))}</p>
              <p className="text-xs text-slate-600">Status: {row.payment_status}</p>
            </article>
          ))}
          {earnings.length === 0 ? <p className="text-sm text-slate-500">No earnings records yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
