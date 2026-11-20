'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Application {
  id: string;
  application_number: string;
  finance_type: string;
  requested_amount_inr: number;
  collateral_credits_mt: number | null;
  tenure_months: number | null;
  purpose: string | null;
  status: string;
  approved_amount_inr: number | null;
  interest_rate_pct: number | null;
  lender_name: string | null;
  disbursed_at: string | null;
  remarks: string | null;
  created_at: string;
}

interface Eligibility {
  issued_credit_value_inr: number;
  issued_credit_qty_mt: number;
  max_advance_inr: number;
  advance_rate_pct: number;
  outstanding_inr: number;
}

const FINANCE_TYPES = [
  { value: 'ADVANCE_AGAINST_CREDITS', label: 'Advance Against Credits', desc: 'Unlock up to 70% of your issued EPR credit value before they are sold.', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01' },
  { value: 'WORKING_CAPITAL', label: 'Working Capital', desc: 'Short-term capital to fund collection, processing, and operations.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
  { value: 'INVOICE_FACTORING', label: 'Invoice Factoring', desc: 'Get paid early on outstanding recycler invoices.', icon: 'M9 7h6m0 10v-3m-3 3h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { value: 'EQUIPMENT_LOAN', label: 'Equipment Loan', desc: 'Finance new shredders, balers, and processing machinery.', icon: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4' },
];

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-300',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 border-purple-300',
  APPROVED: 'bg-teal-100 text-teal-800 border-teal-300',
  DISBURSED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  REPAID: 'bg-gray-100 text-gray-600 border-gray-300',
  WITHDRAWN: 'bg-gray-100 text-gray-500 border-gray-300',
};

function fmtINR(n: number | null) { return n != null ? '₹' + n.toLocaleString('en-IN') : '—'; }
function label(s: string) { return s.replace(/_/g, ' '); }
function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

export default function FinancingPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ finance_type: '', requested_amount_inr: '', collateral_credits_mt: '', tenure_months: '', purpose: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [banner, setBanner] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/financing').then(r => r.json())
      .then(d => { setApplications(d.applications ?? []); setEligibility(d.eligibility ?? null); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  function openApply(type?: string) {
    setForm({ finance_type: type ?? '', requested_amount_inr: '', collateral_credits_mt: '', tenure_months: '', purpose: '' });
    setErr(''); setBanner(''); setOpen(true);
  }

  async function save() {
    if (!form.finance_type) { setErr('Select a financing type'); return; }
    if (!form.requested_amount_inr || Number(form.requested_amount_inr) <= 0) { setErr('Enter a valid amount'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/recycler-portal/financing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed'); return; }
      trackEvent('Recycler Financing Application Submitted', { finance_type: form.finance_type, amount: Number(form.requested_amount_inr) });
      setOpen(false); setBanner(d.message || 'Application submitted.'); load();
    } finally { setSaving(false); }
  }

  async function withdraw(id: string) {
    await fetch(`/api/recycler-portal/financing/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'withdraw' }) });
    trackEvent('Recycler Financing Application Withdrawn', {});
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Financing</h1>
          <p className="text-sm text-gray-500 mt-1">Monetize your EPR credits early and access working capital, factoring &amp; equipment loans.</p>
        </div>
        <button onClick={() => openApply()} className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">+ Apply for Financing</button>
      </div>

      {banner && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{banner}</div>}

      {/* Eligibility */}
      {eligibility && (
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-5">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide">Your Advance Eligibility</p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-teal-600">Issued Credit Value</p><p className="text-xl font-bold text-teal-900">{fmtINR(eligibility.issued_credit_value_inr)}</p></div>
            <div><p className="text-xs text-teal-600">Available ({eligibility.advance_rate_pct}%)</p><p className="text-xl font-bold text-green-700">{fmtINR(eligibility.max_advance_inr)}</p></div>
            <div><p className="text-xs text-teal-600">Credits Held</p><p className="text-xl font-bold text-teal-900">{eligibility.issued_credit_qty_mt} MT</p></div>
            <div><p className="text-xs text-teal-600">Outstanding</p><p className="text-xl font-bold text-teal-900">{fmtINR(eligibility.outstanding_inr)}</p></div>
          </div>
          {eligibility.max_advance_inr > 0 && (
            <button onClick={() => openApply('ADVANCE_AGAINST_CREDITS')} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              Get {fmtINR(eligibility.max_advance_inr)} Advance →
            </button>
          )}
        </div>
      )}

      {/* Product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FINANCE_TYPES.map(t => (
          <button key={t.value} onClick={() => openApply(t.value)} className="text-left rounded-xl border border-gray-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">{t.label}</p>
            </div>
            <p className="text-xs text-gray-500">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Applications */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">My Applications</h2>
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center"><p className="text-sm text-gray-500">No financing applications yet.</p></div>
        ) : (
          <div className="space-y-3">
            {applications.map(a => (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-gray-400">{a.application_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[a.status]}`}>{label(a.status)}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{label(a.finance_type)}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{fmtINR(a.requested_amount_inr)} requested
                      {a.approved_amount_inr ? ` · ${fmtINR(a.approved_amount_inr)} approved` : ''}
                      {a.interest_rate_pct ? ` @ ${a.interest_rate_pct}%` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {a.tenure_months ? `${a.tenure_months} months · ` : ''}Applied {fmt(a.created_at)}
                      {a.lender_name && ` · ${a.lender_name}`}{a.disbursed_at && ` · Disbursed ${fmt(a.disbursed_at)}`}
                    </p>
                    {a.purpose && <p className="text-xs text-gray-500 mt-0.5">{a.purpose}</p>}
                    {a.remarks && <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1">{a.remarks}</p>}
                  </div>
                  {['SUBMITTED', 'UNDER_REVIEW', 'DRAFT'].includes(a.status) && (
                    <button onClick={() => withdraw(a.id)} className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50">Withdraw</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="my-4 w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Apply for Financing</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Financing Type *</label><select value={form.finance_type} onChange={e => setForm((f: any) => ({ ...f, finance_type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select…</option>{FINANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹) *</label><input type="number" value={form.requested_amount_inr} onChange={e => setForm((f: any) => ({ ...f, requested_amount_inr: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Collateral Credits (MT)</label><input type="number" step={0.1} value={form.collateral_credits_mt} onChange={e => setForm((f: any) => ({ ...f, collateral_credits_mt: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tenure (months)</label><input type="number" value={form.tenure_months} onChange={e => setForm((f: any) => ({ ...f, tenure_months: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Purpose</label><textarea rows={2} value={form.purpose} onChange={e => setForm((f: any) => ({ ...f, purpose: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" /></div>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500">Subject to credit assessment & KYC. Final terms confirmed after review by our finance team / partner lenders.</div>
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
