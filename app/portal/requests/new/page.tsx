'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { trackEvent } from '@/lib/analytics';

const EPR_TYPES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Extended Producer Responsibility'];
const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const INDIAN_STATES = ['All India', ...INDIA_STATES_UTS];

export default function NewRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    eprType: '',
    requiredQty: '',
    unit: 'MT',
    urgency: 'MEDIUM',
    statesCovered: [] as string[],
    budgetIndication: '',
    currency: 'INR',
    hideBudget: false,
    message: '',
    preferredDeliveryDate: '',
    maxRounds: '5',
    expiresInDays: '7',
    targetType: 'OPEN_TO_NETWORK' as 'OPEN_TO_NETWORK' | 'SPECIFIC',
    recyclerCodes: '',
  });

  function toggleState(s: string) {
    setForm((f) => ({
      ...f,
      statesCovered: f.statesCovered.includes(s)
        ? f.statesCovered.filter((x) => x !== s)
        : [...f.statesCovered, s],
    }));
  }

  async function submit() {
    setError('');
    if (!form.eprType || !form.requiredQty) {
      setError('EPR type and quantity are required.');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        eprType: form.eprType,
        requiredQty: Number(form.requiredQty),
        unit: form.unit,
        urgency: form.urgency,
        statesCovered: form.statesCovered,
        budgetIndication: form.budgetIndication ? Number(form.budgetIndication) : null,
        currency: form.currency,
        hideBudget: form.hideBudget,
        message: form.message,
        preferredDeliveryDate: form.preferredDeliveryDate || null,
        maxRounds: Number(form.maxRounds),
        expiresInDays: Number(form.expiresInDays),
        targetType: form.targetType,
      };
      if (form.targetType === 'SPECIFIC') {
        body.recyclerCodes = form.recyclerCodes.split(',').map((s) => s.trim()).filter(Boolean);
      }
      const res = await fetch('/api/corporate/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Failed to create request');
      else {
        trackEvent('Client Recycler Request Created', { epr_type: form.eprType, urgency: form.urgency, target_type: form.targetType });
        router.push(`/portal/requests/${data.request.id}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';
  const lbl = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Send a Recycler Request</h1>

      {/* What you need */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">What do you need?</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>EPR Type *</label>
            <select value={form.eprType} onChange={(e) => setForm(f => ({ ...f, eprType: e.target.value }))} className={field}>
              <option value="">Select…</option>
              {EPR_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Urgency</label>
            <select value={form.urgency} onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))} className={field}>
              {URGENCY_LEVELS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Quantity Required *</label>
            <input type="number" min={1} value={form.requiredQty} onChange={(e) => setForm(f => ({ ...f, requiredQty: e.target.value }))} className={field} />
          </div>
          <div>
            <label className={lbl}>Unit</label>
            <input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className={field} placeholder="MT, KG, Units…" />
          </div>
        </div>
        <div>
          <label className={lbl}>Message to Recyclers</label>
          <textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className={`${field} resize-none`} />
        </div>
        <div>
          <label className={lbl}>Preferred Delivery Date</label>
          <input type="date" value={form.preferredDeliveryDate} onChange={(e) => setForm(f => ({ ...f, preferredDeliveryDate: e.target.value }))} className={field} />
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">States Covered</h2>
        <div className="flex flex-wrap gap-2">
          {INDIAN_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleState(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                form.statesCovered.includes(s)
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-purple-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Budget (Optional)</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Budget Indication</label>
            <input type="number" min={0} value={form.budgetIndication} onChange={(e) => setForm(f => ({ ...f, budgetIndication: e.target.value }))} className={field} />
          </div>
          <div>
            <label className={lbl}>Currency</label>
            <select value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} className={field}>
              <option>INR</option>
              <option>USD</option>
              <option>AED</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.hideBudget} onChange={(e) => setForm(f => ({ ...f, hideBudget: e.target.checked }))} />
          Hide budget from recyclers
        </label>
      </div>

      {/* Targeting */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Targeting</h2>
        <div className="flex gap-4">
          {(['OPEN_TO_NETWORK', 'SPECIFIC'] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                checked={form.targetType === t}
                onChange={() => setForm(f => ({ ...f, targetType: t }))}
              />
              {t === 'OPEN_TO_NETWORK' ? 'Open to all recyclers' : 'Send to specific recyclers'}
            </label>
          ))}
        </div>
        {form.targetType === 'SPECIFIC' && (
          <div>
            <label className={lbl}>Recycler Codes (comma-separated)</label>
            <input value={form.recyclerCodes} onChange={(e) => setForm(f => ({ ...f, recyclerCodes: e.target.value }))} className={field} placeholder="RCY-001, RCY-002…" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Max Negotiation Rounds</label>
            <select value={form.maxRounds} onChange={(e) => setForm(f => ({ ...f, maxRounds: e.target.value }))} className={field}>
              {[1, 2, 3, 5, 7, 10].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Expires In (days)</label>
            <select value={form.expiresInDays} onChange={(e) => setForm(f => ({ ...f, expiresInDays: e.target.value }))} className={field}>
              {[3, 5, 7, 14, 30].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Send Request'}
      </button>
    </div>
  );
}
