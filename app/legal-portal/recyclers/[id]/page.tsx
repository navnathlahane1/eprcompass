'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Document {
  id: string;
  doc_type: string;
  file_path: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  expiry_date: string | null;
  uploaded_at: string;
  legal_verified_by: string | null;
  legal_verified_at: string | null;
  legal_notes: string | null;
  verifier_name?: string | null;
}

interface RecyclerDetail {
  id: string;
  name: string;
  company_name: string;
  recycler_code: string;
  verification_status: string;
  state: string;
  contact_email: string;
  epr_categories: string[];
  documents: Document[];
}

const STATUS_BADGE: Record<string, string> = {
  Verified: 'bg-emerald-900/40 text-emerald-400 border-emerald-700',
  Pending: 'bg-amber-900/40 text-amber-400 border-amber-700',
  Rejected: 'bg-red-900/40 text-red-400 border-red-700',
};

const VS_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-900/40 text-emerald-400 border-emerald-700',
  PENDING: 'bg-amber-900/40 text-amber-400 border-amber-700',
  SUSPENDED: 'bg-red-900/40 text-red-400 border-red-700',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecyclerReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [recycler, setRecycler] = useState<RecyclerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<Record<string, { busy: boolean; showNotes: boolean; notes: string }>>({});

  function getDocState(docId: string) {
    return actionState[docId] ?? { busy: false, showNotes: false, notes: '' };
  }

  function setDocState(docId: string, patch: Partial<{ busy: boolean; showNotes: boolean; notes: string }>) {
    setActionState((prev) => ({ ...prev, [docId]: { ...getDocState(docId), ...patch } }));
  }

  function load() {
    fetch(`/api/legal-portal/recyclers/${id}`)
      .then((r) => r.json())
      .then((d) => setRecycler(d.recycler ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function updateDoc(docId: string, status: 'Verified' | 'Rejected' | 'Pending', notes?: string) {
    setDocState(docId, { busy: true });
    await fetch(`/api/legal-portal/recyclers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_doc', docId, status, notes }),
    });
    setDocState(docId, { busy: false, showNotes: false, notes: '' });
    load();
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-900 p-6 text-slate-500 text-sm">Loading…</div>;
  }

  if (!recycler) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <p className="text-slate-500">Recycler not found.</p>
        <Link href="/legal-portal/recyclers" className="text-violet-400 hover:underline text-sm mt-2 inline-block">
          ← Back to recyclers
        </Link>
      </div>
    );
  }

  const docs = recycler.documents ?? [];
  const verifiedCount = docs.filter((d) => d.status === 'Verified').length;
  const progressPct = docs.length > 0 ? Math.round((verifiedCount / docs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/legal-portal/recyclers" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          ← Recyclers
        </Link>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">{recycler.company_name || recycler.name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{recycler.recycler_code} · {recycler.state}</p>
            {recycler.contact_email && (
              <p className="text-slate-500 text-xs mt-1">{recycler.contact_email}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              VS_BADGE[recycler.verification_status] ?? 'bg-slate-700 text-slate-400 border-slate-600'
            }`}
          >
            {recycler.verification_status}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Verification Progress</span>
            <span>{verifiedCount} of {docs.length} verified</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-slate-200">Documents</h2>

        {docs.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-slate-500 text-sm">
            No documents uploaded yet.
          </div>
        ) : (
          docs.map((doc) => {
            const ds = getDocState(doc.id);
            return (
              <div key={doc.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100 font-medium">{doc.doc_type}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          STATUS_BADGE[doc.status] ?? 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Uploaded: {fmt(doc.uploaded_at)}</span>
                      {doc.expiry_date && <span>Expires: {fmt(doc.expiry_date)}</span>}
                    </div>
                    {doc.file_path && (
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 text-xs underline underline-offset-2"
                      >
                        View document ↗
                      </a>
                    )}
                  </div>
                </div>

                {doc.legal_verified_by && (
                  <div className="bg-slate-700/50 rounded-lg px-4 py-3 text-xs space-y-1">
                    <p className="text-slate-400">
                      {doc.status === 'Verified' ? 'Verified' : 'Reviewed'} by{' '}
                      <span className="text-slate-200">{doc.verifier_name ?? doc.legal_verified_by}</span>
                      {doc.legal_verified_at && <> on {fmt(doc.legal_verified_at)}</>}
                    </p>
                    {doc.legal_notes && (
                      <p className="text-slate-400">Notes: <span className="text-slate-200">{doc.legal_notes}</span></p>
                    )}
                  </div>
                )}

                {ds.showNotes && (
                  <textarea
                    value={ds.notes}
                    onChange={(e) => setDocState(doc.id, { notes: e.target.value })}
                    placeholder="Rejection notes (optional)…"
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={ds.busy || doc.status === 'Verified'}
                    onClick={() => updateDoc(doc.id, 'Verified')}
                    className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                  >
                    Verify
                  </button>
                  {!ds.showNotes ? (
                    <button
                      disabled={ds.busy || doc.status === 'Rejected'}
                      onClick={() => setDocState(doc.id, { showNotes: true })}
                      className="px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                    >
                      Reject
                    </button>
                  ) : (
                    <>
                      <button
                        disabled={ds.busy}
                        onClick={() => updateDoc(doc.id, 'Rejected', ds.notes)}
                        className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => setDocState(doc.id, { showNotes: false, notes: '' })}
                        className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    disabled={ds.busy || doc.status === 'Pending'}
                    onClick={() => updateDoc(doc.id, 'Pending')}
                    className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Reset to Pending
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
