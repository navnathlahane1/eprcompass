'use client';

import { use, useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface TenderDetail {
  id: string;
  tender_number: string;
  title: string;
  description: string;
  epr_type: string;
  tender_type: string;
  status: string;
  quantity_required: number;
  unit: string;
  target_states: string[];
  submission_deadline: string | null;
  delivery_timeline: string | null;
  price_indication: number | null;
  currency: string;
  eligibility_criteria: Record<string, unknown>;
  created_at: string;
}

interface TenderResponse {
  id: string;
  recycler_id: string;
  recycler_name: string;
  recycler_code: string;
  offered_qty: number;
  offered_rate: number;
  technical_proposal: string;
  status: string;
  submitted_at: string;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['AWARDED', 'CANCELLED'],
};

const RESPONSE_STATUS_LABELS: Record<string, { color: string; label: string }> = {
  SUBMITTED: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Submitted' },
  SHORTLISTED: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Shortlisted' },
  AWARDED: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Awarded' },
  REJECTED: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Rejected' },
};

export default function TenderDetailPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = use(params);
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [responses, setResponses] = useState<TenderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [awardTarget, setAwardTarget] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`/api/corporate/tenders/${tenderId}`)
      .then((r) => r.json())
      .then((d) => {
        setTender(d.tender ?? null);
        setResponses(d.responses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tenderId]);

  async function changeStatus(newStatus: string) {
    setStatusError('');
    setStatusBusy(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'AWARDED') {
        if (!awardTarget) { setStatusError('Select a recycler to award.'); setStatusBusy(false); return; }
        body.awardedTo = awardTarget;
      }
      const res = await fetch(`/api/corporate/tenders/${tenderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setStatusError(data.error ?? 'Failed');
      else { trackEvent('Client Tender Status Changed', { status: newStatus }); load(); }
    } catch {
      setStatusError('Network error');
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading) return <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />;
  if (!tender) return <p className="text-slate-500">Tender not found.</p>;

  const nextStatuses = STATUS_TRANSITIONS[tender.status] ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-400 font-mono">{tender.tender_number}</p>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{tender.title}</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {tender.epr_type} · {tender.quantity_required} {tender.unit} · {tender.tender_type}
            </p>
            {tender.description && <p className="text-sm text-slate-500 mt-2">{tender.description}</p>}
          </div>
          <div className="text-right">
            <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-300">
              {tender.status.replace('_', ' ')}
            </span>
            {tender.submission_deadline && (
              <p className="text-xs text-slate-400 mt-1">
                Deadline: {new Date(tender.submission_deadline).toLocaleDateString('en-IN')}
              </p>
            )}
            {tender.price_indication && (
              <p className="text-xs text-slate-500 mt-0.5">
                {tender.currency} {tender.price_indication.toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status transitions */}
      {nextStatuses.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Actions</h2>
          {tender.status === 'UNDER_REVIEW' && (
            <div>
              <label className="text-xs text-slate-500">Award to recycler</label>
              <select
                value={awardTarget}
                onChange={(e) => setAwardTarget(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select recycler…</option>
                {responses.map((r) => (
                  <option key={r.recycler_id} value={r.recycler_id}>
                    {r.recycler_name} ({r.recycler_code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={statusBusy}
                className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 transition ${
                  s === 'CANCELLED'
                    ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                    : s === 'AWARDED'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {statusBusy ? '…' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          {statusError && (
            <p role="alert" className="text-sm text-red-700">{statusError}</p>
          )}
        </div>
      )}

      {/* Responses */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Responses ({responses.length})
        </h2>
        {responses.length === 0 ? (
          <p className="text-sm text-slate-400">No responses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="pb-2 pr-4 font-semibold">Recycler</th>
                  <th className="pb-2 pr-4 font-semibold">Rate</th>
                  <th className="pb-2 pr-4 font-semibold">Qty</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((r) => {
                  const s = RESPONSE_STATUS_LABELS[r.status] ?? RESPONSE_STATUS_LABELS.SUBMITTED;
                  return (
                    <tr key={r.id} className="text-slate-700">
                      <td className="py-2 pr-4">
                        <p className="font-medium">{r.recycler_name}</p>
                        <p className="text-slate-400 font-mono">{r.recycler_code}</p>
                      </td>
                      <td className="py-2 pr-4">{tender.currency} {r.offered_rate?.toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-4">{r.offered_qty} {tender.unit}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="py-2 text-slate-400">
                        {new Date(r.submitted_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
