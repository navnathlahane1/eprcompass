'use client';

import { useState } from 'react';
import {
  STATUS_COLORS, PRIORITY_COLORS, ADMIN_NEXT_STATUSES,
} from '@/lib/serviceRequests/constants';
import type { ServiceRequestStatus, ServiceRequestPriority } from '@/lib/serviceRequests/constants';

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
  approved_at?: string;
  rejected_at?: string;
};

type Message = {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  profiles: { id: string; full_name: string; role: string };
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
  client_id: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    profiles?: { id: string; full_name: string; company_name?: string; phone?: string } | null;
  } | null;
  profiles?: { id: string; full_name: string } | null; // assigned_to
  service_request_quotes?: Quote[];
  service_request_messages?: Message[];
  service_request_status_logs?: StatusLog[];
};

type AdminProfile = { id: string; full_name: string };

export default function ServiceRequestAdminDetail({
  request: initialRequest,
  adminProfiles,
  actorId,
}: {
  request: ServiceRequest;
  adminProfiles: AdminProfile[];
  actorId: string;
}) {
  const [request, setRequest] = useState(initialRequest);
  const [messages, setMessages] = useState(request.service_request_messages || []);

  // Status controls
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [assignedTo, setAssignedTo] = useState(request.profiles?.id || '');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Quote editor
  const quote = request.service_request_quotes?.[0];
  const [qForm, setQForm] = useState({
    service_fee: String(quote?.service_fee ?? ''),
    govt_fee: String(quote?.govt_fee ?? ''),
    tax_amount: String(quote?.tax_amount ?? ''),
    notes: quote?.notes ?? '',
    estimated_timeline: quote?.estimated_timeline ?? '',
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [liveQuote, setLiveQuote] = useState<Quote | undefined>(quote);

  // Messaging
  const [msgContent, setMsgContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');

  const nextStatuses = ADMIN_NEXT_STATUSES[request.status as ServiceRequestStatus] ?? [];
  const sf = Number(qForm.service_fee) || 0;
  const gf = Number(qForm.govt_fee) || 0;
  const ta = Number(qForm.tax_amount) || 0;
  const totalCalc = sf + gf + ta;

  async function handleStatusUpdate() {
    if (!newStatus && !assignedTo) return;
    setStatusLoading(true);
    setStatusMsg(null);
    try {
      const body: Record<string, unknown> = {};
      if (newStatus) body.status = newStatus;
      if (assignedTo !== (request.profiles?.id ?? '')) body.assigned_to = assignedTo;
      if (statusNote) body.note = statusNote;

      const res = await fetch(`/api/admin/service-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setStatusMsg({ type: 'err', text: data.error || 'Failed' }); return; }
      if (newStatus) setRequest(r => ({ ...r, status: data.status }));
      setStatusMsg({ type: 'ok', text: 'Updated successfully' });
      setNewStatus('');
      setStatusNote('');
    } catch {
      setStatusMsg({ type: 'err', text: 'Network error' });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleQuoteSave(send: boolean) {
    setQuoteLoading(true);
    setQuoteMsg(null);
    try {
      const res = await fetch(`/api/admin/service-requests/${request.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...qForm, service_fee: sf, govt_fee: gf, tax_amount: ta, send }),
      });
      const data = await res.json();
      if (!res.ok) { setQuoteMsg({ type: 'err', text: data.error || 'Failed' }); return; }
      setLiveQuote(data.quote);
      if (send) {
        setRequest(r => ({ ...r, status: 'Quote Sent' }));
        setQuoteMsg({ type: 'ok', text: 'Quote sent to client!' });
      } else {
        setQuoteMsg({ type: 'ok', text: 'Draft saved' });
      }
    } catch {
      setQuoteMsg({ type: 'err', text: 'Network error' });
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!msgContent.trim()) return;
    setMsgLoading(true);
    setMsgError('');
    try {
      const res = await fetch(`/api/admin/service-requests/${request.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgContent, is_internal: isInternal }),
      });
      const data = await res.json();
      if (!res.ok) { setMsgError(data.error || 'Failed'); return; }
      setMessages(m => [...m, data.message]);
      setMsgContent('');
    } catch {
      setMsgError('Network error');
    } finally {
      setMsgLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      {/* Left column: info + quote + messages */}
      <div className="space-y-5">
        {/* Request Info */}
        <div className="admin-card">
          <div className="admin-card-header flex items-center justify-between">
            <span>Request Details</span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[request.priority as ServiceRequestPriority] || 'bg-slate-900 text-slate-400'}`}>
                {request.priority}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[request.status as ServiceRequestStatus] || 'bg-slate-900 text-slate-400'}`}>
                {request.status}
              </span>
            </div>
          </div>
          <div className="admin-card-body space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="admin-field-label">Category</p>
                <p className="admin-field-value">{request.category}</p>
              </div>
              <div>
                <p className="admin-field-label">Company</p>
                <p className="admin-field-value">{request.clients?.profiles?.company_name || '—'}</p>
              </div>
              <div>
                <p className="admin-field-label">Contact</p>
                <p className="admin-field-value">{request.clients?.profiles?.full_name || '—'}</p>
              </div>
              <div>
                <p className="admin-field-label">Phone</p>
                <p className="admin-field-value">{request.clients?.profiles?.phone || '—'}</p>
              </div>
            </div>
            <div className="border-t border-slate-800/60 pt-3">
              <p className="admin-field-label mb-1">Subject</p>
              <p className="text-sm font-semibold text-slate-100">{request.subject}</p>
            </div>
            <div>
              <p className="admin-field-label mb-1">Description</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{request.description}</p>
            </div>
            {request.rejection_reason && (
              <div className="rounded-lg bg-rose-950/30 border border-rose-800/40 px-3 py-2 text-sm text-rose-300">
                <strong>Rejection reason:</strong> {request.rejection_reason}
              </div>
            )}
          </div>
        </div>

        {/* Quote Editor */}
        <div className="admin-card">
          <div className="admin-card-header">
            {liveQuote ? `Quotation · ${liveQuote.quote_status}` : 'Create Quotation'}
          </div>
          <div className="admin-card-body space-y-4">
            {quoteMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm ${quoteMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-950/30 border border-rose-800/40 text-rose-300'}`}>
                {quoteMsg.text}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {([
                ['service_fee', 'Service Fee (₹)'],
                ['govt_fee', 'Govt. Charges (₹)'],
                ['tax_amount', 'Tax / GST (₹)'],
              ] as [keyof typeof qForm, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={qForm[key]}
                    onChange={e => setQForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-teal-800">Total Amount</span>
              <span className="text-lg font-bold text-teal-700">₹{totalCalc.toLocaleString('en-IN')}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes for Client</label>
              <textarea
                rows={3}
                value={qForm.notes}
                onChange={e => setQForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Scope of work, inclusions/exclusions…"
                className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Estimated Timeline</label>
              <input
                value={qForm.estimated_timeline}
                onChange={e => setQForm(f => ({ ...f, estimated_timeline: e.target.value }))}
                placeholder="e.g. 7–10 business days"
                className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleQuoteSave(false)}
                disabled={quoteLoading}
                className="btn-secondary text-sm px-4 py-2"
              >
                {quoteLoading ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleQuoteSave(true)}
                disabled={quoteLoading || totalCalc <= 0}
                className="btn-primary text-sm px-4 py-2"
              >
                {quoteLoading ? 'Sending…' : 'Send Quote to Client'}
              </button>
            </div>
          </div>
        </div>

        {/* Messages & Internal Notes */}
        <div className="admin-card">
          <div className="admin-card-header">Messages & Notes</div>
          <div className="admin-card-body">
            {/* Message list */}
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-xs text-slate-500">No messages yet.</p>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    msg.is_internal
                      ? 'bg-amber-50 border border-amber-200'
                      : msg.profiles?.role === 'client'
                      ? 'bg-slate-950 border border-slate-800'
                      : 'bg-blue-950/30 border border-blue-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs">
                      {msg.profiles?.full_name || 'Unknown'}
                    </span>
                    {msg.is_internal && (
                      <span className="rounded-full bg-amber-200 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                        Internal Note
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 ml-auto">
                      {new Date(msg.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>

            {/* Compose */}
            {msgError && (
              <div className="mb-2 rounded-lg bg-rose-950/30 border border-rose-800/40 px-3 py-2 text-sm text-rose-300">{msgError}</div>
            )}
            <textarea
              rows={3}
              value={msgContent}
              onChange={e => setMsgContent(e.target.value)}
              placeholder={isInternal ? 'Write an internal note (visible to admin only)…' : 'Write a message to client…'}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={e => setIsInternal(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                Internal note
              </label>
              <button
                onClick={handleSendMessage}
                disabled={msgLoading || !msgContent.trim()}
                className="ml-auto btn-primary text-sm px-4 py-2"
              >
                {msgLoading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: status + assign + timeline */}
      <div className="space-y-5">
        {/* Status & Assignment */}
        <div className="admin-card">
          <div className="admin-card-header">Manage Request</div>
          <div className="admin-card-body space-y-4">
            {statusMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm ${statusMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-950/30 border border-rose-800/40 text-rose-300'}`}>
                {statusMsg.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Change Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">— Select new status —</option>
                {nextStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Assign To</label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unassigned</option>
                {adminProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Note (optional)</label>
              <input
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="Reason for status change…"
                className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={statusLoading || (!newStatus && assignedTo === (request.profiles?.id ?? ''))}
              className="btn-primary w-full text-sm py-2"
            >
              {statusLoading ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="admin-card">
          <div className="admin-card-header">Activity Log</div>
          <div className="admin-card-body">
            {(!request.service_request_status_logs?.length) ? (
              <p className="text-xs text-slate-500">No activity yet.</p>
            ) : (
              <ol className="relative border-l border-slate-800 space-y-4 ml-2">
                {[...request.service_request_status_logs].reverse().map(log => (
                  <li key={log.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-100">{log.to_status}</span>
                      {log.from_status && (
                        <span className="text-xs text-slate-500">← {log.from_status}</span>
                      )}
                    </div>
                    {log.profiles?.full_name && (
                      <p className="text-xs text-slate-500">by {log.profiles.full_name}</p>
                    )}
                    {log.note && <p className="text-xs text-slate-500 italic mt-0.5">{log.note}</p>}
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
