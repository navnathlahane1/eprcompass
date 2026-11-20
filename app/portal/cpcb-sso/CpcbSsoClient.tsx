'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

// ─── Data Fields from EPR Registration Checklist ─────────────────────────────

type FieldType = 'required' | 'auto' | 'manual';

interface DataField {
  num: string;
  label: string;
  detail: string;
  type: FieldType;
}

const SLIDE1: DataField[] = [
  { num: '01', label: 'Company GST Number',     detail: 'Enter GSTIN and click Verify',                        type: 'required' },
  { num: '02', label: 'Company PAN Number',      detail: 'Auto-filled after GST verify',                       type: 'auto' },
  { num: '03', label: 'Date of Establishment',   detail: 'Auto-filled from GST registration date',             type: 'auto' },
  { num: '04', label: 'Company Name',            detail: 'Auto-filled from GST portal',                        type: 'auto' },
  { num: '05', label: 'Authorised Person PAN',   detail: 'Director / Owner personal PAN number',               type: 'required' },
  { num: '06', label: 'Authorised Person Name',  detail: 'Auto-filled after PAN verification',                 type: 'auto' },
  { num: '07', label: 'Date of Birth',           detail: 'As per PAN card / Aadhaar of authorised person',     type: 'required' },
  { num: '08', label: 'Email Address',           detail: 'Company or authorised person email',                 type: 'required' },
  { num: '09', label: 'Email OTP',               detail: 'One-time password sent to email — done during session', type: 'manual' },
  { num: '10', label: 'Mobile Number',           detail: 'Registered mobile of authorised person',             type: 'required' },
  { num: '11', label: 'Mobile OTP',              detail: 'One-time password sent to mobile — done during session', type: 'manual' },
];

const SLIDE2: DataField[] = [
  { num: '12', label: 'Company GST Number',   detail: 'Carried over from Slide 1',                          type: 'auto' },
  { num: '13', label: 'Trade Name',           detail: 'As per GST — auto-filled from GST portal',           type: 'auto' },
  { num: '14', label: 'Legal Name',           detail: 'As per GST — auto-filled from GST portal',           type: 'auto' },
  { num: '15', label: 'Type of Business',     detail: 'Regular / Composition / SEZ etc. — auto from GST',   type: 'auto' },
  { num: '16', label: 'Type of Company',      detail: 'Pvt Ltd / Proprietorship / LLP / Partnership — auto from PAN', type: 'auto' },
  { num: '17', label: 'Registered Address',   detail: 'Address Line 1 & 2 from GST records',                type: 'auto' },
  { num: '18', label: 'Company PAN Number',   detail: 'Extracted from GSTIN (characters 3–12)',             type: 'auto' },
  { num: '19', label: 'Company CIN Number',   detail: 'Auto-fetched from MCA using PAN',                    type: 'auto' },
  { num: '20', label: 'State / UT',           detail: 'From GST state code (first 2 digits)',               type: 'auto' },
  { num: '21', label: 'District',             detail: 'From GST registered address',                        type: 'auto' },
];

const SLIDE3: DataField[] = [
  { num: '22a', label: 'Authorised Person — Name',          detail: 'Full name of Director / MD / Owner',              type: 'required' },
  { num: '22b', label: 'Authorised Person — Designation',   detail: 'Director / MD / Proprietor / Partner',            type: 'required' },
  { num: '22c', label: 'Authorised Person — PAN',           detail: 'Carried from Slide 1',                            type: 'auto' },
  { num: '22d', label: 'Authorised Person — Email ID',      detail: 'Carried from Slide 1',                            type: 'auto' },
  { num: '22e', label: 'Authorised Person — Mobile Number', detail: 'Carried from Slide 1',                            type: 'auto' },
  { num: '23',  label: 'Set Password',                      detail: 'New login password for EPR portal',               type: 'required' },
  { num: '24',  label: 'CAPTCHA',                           detail: 'Manual entry required every time during session', type: 'manual' },
];

// ─── Required Documents ───────────────────────────────────────────────────────

interface RequiredDoc {
  id: string;
  icon: string;
  label: string;
  detail: string;
  required: boolean;
  section: 'epr-documents' | 'my-documents';
}

const REQUIRED_DOCS: RequiredDoc[] = [
  {
    id: 'pan_card',
    icon: '🪪',
    label: 'Company PAN Card',
    detail: 'PDF / JPG / PNG — Clear scan of PAN card',
    required: true,
    section: 'my-documents',
  },
  {
    id: 'gst_certificate',
    icon: '📜',
    label: 'GST Registration Certificate',
    detail: 'PDF / JPG / PNG — Download from GST portal',
    required: true,
    section: 'my-documents',
  },
  {
    id: 'coi',
    icon: '🏛️',
    label: 'Certificate of Incorporation (COI)',
    detail: 'PDF — For Pvt Ltd / LLP — download from MCA portal',
    required: true,
    section: 'my-documents',
  },
  {
    id: 'auth_pan',
    icon: '🪪',
    label: 'Authorised Person PAN Card',
    detail: 'PDF / JPG / PNG — Director / Owner personal PAN',
    required: true,
    section: 'my-documents',
  },
  {
    id: 'board_resolution',
    icon: '📋',
    label: 'Board Resolution / Authorization Letter',
    detail: 'PDF — Authorizing the person to register on EPR portal',
    required: true,
    section: 'epr-documents',
  },
  {
    id: 'iec',
    icon: '🌐',
    label: 'Import Export Code (IEC)',
    detail: 'PDF — Only for Importers / Exporters',
    required: false,
    section: 'my-documents',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<FieldType, { badge: string; label: string }> = {
  required: { badge: 'bg-blue-100 text-blue-700',   label: 'Required' },
  auto:     { badge: 'bg-emerald-100 text-emerald-700', label: 'Auto-filled' },
  manual:   { badge: 'bg-amber-100 text-amber-700',  label: 'During Session' },
};

const STORAGE_KEY = 'cpcb_sso_docs_checked';

function loadChecked(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveChecked(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...s])); } catch { /* noop */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CpcbSsoClient() {
  const [activeTab, setActiveTab] = useState<'fields' | 'documents'>('documents');
  const [openSlide, setOpenSlide] = useState<number | null>(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [ssoRequest, setSsoRequest] = useState<{ status: string; created_at: string } | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isImporter, setIsImporter] = useState(false);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // Load persisted checkboxes
  useEffect(() => { setChecked(loadChecked()); }, []);

  // Check if an SSO service request has already been submitted
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/portal/service-requests');
        if (res.ok) {
          const d = await res.json();
          const existing = (d.requests ?? []).find(
            (r: { category: string; status: string; created_at: string }) =>
              r.category === 'CPCB Documentation' &&
              r.status !== 'Closed'
          );
          if (existing) setSsoRequest(existing);
        }
      } catch { /* ignore */ }
      setLoadingRequest(false);
    })();
  }, []);

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveChecked(next);
      return next;
    });
  }

  const requiredDocs = REQUIRED_DOCS.filter(d => d.required || (d.id === 'iec' && isImporter));
  const allRequiredChecked = requiredDocs.every(d => checked.has(d.id));
  const checkedCount = requiredDocs.filter(d => checked.has(d.id)).length;
  const totalRequired = requiredDocs.length;

  const totalFields = SLIDE1.length + SLIDE2.length + SLIDE3.length;
  const requiredFields = [...SLIDE1, ...SLIDE2, ...SLIDE3].filter(f => f.type === 'required').length;

  async function handleRequestSSO() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'CPCB Documentation',
          subject: 'CPCB SSO Registration Request',
          description: `Client has uploaded all required documents and is requesting CPCB SSO registration on the EPR portal (https://epr.cpcb.gov.in/login).\n\nDocuments confirmed uploaded:\n${requiredDocs.filter(d => checked.has(d.id)).map(d => `• ${d.label}`).join('\n')}\n\nPlease proceed with SSO registration on behalf of the client.`,
          priority: 'High',
        }),
      });
      if (res.ok) {
        trackEvent('Client CPCB SSO Requested', {});
        const d = await res.json();
        setSsoRequest(d.request);
        setShowConfirm(false);
        showToast('success', 'SSO Registration request sent to your compliance consultant!');
      } else {
        const d = await res.json().catch(() => ({}));
        showToast('error', d.error || 'Failed to submit request. Please try again.');
      }
    } catch {
      showToast('error', 'Network error — please try again.');
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Urgency Banner ── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-sm text-amber-900">
          <span className="font-semibold">Action Required — SSO Migration is Mandatory.</span>{' '}
          CPCB SSO registration on <span className="font-mono font-medium">epr.cpcb.gov.in</span> is required for all PIBOs. Certificate exchange on the old portal is closed from <span className="font-semibold">01-04-2026</span>. Failing to migrate means loss of access to all EPR portals and blocked transactions.
        </div>
      </div>

      {/* ── Header ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">CPCB SSO Registration</h1>
            <p className="mt-1 text-sm text-slate-600">
              Complete the checklist below, upload all required documents, and click <strong>Request SSO Registration</strong> — your consultant will handle the rest.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Portal: <a href="https://epr.cpcb.gov.in/login" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">epr.cpcb.gov.in</a></span>
              <span>Covers: Plastic · E-Waste · Battery · Tyre · Used Oil · ELV</span>
            </div>
          </div>

          {/* Request SSO button / status */}
          <div className="flex flex-col items-end gap-2">
            {loadingRequest ? (
              <div className="h-10 w-48 rounded-lg bg-slate-100 animate-pulse" />
            ) : ssoRequest ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
                <p className="font-semibold text-emerald-800">Request Submitted</p>
                <p className="text-xs text-emerald-700 mt-0.5">Status: <span className="font-medium">{ssoRequest.status}</span></p>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!allRequiredChecked}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                  allRequiredChecked
                    ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Request SSO Registration
              </button>
            )}
            {!allRequiredChecked && !ssoRequest && !loadingRequest && (
              <p className="text-xs text-slate-500">{checkedCount} of {totalRequired} required docs confirmed</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600">Document Readiness</span>
            <span className="text-xs font-semibold text-slate-700">{checkedCount} / {totalRequired}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${allRequiredChecked ? 'bg-emerald-500' : 'bg-teal-500'}`}
              style={{ width: `${totalRequired > 0 ? Math.round((checkedCount / totalRequired) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(['documents', 'fields'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'documents' ? '📄 Required Documents' : '📋 Registration Data Fields'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DOCUMENTS                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Supporting Documents Checklist</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Upload all required documents to <Link href="/portal/my-documents" className="text-blue-600 hover:underline">My Documents</Link> or <Link href="/portal/epr-documents" className="text-blue-600 hover:underline">EPR Documents</Link>, then tick each box below to confirm. All files must be PDF, JPG, or PNG · Max 2 MB each.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isImporter}
                  onChange={e => setIsImporter(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                I am an Importer / Exporter
              </label>
            </div>

            <div className="space-y-2">
              {REQUIRED_DOCS.map((doc, i) => {
                const isApplicable = doc.required || (doc.id === 'iec' && isImporter);
                const isChecked = checked.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      !isApplicable
                        ? 'border-slate-100 bg-slate-50 opacity-50'
                        : isChecked
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Number */}
                    <span className="shrink-0 text-xs font-bold text-slate-400 w-4">{i + 1}</span>

                    {/* Checkbox */}
                    <button
                      disabled={!isApplicable}
                      onClick={() => isApplicable && toggle(doc.id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300 bg-white'
                      } disabled:cursor-not-allowed`}
                      aria-label={isChecked ? `Unmark ${doc.label}` : `Mark ${doc.label} as collected`}
                    >
                      {isChecked && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Doc info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base">{doc.icon}</span>
                        <span className={`text-sm font-medium ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {doc.label}
                        </span>
                        {!doc.required && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">If Applicable</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{doc.detail}</p>
                    </div>

                    {/* Status + Upload link */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isChecked ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Collected</span>
                      ) : (
                        <Link
                          href={`/portal/${doc.section}`}
                          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Upload →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500">
              <strong>Note:</strong> Fields marked <em>Auto</em> are populated automatically from GSTIN / PAN / MCA data during registration. OTPs and CAPTCHA are entered live during the portal session by your consultant.
            </div>
          </div>

          {/* CTA when all done */}
          {allRequiredChecked && !ssoRequest && (
            <div className="rounded-xl border-2 border-teal-500 bg-teal-50 p-5 text-center">
              <svg className="mx-auto h-8 w-8 text-teal-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-semibold text-teal-900">All Documents Ready!</h3>
              <p className="mt-1 text-sm text-teal-700">Click below to notify your compliance consultant to proceed with CPCB SSO registration.</p>
              <button
                onClick={() => setShowConfirm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Request SSO Registration
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DATA FIELDS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fields' && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide self-center">Legend:</span>
            {(Object.entries(TYPE_STYLE) as [FieldType, typeof TYPE_STYLE[FieldType]][]).map(([type, s]) => (
              <span key={type} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>{s.label}</span>
            ))}
            <span className="ml-auto text-xs text-slate-500 self-center">{totalFields} total fields · {requiredFields} you must prepare</span>
          </div>

          {/* Slide 1 */}
          <SlideAccordion
            number={1}
            title="User Verification"
            subtitle="Identity and contact details verified via GSTIN and PAN"
            fields={SLIDE1}
            open={openSlide === 1}
            onToggle={() => setOpenSlide(prev => prev === 1 ? null : 1)}
          />

          {/* Slide 2 */}
          <SlideAccordion
            number={2}
            title="General Information"
            subtitle="Company details auto-populated from GST / PAN / MCA records"
            fields={SLIDE2}
            open={openSlide === 2}
            onToggle={() => setOpenSlide(prev => prev === 2 ? null : 2)}
          />

          {/* Slide 3 */}
          <SlideAccordion
            number={3}
            title="Authorised Person, Password & Submit"
            subtitle="Final confirmation of authorised signatory and portal login setup"
            fields={SLIDE3}
            open={openSlide === 3}
            onToggle={() => setOpenSlide(prev => prev === 3 ? null : 3)}
          />

          {/* ETP Note */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <strong>After SSO Registration:</strong> Your EPR portal is linked to the <strong>Electronic Trading Platform (ETP)</strong> — the new unified hub for buying, selling, and transferring EPR certificates across all waste streams (Plastic, E-Waste, Battery, Tyre, Used Oil, ELV). Old certificate exchange is closed from 01-04-2026.
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 mb-4">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Confirm SSO Registration Request</h2>
              <p className="mt-2 text-sm text-slate-600">
                This will notify your compliance consultant to register your company on the CPCB SSO portal at <span className="font-mono text-xs bg-slate-100 px-1 rounded">epr.cpcb.gov.in</span> using the documents you have uploaded.
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Documents Confirmed</p>
                <ul className="space-y-1">
                  {requiredDocs.filter(d => checked.has(d.id)).map(d => (
                    <li key={d.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {d.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestSSO}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Confirm & Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Slide Accordion ──────────────────────────────────────────────────────────

function SlideAccordion({
  number, title, subtitle, fields, open, onToggle,
}: {
  number: number;
  title: string;
  subtitle: string;
  fields: DataField[];
  open: boolean;
  onToggle: () => void;
}) {
  const requiredCount = fields.filter(f => f.type === 'required').length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">{fields.length} fields · <span className="text-blue-700 font-medium">{requiredCount} required</span></span>
          <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          <div className="divide-y divide-slate-50">
            {fields.map((f) => {
              const s = TYPE_STYLE[f.type];
              return (
                <div key={f.num} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-8 shrink-0 text-xs font-mono font-bold text-slate-400">{f.num}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{f.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
