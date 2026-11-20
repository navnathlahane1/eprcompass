'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { trackEvent } from '@/lib/analytics';

const EPR_TYPES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Extended Producer Responsibility'];
const TENDER_TYPES = ['OPEN', 'RESTRICTED', 'EMERGENCY'];
const INDIAN_STATES = ['All India', ...INDIA_STATES_UTS];

export default function NewTenderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    eprType: '',
    tenderType: 'OPEN',
    quantityRequired: '',
    unit: 'MT',
    targetStates: [] as string[],
    submissionDeadline: '',
    deliveryTimeline: '',
    priceIndication: '',
    currency: 'INR',
    technicalRequirements: '',
    minCapacity: '',
    requiredCertifications: '',
  });

  function toggleState(s: string) {
    setForm((f) => ({
      ...f,
      targetStates: f.targetStates.includes(s)
        ? f.targetStates.filter((x) => x !== s)
        : [...f.targetStates, s],
    }));
  }

  async function submit(asDraft: boolean) {
    setError('');
    if (!form.title || !form.eprType || !form.quantityRequired) {
      setError('Title, EPR type, and quantity are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/corporate/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          eprType: form.eprType,
          tenderType: form.tenderType,
          quantityRequired: Number(form.quantityRequired),
          unit: form.unit,
          targetStates: form.targetStates,
          submissionDeadline: form.submissionDeadline || null,
          deliveryTimeline: form.deliveryTimeline || null,
          priceIndication: form.priceIndication ? Number(form.priceIndication) : null,
          currency: form.currency,
          eligibilityCriteria: {
            technicalRequirements: form.technicalRequirements,
            minCapacity: form.minCapacity ? Number(form.minCapacity) : null,
            requiredCertifications: form.requiredCertifications
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
          asDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create tender');
      } else {
        trackEvent('Tender Submitted', { epr_type: form.eprType, as_draft: asDraft });
        router.push(`/portal/tenders/${data.tender.id}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const label = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Post a New Tender</h1>

      {/* Basic Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Basic Information</h2>
        <div>
          <label className={label}>Tender Title *</label>
          <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className={field} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${field} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>EPR Type *</label>
            <select value={form.eprType} onChange={(e) => setForm(f => ({ ...f, eprType: e.target.value }))} className={field}>
              <option value="">Select…</option>
              {EPR_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Tender Type</label>
            <select value={form.tenderType} onChange={(e) => setForm(f => ({ ...f, tenderType: e.target.value }))} className={field}>
              {TENDER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Quantity Required *</label>
            <input type="number" min={1} value={form.quantityRequired} onChange={(e) => setForm(f => ({ ...f, quantityRequired: e.target.value }))} className={field} />
          </div>
          <div>
            <label className={label}>Unit</label>
            <input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className={field} placeholder="MT, KG, Units…" />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Target States</h2>
        <div className="flex flex-wrap gap-2">
          {INDIAN_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleState(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                form.targetStates.includes(s)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline & Price */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Timeline & Pricing</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Submission Deadline</label>
            <input type="datetime-local" value={form.submissionDeadline} onChange={(e) => setForm(f => ({ ...f, submissionDeadline: e.target.value }))} className={field} />
          </div>
          <div>
            <label className={label}>Delivery Timeline</label>
            <input value={form.deliveryTimeline} onChange={(e) => setForm(f => ({ ...f, deliveryTimeline: e.target.value }))} className={field} placeholder="e.g. Within 30 days" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Price Indication (optional)</label>
            <input type="number" min={0} value={form.priceIndication} onChange={(e) => setForm(f => ({ ...f, priceIndication: e.target.value }))} className={field} />
          </div>
          <div>
            <label className={label}>Currency</label>
            <select value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} className={field}>
              <option>INR</option>
              <option>USD</option>
              <option>AED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Eligibility */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Eligibility Criteria</h2>
        <div>
          <label className={label}>Technical Requirements</label>
          <textarea value={form.technicalRequirements} onChange={(e) => setForm(f => ({ ...f, technicalRequirements: e.target.value }))} rows={3} className={`${field} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Min Capacity Required</label>
            <input type="number" min={0} value={form.minCapacity} onChange={(e) => setForm(f => ({ ...f, minCapacity: e.target.value }))} className={field} placeholder="MT/year" />
          </div>
          <div>
            <label className={label}>Required Certifications (comma-separated)</label>
            <input value={form.requiredCertifications} onChange={(e) => setForm(f => ({ ...f, requiredCertifications: e.target.value }))} className={field} placeholder="ISO 14001, CPCB Auth…" />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => submit(true)}
          disabled={submitting}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save as Draft'}
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Publishing…' : 'Publish Tender'}
        </button>
      </div>
    </div>
  );
}
