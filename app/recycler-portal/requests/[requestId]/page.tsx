'use client';

import { use, useEffect, useRef, useState } from 'react';
import { canStartNewRound, isRequestExpired, daysUntilRequestExpiry } from '@/lib/recyclerPortal/alertRequestService';
import { trackEvent } from '@/lib/analytics';

interface RequestDetail {
  id: string;
  request_number: string;
  epr_type: string;
  required_qty: number;
  unit: string;
  states_covered: string[];
  urgency: string;
  status: string;
  expires_at: string;
  max_rounds: number;
  specifications: Record<string, unknown>;
  budget_indication: number | null;
  currency: string;
  created_at: string;
}

interface NegotiationMessage {
  id: string;
  sender_type: 'CORPORATE' | 'RECYCLER';
  message: string;
  created_at: string;
  round_number: number;
}

interface MyResponse {
  id: string;
  round_number: number;
  offered_rate: number;
  offered_qty: number;
  can_fulfill: boolean;
  message: string;
  counter_offer: boolean;
  status: string;
}

export default function RequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [myResponses, setMyResponses] = useState<MyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  // Form state
  const [rate, setRate] = useState('');
  const [qty, setQty] = useState('');
  const [msg, setMsg] = useState('');
  const [canFulfill, setCanFulfill] = useState(true);
  const [counterOffer, setCounterOffer] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/recycler-portal/requests/${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        setRequest(d.request ?? null);
        setMessages(d.messages ?? []);
        setMyResponses(d.myResponses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [requestId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const currentRound = myResponses.length;
  const maxRounds = request?.max_rounds ?? 5;
  const roundCheck = canStartNewRound(currentRound, maxRounds, request?.status ?? '');
  const expired = request ? isRequestExpired(request.expires_at) : false;
  const terminalStatuses = ['ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN', 'CANCELLED'];
  const isTerminal = request ? terminalStatuses.includes(request.status) : false;
  const canSubmit = !isTerminal && !expired && roundCheck.allowed;

  async function submitResponse() {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recycler-portal/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offeredRate: Number(rate),
          offeredQty: Number(qty),
          canFulfill,
          message: msg,
          counterOffer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Submission failed');
      } else {
        trackEvent('Recycler Request Response Submitted', { request_id: requestId, counter_offer: counterOffer, can_fulfill: canFulfill });
        setSuccess('Response submitted!');
        setRate('');
        setQty('');
        setMsg('');
        load();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />;
  if (!request) return <p className="text-gray-500">Request not found.</p>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 font-mono">{request.request_number}</p>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5">{request.epr_type}</h1>
            <p className="text-sm text-gray-600">
              {request.required_qty} {request.unit} · {request.states_covered.join(', ') || 'All India'}
            </p>
            {request.budget_indication && (
              <p className="text-sm text-gray-600">
                Budget: {request.currency} {request.budget_indication.toLocaleString('en-IN')}
              </p>
            )}
          </div>
          <div className="text-right">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                isTerminal ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}
            >
              {request.status}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Round {currentRound}/{maxRounds}
            </p>
            {!expired && !isTerminal && (
              <p className="text-xs text-orange-600 mt-0.5">
                {daysUntilRequestExpiry(request.expires_at)}d left
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Negotiation thread */}
      <div
        ref={threadRef}
        className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 max-h-64 overflow-y-auto"
        aria-label="Negotiation messages"
      >
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0 bg-white pb-1">
          Negotiation Thread
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_type === 'RECYCLER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.sender_type === 'RECYCLER'
                    ? 'bg-green-100 text-green-900'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{m.message}</p>
                <p className="text-xs opacity-60 mt-0.5 text-right">
                  Round {m.round_number} · {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* My previous responses */}
      {myResponses.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">My Responses</h2>
          <div className="space-y-2">
            {myResponses.map((r) => (
              <div key={r.id} className="text-xs text-gray-700 flex gap-4 flex-wrap">
                <span>Round {r.round_number}</span>
                <span>Rate: {request.currency} {r.offered_rate}</span>
                <span>Qty: {r.offered_qty} {request.unit}</span>
                <span className={r.can_fulfill ? 'text-green-600' : 'text-red-500'}>
                  {r.can_fulfill ? 'Can fulfill' : 'Cannot fulfill'}
                </span>
                {r.counter_offer && <span className="text-purple-600">Counter offer</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response form */}
      {canSubmit ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Submit Response — Round {currentRound + 1} of {maxRounds}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Rate ({request.currency})</label>
              <input
                type="number" min={0.01} step={0.01} value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Quantity ({request.unit})</label>
              <input
                type="number" min={1} value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Message</label>
            <textarea
              value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={canFulfill} onChange={(e) => setCanFulfill(e.target.checked)} />
              I can fulfill this request
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={counterOffer} onChange={(e) => setCounterOffer(e.target.checked)} />
              This is a counter-offer
            </label>
          </div>
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">{success}</p>}
          <button
            onClick={submitResponse}
            disabled={submitting || !rate || !qty}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Response'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {isTerminal
            ? `Request is ${request.status.toLowerCase()}.`
            : expired
            ? 'This request has expired.'
            : roundCheck.reason}
        </div>
      )}
    </div>
  );
}
