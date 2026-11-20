'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  filed:       'bg-indigo-100 text-indigo-700 border-indigo-200',
  rejected:    'bg-red-100 text-red-700 border-red-200',
  won:         'bg-green-100 text-green-700 border-green-200',
  lost:        'bg-gray-100 text-gray-600 border-gray-200',
  cancelled:   'bg-gray-100 text-gray-500 border-gray-200',
};

export default function RecyclerFilingRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ tender_title: '', tender_ref: '', recycler_notes: '' });
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/recycler-portal/filing-requests');
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setRequests(d.requests ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const r = await fetch('/api/recycler-portal/filing-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setSaveMsg(d.error || 'Failed'); return; }
      trackEvent('Recycler Filing Request Created', {});
      setSaveMsg(d.message || 'Request submitted!');
      setShowForm(false);
      setForm({ tender_title: '', tender_ref: '', recycler_notes: '' });
      load();
    } catch (e: any) {
      setSaveMsg(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    await fetch(`/api/recycler-portal/filing-requests/${id}`, { method: 'DELETE' });
    trackEvent('Recycler Filing Request Cancelled', {});
    setCancelling(null);
    load();
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center"><svg className="h-7 w-7 animate-spin text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Filing Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track tenders our team is filing on your behalf.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Request
        </button>
      </div>

      {saveMsg && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${saveMsg.includes('Failed') || saveMsg.includes('error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {saveMsg}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={load} className="text-red-600 underline text-xs">Retry</button>
        </div>
      )}

      {requests.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <p className="text-gray-600 text-sm font-medium">No filing requests yet</p>
          <p className="text-gray-400 text-xs max-w-xs">Browse government tenders and request our team to file on your behalf.</p>
          <Link href="/recycler-portal/govt-tenders" className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors">
            Browse Tenders
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const deadline = req.tender_deadline ? new Date(req.tender_deadline) : null;
            const days = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400_000) : null;

            return (
              <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {req.tender_no && <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{req.tender_no}</span>}
                      {req.tender_portal && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{req.tender_portal}</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{req.tender_title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Requested {new Date(req.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {days !== null && (
                        <span className={`ml-2 font-medium ${days < 0 ? 'text-gray-400' : days <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                          {days < 0 ? '(deadline passed)' : `· ${days}d to deadline`}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[req.status] ?? ''}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                {req.recycler_notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-600">Your note: </span>{req.recycler_notes}
                  </p>
                )}

                {req.manager_notes && (
                  <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    <p className="text-xs text-blue-700"><span className="font-medium">Team note: </span>{req.manager_notes}</p>
                  </div>
                )}

                {req.status === 'pending' && (
                  <button onClick={() => handleCancel(req.id)} disabled={cancelling === req.id}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
                    {cancelling === req.id ? 'Cancelling…' : 'Cancel request'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Request Tender Filing</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 -mt-2">Can't find the tender in our list? Submit a custom request here.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Tender Title <span className="text-red-500">*</span></label>
                <input required value={form.tender_title} onChange={e => setForm(v => ({ ...v, tender_title: e.target.value }))}
                  placeholder="e.g. Supply of E-Waste collection bins – CPCB"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Tender Reference / Portal Link</label>
                <input value={form.tender_ref} onChange={e => setForm(v => ({ ...v, tender_ref: e.target.value }))}
                  placeholder="e.g. GT-2025-0042 or GeM URL"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Notes for filing team</label>
                <textarea rows={3} value={form.recycler_notes} onChange={e => setForm(v => ({ ...v, recycler_notes: e.target.value }))}
                  placeholder="Any specific requirements or instructions…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
