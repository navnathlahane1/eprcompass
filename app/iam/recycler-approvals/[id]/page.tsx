'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Document {
  id: string;
  doc_type: string;
  file_name: string | null;
  file_path: string;
  status: string;
  expiry_date: string | null;
  uploaded_at: string;
}

interface Recycler {
  id: string;
  name: string;
  recycler_code: string;
  verification_status: string;
  verified_at: string | null;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  state: string;
  epr_categories: string[];
  authorized_states: string[];
  capacity: any;
  onboarded_at: string | null;
  assigned_compliance_officer: string | null;
  assigned_trainer: string | null;
  assigned_compliance_manager: string | null;
  intel_company_id: string | null;
  intel_company: { id: string; canonical_name: string; gstin: string | null } | null;
}

interface IntelCompanyOption {
  id: string;
  name: string;
  gstin: string | null;
  state: string | null;
  city: string | null;
}

interface DocSummaryStats {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
}

interface IAMProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

function ShareWelcome({ recycler }: { recycler: Recycler }) {
  const [copied, setCopied] = useState(false);

  const loginUrl = 'http://localhost:3000/recycler-portal/login';
  const waMessage = [
    `Hello ${recycler.name}!`,
    `Your EPR Recycler Portal account is ready.`,
    ``,
    `Login URL: ${loginUrl}`,
    recycler.contact_email ? `Email: ${recycler.contact_email}` : '',
    `Recycler Code: ${recycler.recycler_code}`,
    ``,
    `Use the email and password set by your EPR manager to log in.`,
    `Contact us if you need a password reset.`,
  ].filter(Boolean).join('\n');

  function copyCode() {
    navigator.clipboard.writeText(recycler.recycler_code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const phone = recycler.contact_phone?.replace(/\D/g, '');
  const waUrl = phone
    ? `https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(waMessage)}`
    : null;
  const mailUrl = recycler.contact_email
    ? `mailto:${recycler.contact_email}?subject=${encodeURIComponent('Your EPR Recycler Portal Access')}&body=${encodeURIComponent(waMessage)}`
    : null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">Share Welcome Message</h2>
      <p className="text-xs text-slate-400">
        Send the recycler their login credentials. Their account is ready — no onboarding code entry required.
      </p>

      {/* Recycler Code display */}
      <div className="flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-3">
        <div className="flex-1">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Recycler Code</p>
          <p className="text-lg font-mono font-bold text-teal-400">{recycler.recycler_code ?? '—'}</p>
        </div>
        <button
          onClick={copyCode}
          className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
        >
          {copied ? '✓ Copied' : 'Copy Code'}
        </button>
      </div>

      {/* Message preview */}
      <pre className="rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-sans">
        {waMessage}
      </pre>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-2">
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.844L.057 23.885l6.195-1.624A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.95 0-3.765-.528-5.32-1.446l-.381-.226-3.948 1.035 1.053-3.844-.248-.394A9.817 9.817 0 012.182 12C2.182 6.566 6.566 2.182 12 2.182c5.434 0 9.818 4.384 9.818 9.818 0 5.434-4.384 9.818-9.818 9.818z"/>
            </svg>
            Send via WhatsApp
          </a>
        ) : (
          <span className="text-xs text-slate-500 italic">No phone number — add contact_phone to enable WhatsApp</span>
        )}
        {mailUrl && (
          <a
            href={mailUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            Send via Email
          </a>
        )}
      </div>
    </div>
  );
}

const DOC_STATUS_COLORS: Record<string, string> = {
  Pending:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  Verified: 'bg-green-100 text-green-800 border-green-300',
  Rejected: 'bg-red-100 text-red-800 border-red-300',
  Expired:  'bg-orange-100 text-orange-800 border-orange-300',
};

const VS_COLORS: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-800 border-amber-300',
  VERIFIED:    'bg-green-100 text-green-800 border-green-300',
  SUSPENDED:   'bg-red-100 text-red-800 border-red-300',
  BLACKLISTED: 'bg-gray-200 text-gray-700 border-gray-400',
};

export default function RecyclerApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [recycler,          setRecycler]          = useState<Recycler | null>(null);
  const [documents,         setDocuments]         = useState<Document[]>([]);
  const [iamProfiles,       setIamProfiles]       = useState<IAMProfile[]>([]);
  const [trainerProfiles,   setTrainerProfiles]   = useState<IAMProfile[]>([]);
  const [cmProfiles,        setCmProfiles]        = useState<IAMProfile[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [acting,            setActing]            = useState(false);
  const [docActing,         setDocActing]         = useState<string | null>(null);
  const [coAssigning,       setCoAssigning]       = useState(false);
  const [trainerAssigning,  setTrainerAssigning]  = useState(false);
  const [cmAssigning,       setCmAssigning]       = useState(false);
  const [selectedCO,        setSelectedCO]        = useState('');
  const [selectedTrainer,   setSelectedTrainer]   = useState('');
  const [selectedCM,        setSelectedCM]        = useState('');
  const [docStats,          setDocStats]          = useState<DocSummaryStats>({ total: 0, verified: 0, pending: 0, rejected: 0 });
  const [message,           setMessage]           = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Intel company link
  const [intelQuery,     setIntelQuery]     = useState('');
  const [intelResults,   setIntelResults]   = useState<IntelCompanyOption[]>([]);
  const [intelSearching, setIntelSearching] = useState(false);
  const [intelLinking,   setIntelLinking]   = useState(false);
  const intelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/iam/recycler-approvals/${id}`).then((r) => r.json()),
      fetch('/api/iam/users?role=compliance_officer').then((r) => r.json()).catch(() => ({ users: [] })),
      fetch('/api/iam/users?role=trainer').then((r) => r.json()).catch(() => ({ users: [] })),
      fetch('/api/iam/users?role=compliance_manager').then((r) => r.json()).catch(() => ({ users: [] })),
    ])
      .then(([d, usersData, trainerData, cmData]) => {
        setRecycler(d.recycler ?? null);
        const docs: Document[] = d.documents ?? [];
        setDocuments(docs);
        setDocStats({
          total:    docs.length,
          verified: docs.filter((doc) => doc.status === 'Verified').length,
          pending:  docs.filter((doc) => doc.status === 'Pending').length,
          rejected: docs.filter((doc) => doc.status === 'Rejected').length,
        });
        setSelectedCO(d.recycler?.assigned_compliance_officer ?? '');
        setSelectedTrainer(d.recycler?.assigned_trainer ?? '');
        setSelectedCM(d.recycler?.assigned_compliance_manager ?? '');
        setIamProfiles(usersData.users ?? []);
        setTrainerProfiles(trainerData.users ?? []);
        setCmProfiles(cmData.users ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Debounced Intel company search
  useEffect(() => {
    if (intelQuery.length < 2) { setIntelResults([]); setIntelSearching(false); return; }
    setIntelSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/iam/intel-companies?q=${encodeURIComponent(intelQuery)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => { if (!ctrl.signal.aborted) setIntelResults(d.companies ?? []); })
        .catch((e) => { if (e.name !== 'AbortError') setIntelResults([]); })
        .finally(() => { if (!ctrl.signal.aborted) setIntelSearching(false); });
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [intelQuery]);

  // Close the Intel results dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (intelRef.current && !intelRef.current.contains(e.target as Node)) setIntelResults([]);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function linkIntelCompany(company: IntelCompanyOption | null) {
    setIntelLinking(true); setMessage(null);
    try {
      const r = await fetch(`/api/iam/recycler-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link_intel_company', intelCompanyId: company?.id ?? null }),
      });
      const d = await r.json();
      if (!r.ok) { setMessage({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setMessage({ type: 'success', text: company ? 'Intel company linked.' : 'Intel company unlinked.' });
      setRecycler((prev) => prev ? {
        ...prev,
        intel_company_id: company?.id ?? null,
        intel_company: company ? { id: company.id, canonical_name: company.name, gstin: company.gstin } : null,
      } : prev);
      setIntelQuery('');
      setIntelResults([]);
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIntelLinking(false);
    }
  }

  async function profileAction(action: 'approve' | 'suspend' | 'reject') {
    setActing(true); setMessage(null);
    try {
      const r = await fetch(`/api/iam/recycler-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok) { setMessage({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setMessage({ type: 'success', text: action === 'approve' ? 'Recycler approved — features unlocked.' : action === 'suspend' ? 'Account suspended.' : 'Sent back to pending.' });
      load();
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActing(false);
    }
  }

  async function assignComplianceOfficer() {
    setCoAssigning(true); setMessage(null);
    try {
      const r = await fetch(`/api/iam/recycler-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_compliance_officer', profileId: selectedCO || null }),
      });
      const d = await r.json();
      if (!r.ok) { setMessage({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setMessage({ type: 'success', text: selectedCO ? 'Compliance officer assigned.' : 'Compliance officer removed.' });
      setRecycler((prev) => prev ? { ...prev, assigned_compliance_officer: selectedCO || null } : prev);
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setCoAssigning(false);
    }
  }

  async function assignTrainer() {
    setTrainerAssigning(true); setMessage(null);
    try {
      const r = await fetch(`/api/iam/recycler-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_trainer', profileId: selectedTrainer || null }),
      });
      const d = await r.json();
      if (!r.ok) { setMessage({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setMessage({ type: 'success', text: selectedTrainer ? 'Trainer assigned.' : 'Trainer removed.' });
      setRecycler((prev) => prev ? { ...prev, assigned_trainer: selectedTrainer || null } : prev);
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setTrainerAssigning(false);
    }
  }

  async function assignComplianceManager() {
    setCmAssigning(true); setMessage(null);
    try {
      const r = await fetch(`/api/iam/recycler-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_compliance_manager', profileId: selectedCM || null }),
      });
      const d = await r.json();
      if (!r.ok) { setMessage({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setMessage({ type: 'success', text: selectedCM ? 'Compliance Manager assigned.' : 'Compliance Manager removed.' });
      setRecycler((prev) => prev ? { ...prev, assigned_compliance_manager: selectedCM || null } : prev);
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setCmAssigning(false);
    }
  }

  async function updateDocStatus(docId: string, status: string) {
    setDocActing(docId); setMessage(null);
    try {
      const r = await fetch(`/api/iam/recycler-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_doc', docId, status }),
      });
      const d = await r.json();
      if (!r.ok) { setMessage({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setDocuments((prev) => prev.map((doc) => doc.id === docId ? { ...doc, status } : doc));
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setDocActing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800 animate-pulse" />)}
      </div>
    );
  }

  if (!recycler) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center">
        <p className="text-slate-400">Recycler not found.</p>
        <Link href="/iam/recycler-approvals" className="text-teal-400 text-sm underline mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  const isVerified = recycler.verification_status === 'VERIFIED';
  const isSuspended = recycler.verification_status === 'SUSPENDED';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/iam/recycler-approvals" className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        Back to Recycler Approvals
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white">{recycler.name}</h1>
              <span className="text-xs font-mono text-slate-400">{recycler.recycler_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${VS_COLORS[recycler.verification_status]}`}>
                {recycler.verification_status}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
              {recycler.contact_email && <span>✉ {recycler.contact_email}</span>}
              {recycler.contact_phone && <span>📞 {recycler.contact_phone}</span>}
              {recycler.state && <span>📍 {recycler.state}</span>}
              {(recycler.epr_categories ?? []).length > 0 && (
                <span>Categories: {recycler.epr_categories.join(', ')}</span>
              )}
              {recycler.onboarded_at && (
                <span>Onboarded: {new Date(recycler.onboarded_at).toLocaleDateString('en-IN')}</span>
              )}
              {recycler.verified_at && (
                <span>Approved: {new Date(recycler.verified_at).toLocaleDateString('en-IN')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Message feedback */}
        {message && (
          <div className={`rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Profile action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {!isVerified && (
            <button
              onClick={() => profileAction('approve')}
              disabled={acting}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
            >
              {acting ? 'Processing…' : '✓ Approve — Unlock Features'}
            </button>
          )}
          {!isSuspended && (
            <button
              onClick={() => profileAction('suspend')}
              disabled={acting}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition"
            >
              Suspend Account
            </button>
          )}
          {(isVerified || isSuspended) && (
            <button
              onClick={() => profileAction('reject')}
              disabled={acting}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-50 transition"
            >
              Reset to Pending
            </button>
          )}
        </div>
      </div>

      {/* Share Welcome Message */}
      <ShareWelcome recycler={recycler} />

      {/* Intel Company Link */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-amber-300">📋 Intel Company Link</h2>
        <p className="text-xs text-slate-400">
          Link this recycler to its company record in Intel. This is the same link normally set when
          the account is first created — use this if it was skipped, or the company has been added
          to Intel since.
        </p>

        <div className="relative" ref={intelRef}>
          <input
            type="text"
            value={intelQuery}
            onChange={(e) => setIntelQuery(e.target.value)}
            placeholder="Search by company name or GSTIN…"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {intelSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">Searching…</div>
          )}
          {intelResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-xl overflow-hidden">
              {intelResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={intelLinking}
                  onClick={() => linkIntelCompany(c)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs hover:bg-slate-700 transition border-b border-slate-700 last:border-0 disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{c.name}</p>
                    <p className="text-slate-400 mt-0.5">
                      {[c.gstin, c.state, c.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {recycler.intel_company ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
            <span className="text-amber-200">
              ✓ Linked to: <strong>{recycler.intel_company.canonical_name}</strong>
              {recycler.intel_company.gstin && <span className="text-slate-400"> ({recycler.intel_company.gstin})</span>}
            </span>
            <button
              type="button"
              onClick={() => linkIntelCompany(null)}
              disabled={intelLinking}
              className="shrink-0 rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
            >
              {intelLinking ? 'Removing…' : 'Unlink'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Not linked to an Intel company yet.</p>
        )}
      </div>

      {/* Legal Document Verification Status */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Legal Document Status</h2>
          {docStats.total > 0 && docStats.verified === docStats.total ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              All Documents Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
              Pending Legal Review
            </span>
          )}
        </div>
        {docStats.total === 0 ? (
          <p className="text-xs text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(docStats.verified / docStats.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">{docStats.verified}/{docStats.total} verified</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-green-400">{docStats.verified} Verified</span>
              <span className="text-amber-400">{docStats.pending} Pending</span>
              {docStats.rejected > 0 && <span className="text-rose-400">{docStats.rejected} Rejected</span>}
            </div>
          </div>
        )}
      </div>

      {/* Compliance Officer Assignment */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Compliance Officer Assignment</h2>
        <p className="text-xs text-slate-400">
          Assign an internal compliance officer to oversee this recycler's account, verify documents, and provide advisory support.
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Officer</label>
            <select
              value={selectedCO}
              onChange={(e) => setSelectedCO(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Unassigned —</option>
              {iamProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
              ))}
            </select>
          </div>
          <button
            onClick={assignComplianceOfficer}
            disabled={coAssigning}
            className="shrink-0 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {coAssigning ? 'Saving…' : 'Save'}
          </button>
        </div>
        {recycler.assigned_compliance_officer && (
          <p className="text-xs text-teal-400">
            Currently assigned: {iamProfiles.find(p => p.id === recycler.assigned_compliance_officer)?.full_name ?? recycler.assigned_compliance_officer}
          </p>
        )}
      </div>

      {/* Trainer Assignment */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Trainer Assignment</h2>
        <p className="text-xs text-slate-400">Assign a trainer to guide this recycler through onboarding and portal features.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Trainer</label>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Unassigned —</option>
              {trainerProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
              ))}
            </select>
          </div>
          <button
            onClick={assignTrainer}
            disabled={trainerAssigning}
            className="shrink-0 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {trainerAssigning ? 'Saving…' : 'Save'}
          </button>
        </div>
        {recycler.assigned_trainer && (
          <p className="text-xs text-teal-400">
            Currently assigned: {trainerProfiles.find(p => p.id === recycler.assigned_trainer)?.full_name ?? recycler.assigned_trainer}
          </p>
        )}
      </div>

      {/* Compliance Manager Assignment */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Compliance Manager Assignment</h2>
        <p className="text-xs text-slate-400">Assign a compliance manager to oversee this recycler's regulatory compliance and reporting.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Compliance Manager</label>
            <select
              value={selectedCM}
              onChange={(e) => setSelectedCM(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Unassigned —</option>
              {cmProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
              ))}
            </select>
          </div>
          <button
            onClick={assignComplianceManager}
            disabled={cmAssigning}
            className="shrink-0 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {cmAssigning ? 'Saving…' : 'Save'}
          </button>
        </div>
        {recycler.assigned_compliance_manager && (
          <p className="text-xs text-teal-400">
            Currently assigned: {cmProfiles.find(p => p.id === recycler.assigned_compliance_manager)?.full_name ?? recycler.assigned_compliance_manager}
          </p>
        )}
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Uploaded Documents</h2>
          <span className="text-xs text-slate-400">{documents.length} file{documents.length !== 1 ? 's' : ''}</span>
        </div>

        {documents.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-500 text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {documents.map((doc) => (
              <div key={doc.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{doc.doc_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${DOC_STATUS_COLORS[doc.status] ?? 'bg-slate-700 text-slate-300'}`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doc.file_name && <span className="font-mono">{doc.file_name} · </span>}
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                    {doc.expiry_date && ` · Expires: ${new Date(doc.expiry_date).toLocaleDateString('en-IN')}`}
                  </p>
                  {doc.file_path && (
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 underline hover:text-teal-300 mt-0.5 inline-block"
                    >
                      View file ↗
                    </a>
                  )}
                </div>
                {/* Quick status buttons */}
                <div className="flex gap-1.5 shrink-0">
                  {doc.status !== 'Verified' && (
                    <button
                      onClick={() => updateDocStatus(doc.id, 'Verified')}
                      disabled={docActing === doc.id}
                      className="rounded px-2 py-1 text-xs font-medium bg-green-700 text-white hover:bg-green-600 disabled:opacity-50 transition"
                    >
                      Verify
                    </button>
                  )}
                  {doc.status !== 'Rejected' && (
                    <button
                      onClick={() => updateDocStatus(doc.id, 'Rejected')}
                      disabled={docActing === doc.id}
                      className="rounded px-2 py-1 text-xs font-medium bg-red-800 text-white hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      Reject
                    </button>
                  )}
                  {doc.status !== 'Pending' && (
                    <button
                      onClick={() => updateDocStatus(doc.id, 'Pending')}
                      disabled={docActing === doc.id}
                      className="rounded px-2 py-1 text-xs font-medium bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-50 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
