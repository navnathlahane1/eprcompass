'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

function fmt(n: number | null) {
  if (n == null) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const FILING_STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  filed:       'bg-indigo-100 text-indigo-700 border-indigo-200',
  rejected:    'bg-red-100 text-red-700 border-red-200',
  won:         'bg-green-100 text-green-700 border-green-200',
  lost:        'bg-gray-100 text-gray-600 border-gray-200',
  cancelled:   'bg-gray-100 text-gray-500 border-gray-200',
};

export default function GovtTenderDetailPage() {
  const params     = useParams();
  const router     = useRouter();
  const tenderId   = params.tenderId as string;

  const [tender,      setTender]      = useState<any>(null);
  const [filingReq,   setFilingReq]   = useState<any>(null);
  const [canFiling,   setCanFiling]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [isSubError,  setIsSubError]  = useState(false);
  const [showFiling,  setShowFiling]  = useState(false);
  const [filingNote,  setFilingNote]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const r = await fetch(`/api/recycler-portal/govt-tenders/${tenderId}`);
        if (r.status === 402) { setIsSubError(true); return; }
        if (!r.ok) throw new Error(await r.text());
        const d = await r.json();
        setTender(d.tender);
        setFilingReq(d.filingRequest);
        setCanFiling(d.canRequestFiling);
      } catch (e: any) {
        setError(e.message || 'Failed to load tender');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenderId]);

  async function handleFilingRequest() {
    if (!tender) return;
    setSubmitting(true); setSubmitMsg('');
    try {
      const r = await fetch('/api/recycler-portal/filing-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          govt_tender_id: tenderId,
          tender_title:   tender.title,
          recycler_notes: filingNote || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setSubmitMsg(d.error || 'Failed'); return; }
      trackEvent('Recycler Govt Tender Filing Requested', { tender_id: tenderId });
      setSubmitMsg(d.message || 'Request submitted!');
      setShowFiling(false);
      setFilingReq({ status: 'pending', requested_at: new Date().toISOString() });
    } catch (e: any) {
      setSubmitMsg(e.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (isSubError) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <p className="text-gray-600 text-sm">You need a subscription to view this tender.</p>
      <Link href="/recycler-portal/tender-services" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">View Plans</Link>
    </div>
  );

  if (loading) return (
    <div className="flex h-64 items-center justify-center"><svg className="h-7 w-7 animate-spin text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={() => router.back()} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Go Back</button>
    </div>
  );

  if (!tender) return null;

  const days = tender.days_remaining;
  const dayLabel = days != null
    ? days < 0  ? { text: 'Deadline Passed', cls: 'text-gray-500' }
    : days === 0 ? { text: 'Deadline Today!', cls: 'text-red-600 font-bold animate-pulse' }
    : days <= 2  ? { text: `${days} days left`, cls: 'text-red-600 font-bold' }
    : days <= 7  ? { text: `${days} days left`, cls: 'text-amber-600 font-semibold' }
    : { text: `${days} days left`, cls: 'text-green-600 font-semibold' }
    : { text: '—', cls: 'text-gray-400' };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/recycler-portal/govt-tenders" className="hover:text-gray-600 transition-colors">Govt Tenders</Link>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span className="text-gray-600 truncate max-w-[200px]">{tender.title}</span>
      </div>

      {/* Header card */}
      <div className={`rounded-2xl border p-5 space-y-4 ${days != null && days <= 2 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tender.tender_no}</span>
              {tender.portal && <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{tender.portal}</span>}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">{tender.category}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{tender.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{tender.authority}</p>
          </div>
          <div className="shrink-0 text-right space-y-1">
            <p className={`text-sm ${dayLabel.cls}`}>{dayLabel.text}</p>
            <p className="text-xs text-gray-400">{tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'EMD Amount', value: fmt(tender.emd_amount_inr) },
            { label: 'Estimated Value', value: fmt(tender.estimated_value_inr) },
            { label: 'Opening Date', value: tender.opening_date ? new Date(tender.opening_date).toLocaleDateString('en-IN') : '—' },
            { label: 'Published', value: tender.published_at ? new Date(tender.published_at).toLocaleDateString('en-IN') : '—' },
          ].map(f => (
            <div key={f.label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{f.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      {tender.description && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{tender.description}</p>
        </div>
      )}

      {/* Eligibility */}
      {tender.eligibility_notes && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Eligibility Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{tender.eligibility_notes}</p>
        </div>
      )}

      {/* Tags */}
      {tender.tags?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tender.tags.map((tag: string) => (
            <span key={tag} className="rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-600">{tag}</span>
          ))}
        </div>
      )}

      {/* Source link */}
      {tender.source_url && (
        <a href={tender.source_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          View on {tender.portal || 'Portal'} →
        </a>
      )}

      {/* Filing service section */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Tender Filing Service</h3>
            <p className="text-xs text-amber-700">Let our team file this tender on your behalf</p>
          </div>
        </div>

        {submitMsg && (
          <div className={`rounded-lg px-3 py-2 text-sm ${submitMsg.includes('Failed') || submitMsg.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {submitMsg}
          </div>
        )}

        {filingReq ? (
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${FILING_STATUS_COLORS[filingReq.status] ?? ''}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Filing request: {filingReq.status.replace('_', ' ')}
          </div>
        ) : canFiling ? (
          !showFiling ? (
            <button onClick={() => setShowFiling(true)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
              Request Filing Service
            </button>
          ) : (
            <div className="space-y-3">
              <textarea rows={3} value={filingNote} onChange={e => setFilingNote(e.target.value)}
                placeholder="Any specific notes for the filing team (optional)…"
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowFiling(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleFilingRequest} disabled={submitting} className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="text-xs text-amber-700">
            Upgrade to <Link href="/recycler-portal/tender-services" className="font-semibold underline">Pro or Premium</Link> to use the filing service.
          </div>
        )}
      </div>

      <Link href="/recycler-portal/govt-tenders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back to Tenders
      </Link>
    </div>
  );
}
