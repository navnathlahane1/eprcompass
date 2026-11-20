'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceRequest {
  id: string;
  request_number: string;
  service_type: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'AWAITING_INFO' | 'COMPLETED' | 'CLOSED';
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  remarks: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { value: 'EPR_CREDIT_ADVISORY', label: 'EPR Credit Advisory', desc: 'Guidance on credit valuation, trading, and transfer mechanisms.' },
  { value: 'COMPLIANCE_AUDIT', label: 'Compliance Audit', desc: 'Request a formal compliance audit of your recycling operations.' },
  { value: 'REGULATORY_FILING', label: 'Regulatory Filing Help', desc: 'Assistance with CPCB, SPCB, or state-level EPR filings.' },
  { value: 'TRAINING_SESSION', label: 'Training Session', desc: 'Schedule a training session for your team on EPR processes.' },
  { value: 'CERT_RENEWAL', label: 'Certificate Renewal Support', desc: 'Get help with CPCB or recycler certification renewal.' },
  { value: 'TONNAGE_QUERY', label: 'Tonnage Reporting Query', desc: 'Clarify tonnage calculation, reporting periods, or data issues.' },
  { value: 'PAYMENT_QUERY', label: 'Invoice / Payment Query', desc: 'Questions about invoices, payments, or credit settlements.' },
  { value: 'TECHNICAL_SUPPORT', label: 'Technical Support', desc: 'Portal access issues, document uploads, or account problems.' },
  { value: 'OTHER', label: 'Other / General Query', desc: 'Any other support or advisory request.' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-300',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 border-purple-300',
  IN_PROGRESS: 'bg-teal-100 text-teal-800 border-teal-300',
  AWAITING_INFO: 'bg-amber-100 text-amber-800 border-amber-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_FILTERS = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'AWAITING_INFO', 'COMPLETED'];

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  service_type: '',
  subject: '',
  description: '',
  priority: 'MEDIUM',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New request form
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Detail view
  const [selected, setSelected] = useState<ServiceRequest | null>(null);

  async function load() {
    setLoading(true);
    try {
      const q = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const r = await fetch(`/api/recycler-portal/service-requests${q}`);
      const d = await r.json();
      setRequests(d.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleSubmit() {
    if (!form.service_type) { setFormError('Select a service type'); return; }
    if (!form.subject.trim()) { setFormError('Enter a subject'); return; }
    if (!form.description.trim()) { setFormError('Describe your request in detail'); return; }

    setSubmitting(true); setFormError('');
    try {
      const r = await fetch('/api/recycler-portal/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setFormError(d.error || 'Failed to submit'); return; }
      trackEvent('Recycler Service Request Submitted', { service_type: form.service_type });
      setSubmitSuccess(`Request submitted! Reference: ${d.request?.request_number ?? d.request?.id?.slice(0, 8)}`);
      setForm(EMPTY_FORM);
      setNewOpen(false);
      load();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = SERVICE_TYPES.find(s => s.value === form.service_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Request advisory, compliance support, training, or any other assistance from the EPR Compass team.
          </p>
        </div>
        <button
          onClick={() => { setNewOpen(true); setFormError(''); setSubmitSuccess(''); }}
          className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          + New Request
        </button>
      </div>

      {/* Success banner */}
      {submitSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          {submitSuccess}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? 'All Requests' : statusLabel(s)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">No service requests yet</p>
          <p className="text-xs text-gray-400 mt-1">Submit a request whenever you need support, advisory, or assistance.</p>
          <button
            onClick={() => setNewOpen(true)}
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Submit First Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <button
              key={req.id}
              onClick={() => setSelected(req)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-400">{req.request_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[req.status] ?? ''}`}>
                      {statusLabel(req.status)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[req.priority]}`}>
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{req.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {SERVICE_TYPES.find(s => s.value === req.service_type)?.label ?? req.service_type}
                    {req.assigned_to_name && ` · Assigned to ${req.assigned_to_name}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">{fmt(req.created_at)}</p>
                  {req.resolved_at && (
                    <p className="text-xs text-green-600 mt-0.5">Resolved {fmt(req.resolved_at)}</p>
                  )}
                </div>
              </div>
              {req.status === 'AWAITING_INFO' && req.remarks && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
                  ⚠ Action needed: {req.remarks}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">New Service Request</h2>
              <button onClick={() => setNewOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Service Type *</label>
                <div className="grid grid-cols-1 gap-2">
                  {SERVICE_TYPES.map(st => (
                    <label
                      key={st.value}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        form.service_type === st.value
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="service_type"
                        value={st.value}
                        checked={form.service_type === st.value}
                        onChange={() => setForm(f => ({ ...f, service_type: st.value }))}
                        className="mt-0.5 shrink-0 accent-teal-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{st.label}</p>
                        <p className="text-xs text-gray-500">{st.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Need help with Q4 EPR filing for battery waste"
                  maxLength={120}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe your request in detail. Include relevant dates, quantities, reference numbers, or any specific requirements."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.priority === p.value ? p.color + ' ring-2 ring-teal-400 ring-offset-1' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setNewOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-gray-400">{selected.request_number}</p>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[selected.status] ?? ''}`}>
                {statusLabel(selected.status)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[selected.priority]}`}>
                {selected.priority}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {SERVICE_TYPES.find(s => s.value === selected.service_type)?.label ?? selected.service_type}
              </span>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
            </div>

            {selected.assigned_to_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Assigned to <strong>{selected.assigned_to_name}</strong>
              </div>
            )}

            {selected.remarks && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                selected.status === 'AWAITING_INFO'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-gray-50 border border-gray-200 text-gray-700'
              }`}>
                <p className="font-semibold text-xs uppercase tracking-wide mb-1">
                  {selected.status === 'AWAITING_INFO' ? 'Action Required' : 'Remarks'}
                </p>
                {selected.remarks}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <p className="font-semibold text-gray-600">Submitted</p>
                <p>{fmt(selected.created_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Last Updated</p>
                <p>{fmt(selected.updated_at)}</p>
              </div>
              {selected.resolved_at && (
                <div>
                  <p className="font-semibold text-gray-600">Resolved</p>
                  <p className="text-green-600">{fmt(selected.resolved_at)}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

