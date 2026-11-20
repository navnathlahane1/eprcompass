'use client';

import { useState } from 'react';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/serviceRequests/constants';
import type { ServiceRequestStatus, ServiceRequestPriority } from '@/lib/serviceRequests/constants';
import { trackEvent } from '@/lib/analytics';

type Message = {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  profiles: { id: string; full_name: string; role: string };
};

type Quote = {
  id: string;
  service_fee: number;
  govt_fee: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  estimated_timeline?: string;
  quote_status: string;
  sent_at?: string;
};

type StatusLog = {
  id: string;
  from_status?: string;
  to_status: string;
  note?: string;
  created_at: string;
  profiles: { full_name: string };
};

type ServiceRequest = {
  id: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
  service_request_quotes?: Quote[];
  service_request_messages?: Message[];
  service_request_status_logs?: StatusLog[];
};

export default function ServiceRequestPortalDetail({
  request: initialRequest,
}: {
  request: ServiceRequest;
}) {
  const [request, setRequest] = useState(initialRequest);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const quote = request.service_request_quotes?.[0];
  const messages = request.service_request_messages || [];
  const logs = request.service_request_status_logs || [];

  async function handleAction(action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectReason.trim()) return;
    setError('');
    setLoading(action);
    try {
      const res = await fetch(`/api/portal/service-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      trackEvent('Client Service Request Quote Actioned', { action });
      setRequest(r => ({ ...r, status: data.status }));
      setFeedback(action === 'approve' ? 'Quote approved! Our team will start working on your request.' : 'Request rejected. Our team has been notified.');
      setShowRejectInput(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  const isQuotePending = request.status === 'Quote Sent' && !feedback;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{request.subject}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{request.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[request.priority as ServiceRequestPriority] || 'bg-slate-100 text-slate-600'}`}>
              {request.priority}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[request.status as ServiceRequestStatus] || 'bg-slate-100 text-slate-600'}`}>
              {request.status}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {request.description}
        </p>

        {request.rejection_reason && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <strong>Rejection reason:</strong> {request.rejection_reason}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Submitted on {new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          {request.profiles?.full_name ? ` · Assigned to ${request.profiles.full_name}` : ''}
        </p>
      </div>

      {/* Quote */}
      {quote && (
        <div className={`rounded-xl border bg-white overflow-hidden ${isQuotePending ? 'border-purple-300 ring-1 ring-purple-300' : 'border-slate-200'}`}>
          <div className={`px-5 py-3 border-b flex items-center justify-between ${isQuotePending ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100'}`}>
            <h3 className={`text-sm font-semibold ${isQuotePending ? 'text-purple-800' : 'text-slate-700'}`}>
              {isQuotePending ? '⚡ Action Required — Review Quotation' : 'Quotation'}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              quote.quote_status === 'Approved' ? 'bg-emerald-100 text-emerald-700'
                : quote.quote_status === 'Rejected' ? 'bg-red-100 text-red-700'
                : quote.quote_status === 'Sent' ? 'bg-purple-100 text-purple-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {quote.quote_status}
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Service Fee', value: quote.service_fee },
                { label: 'Govt. Charges', value: quote.govt_fee },
                { label: 'Tax (GST)', value: quote.tax_amount },
                { label: 'Total Amount', value: quote.total_amount, highlight: true },
              ].map(row => (
                <div key={row.label} className={`rounded-lg border p-3 ${row.highlight ? 'border-teal-200 bg-teal-50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className="text-xs text-slate-500">{row.label}</p>
                  <p className={`mt-1 text-base font-bold ${row.highlight ? 'text-teal-700' : 'text-slate-800'}`}>
                    ₹{Number(row.value).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {quote.notes && (
              <p className="text-sm text-slate-600 border-t border-slate-100 pt-3">{quote.notes}</p>
            )}
            {quote.estimated_timeline && (
              <p className="text-xs text-slate-500">
                <span className="font-medium">Estimated timeline:</span> {quote.estimated_timeline}
              </p>
            )}

            {/* Approve / Reject actions */}
            {isQuotePending && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                {showRejectInput && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason for rejection</label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Briefly explain why you are rejecting this quote…"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={loading !== null}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                  >
                    {loading === 'approve' ? 'Approving…' : 'Approve Quote'}
                  </button>
                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={loading !== null}
                      className="rounded-lg border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition"
                    >
                      Reject Quote
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAction('reject')}
                        disabled={loading !== null || !rejectReason.trim()}
                        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
                      >
                        {loading === 'reject' ? 'Rejecting…' : 'Confirm Rejection'}
                      </button>
                      <button
                        onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                        className="text-sm text-slate-500 hover:text-slate-700 px-3 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {feedback && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                {feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Messages</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {messages.map(msg => {
              const isSelf = msg.profiles?.role === 'client';
              return (
                <div key={msg.id} className={`px-5 py-4 ${isSelf ? 'bg-white' : 'bg-blue-50/40'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-semibold ${isSelf ? 'text-slate-700' : 'text-blue-700'}`}>
                      {isSelf ? 'You' : msg.profiles?.full_name || 'EPR Team'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Status Timeline</h3>
          </div>
          <div className="px-5 py-4">
            <ol className="relative border-l border-slate-200 space-y-4 ml-2">
              {logs.map(log => (
                <li key={log.id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-teal-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{log.to_status}</span>
                    {log.from_status && (
                      <span className="text-xs text-slate-400">from {log.from_status}</span>
                    )}
                  </div>
                  {log.note && <p className="text-xs text-slate-500 mt-0.5">{log.note}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
