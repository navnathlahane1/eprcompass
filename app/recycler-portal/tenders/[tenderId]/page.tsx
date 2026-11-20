'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

interface TenderDetailData {
  tender: {
    id: string;
    tender_number: string;
    title: string;
    description: string;
    epr_type: string;
    required_qty: number;
    unit: string;
    states_covered: string[];
    submission_deadline: string | null;
    eligibility_criteria: Record<string, unknown>;
    attachments: string[];
    status: string;
  };
  myResponse: {
    id: string;
    status: string;
    submitted_at: string;
    offered_qty: number;
    rate_per_unit: number;
    recycler_feedback: string | null;
  } | null;
}

export default function TenderDetailPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<TenderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    offeredQty: '',
    ratePerUnit: '',
    technicalProposal: '',
  });

  useEffect(() => {
    fetch(`/api/recycler-portal/tenders/${tenderId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenderId]);

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/recycler-portal/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId,
          offeredQty: Number(form.offeredQty),
          ratePerUnit: Number(form.ratePerUnit),
          technicalProposal: form.technicalProposal,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Submission failed');
      } else {
        trackEvent('Recycler Tender Bid Submitted', { tender_id: tenderId, offered_qty: Number(form.offeredQty) });
        router.refresh();
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />;
  }

  if (!data?.tender) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Tender not found.</p>
      </div>
    );
  }

  const { tender, myResponse } = data;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-gray-400 font-mono">{tender.tender_number}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">{tender.title}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="rounded-full bg-blue-50 text-blue-700 text-xs px-2 py-0.5 border border-blue-200">
            {tender.epr_type}
          </span>
          <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
            {tender.required_qty} {tender.unit}
          </span>
          <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
            {tender.states_covered.join(', ') || 'All India'}
          </span>
        </div>
      </div>

      {tender.description && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{tender.description}</p>
        </div>
      )}

      {/* Eligibility */}
      {Object.keys(tender.eligibility_criteria).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Eligibility Requirements</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            {Boolean(tender.eligibility_criteria.mustBeVerified) && <li>✓ Verification required</li>}
            {Boolean(tender.eligibility_criteria.minRating) && (
              <li>✓ Minimum rating: {String(tender.eligibility_criteria.minRating)}</li>
            )}
            {(tender.eligibility_criteria.requiredCertifications as string[] | undefined)?.map((c) => (
              <li key={c}>✓ Certification: {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* My submitted response */}
      {myResponse && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h2 className="text-sm font-semibold text-green-800 mb-1">Your Submission</h2>
          <p className="text-xs text-green-700">
            Status: <strong>{myResponse.status}</strong> · Submitted:{' '}
            {new Date(myResponse.submitted_at).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-green-700 mt-0.5">
            Offered: {myResponse.offered_qty} {tender.unit} @ ₹{myResponse.rate_per_unit}/unit
          </p>
          {myResponse.recycler_feedback && (
            <p className="text-xs text-green-700 mt-1">
              Feedback: {myResponse.recycler_feedback}
            </p>
          )}
        </div>
      )}

      {/* Bid form */}
      {!myResponse && tender.status === 'PUBLISHED' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Submit Your Response</h2>
          <form onSubmit={submitBid} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Offered Quantity ({tender.unit})
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={form.offeredQty}
                  onChange={(e) => setForm((p) => ({ ...p, offeredQty: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Offered quantity in ${tender.unit}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rate per {tender.unit} (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={form.ratePerUnit}
                  onChange={(e) => setForm((p) => ({ ...p, ratePerUnit: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Rate per unit in INR"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Technical Proposal (optional)
              </label>
              <textarea
                rows={3}
                value={form.technicalProposal}
                onChange={(e) => setForm((p) => ({ ...p, technicalProposal: e.target.value }))}
                placeholder="Describe your approach, capacity, logistics…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Response'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
