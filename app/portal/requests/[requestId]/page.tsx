'use client';

import { use, useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface RequestDetail {
  id: string;
  request_number: string;
  epr_type: string;
  required_qty: number;
  unit: string;
  urgency: string;
  status: string;
  expires_at: string;
  max_rounds: number;
  message: string;
  budget_indication: number | null;
  currency: string;
  states_covered: string[];
  preferred_delivery_date: string | null;
  created_at: string;
}

interface NegotiationMessage {
  id: string;
  sender_type: 'CORPORATE' | 'RECYCLER';
  message: string;
  round_number: number;
  created_at: string;
}

interface RecyclerResponse {
  id: string;
  recycler_id: string;
  recycler_name: string;
  recycler_code: string;
  round_number: number;
  offered_rate: number;
  offered_qty: number;
  can_fulfill: boolean;
  counter_offer: boolean;
  status: string;
  submitted_at: string;
}

export default function CorporateRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [responses, setResponses] = useState<RecyclerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch(`/api/corporate/requests/${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        setRequest(d.request ?? null);
        setMessages(d.messages ?? []);
        setResponses(d.responses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [requestId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage() {
    if (!msgText.trim()) return;
    setMsgError('');
    setSending(true);
    try {
      const res = await fetch(`/api/corporate/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText }),
      });
      const data = await res.json();
      if (!res.ok) setMsgError(data.error ?? 'Failed to send');
      else {
        trackEvent('Client Request Message Sent', {});
        setMsgText('');
        load();
      }
    } catch {
      setMsgError('Network error');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />;
  if (!request) return <p className="text-slate-500">Request not found.</p>;

  const isTerminal = ['ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN', 'CANCELLED'].includes(request.status);
  const daysLeft = Math.ceil((new Date(request.expires_at).getTime() - Date.now()) / 86_400_000);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-400 font-mono">{request.request_number}</p>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{request.epr_type}</h1>
            <p className="text-sm text-slate-600">
              {request.required_qty} {request.unit} · {request.urgency} urgency
            </p>
            {request.budget_indication && (
              <p className="text-sm text-slate-500">
                Budget: {request.currency} {request.budget_indication.toLocaleString('en-IN')}
              </p>
            )}
            {request.message && <p className="text-sm text-slate-500 mt-1 italic">&ldquo;{request.message}&rdquo;</p>}
          </div>
          <div className="text-right">
            <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-300">
              {request.status}
            </span>
            {!isTerminal && (
              <p className={`text-xs mt-1 ${daysLeft <= 1 ? 'text-red-600' : 'text-slate-400'}`}>
                {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">Round limit: {request.max_rounds}</p>
          </div>
        </div>
      </div>

      {/* Recycler responses */}
      {responses.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Responses ({responses.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="pb-2 pr-4 font-semibold">Recycler</th>
                  <th className="pb-2 pr-4 font-semibold">Rate</th>
                  <th className="pb-2 pr-4 font-semibold">Qty</th>
                  <th className="pb-2 pr-4 font-semibold">Round</th>
                  <th className="pb-2 font-semibold">Can Fulfill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((r) => (
                  <tr key={r.id} className="text-slate-700">
                    <td className="py-2 pr-4">
                      <p className="font-medium">{r.recycler_name}</p>
                      <p className="text-slate-400 font-mono">{r.recycler_code}</p>
                    </td>
                    <td className="py-2 pr-4">{request.currency} {r.offered_rate?.toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-4">{r.offered_qty} {request.unit}</td>
                    <td className="py-2 pr-4">{r.round_number}</td>
                    <td className="py-2">
                      <span className={r.can_fulfill ? 'text-green-600' : 'text-red-500'}>
                        {r.can_fulfill ? '✓' : '✗'}
                      </span>
                      {r.counter_offer && <span className="ml-1 text-purple-600">(counter)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Negotiation thread */}
      <div
        ref={threadRef}
        className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 max-h-72 overflow-y-auto"
        aria-label="Negotiation thread"
      >
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide sticky top-0 bg-white pb-1">
          Negotiation Thread
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_type === 'CORPORATE' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.sender_type === 'CORPORATE'
                    ? 'bg-purple-100 text-purple-900'
                    : 'bg-slate-100 text-slate-800'
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

      {/* Send message */}
      {!isTerminal && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Send a Message</h2>
          <div className="flex gap-2">
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgText.trim()}
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          {msgError && <p role="alert" className="text-xs text-red-700">{msgError}</p>}
        </div>
      )}
    </div>
  );
}
