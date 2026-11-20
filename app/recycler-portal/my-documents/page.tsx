'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_DOCS = ['CPCB Cert', 'GST', 'Bank Details'];

const ALL_DOC_TYPES = [
  // Required for IAM approval
  'CPCB Cert',
  'GST',
  'Bank Details',
  // Compliance
  'EPR Registration Certificate',
  'CPCB Filing Acknowledgment',
  'EPR Plan / Action Plan',
  'Annual Return Filing',
  'Environmental Compliance Report',
  'Waste Generation Data',
  'Audit Report',
  // Legal / Business
  'Company Incorporation Certificate',
  'PAN Card',
  'Authorization Letter',
  'Board Resolution',
  'MOA / AOA',
  'Director ID Proof',
  'Partnership Deed',
  // Operational
  'Cancelled Cheque',
  'Consent to Establish',
  'Consent to Operate',
  'MSME Certificate',
  'ISO Certificate',
  'Take-back Scheme Agreement',
  'Channel Partner Agreement',
  'Other',
];

const ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_BYTES = 20 * 1024 * 1024;

const STATUS_STYLES: Record<string, string> = {
  Pending:  'bg-amber-100 text-amber-800 border-amber-300',
  Verified: 'bg-green-100 text-green-800 border-green-300',
  Rejected: 'bg-red-100 text-red-800 border-red-300',
  Expired:  'bg-orange-100 text-orange-800 border-orange-300',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecyclerDoc {
  id: string;
  doc_type: string;
  file_path: string;
  file_name: string | null;
  status: string;
  expiry_date: string | null;
  uploaded_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTS.includes(ext)) return `Allowed types: ${ALLOWED_EXTS.join(', ')}`;
    if (!ALLOWED_MIME.includes(f.type)) return 'Unsupported file format.';
    if (f.size > MAX_BYTES) return 'File exceeds 20 MB limit.';
    return null;
  }

  async function handleUpload() {
    if (!docType) { setError('Select a document type.'); return; }
    if (!file) { setError('Select a file.'); return; }
    const fileErr = validateFile(file);
    if (fileErr) { setError(fileErr); return; }

    setUploading(true);
    setError('');
    try {
      // 1. Get signed upload URL
      const urlRes = await fetch('/api/recycler-portal/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, mime_type: file.type, doc_type: docType }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error ?? 'Failed to get upload URL');

      // 2. PUT file to Supabase Storage
      const putRes = await fetch(urlData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('File upload failed. Try again.');

      // 3. Save metadata to recycler_documents
      const metaRes = await fetch('/api/recycler-portal/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: docType,
          file_path: urlData.path,
          file_name: file.name,
          expiry_date: expiryDate || null,
        }),
      });
      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error ?? 'Failed to save document');

      trackEvent('Document Uploaded', { doc_type: docType, portal: 'recycler' });
      onUploaded();
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Upload Document</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">— Select document type —</option>
              <optgroup label="Required for Approval">
                {REQUIRED_DOCS.map(t => <option key={t} value={t}>{t} ✦ Required</option>)}
              </optgroup>
              <optgroup label="All Other Documents">
                {ALL_DOC_TYPES.filter(t => !REQUIRED_DOCS.includes(t)).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              File <span className="text-red-500">*</span>{' '}
              <span className="text-gray-400 font-normal">(PDF, JPG, PNG, Word — max 20 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Expiry Date <span className="text-gray-400 font-normal">(optional, for certificates)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Required Docs Checklist ──────────────────────────────────────────────────

function RequiredDocsChecklist({ docs }: { docs: RecyclerDoc[] }) {
  const byType: Record<string, RecyclerDoc> = {};
  for (const d of docs) {
    if (REQUIRED_DOCS.includes(d.doc_type) && !byType[d.doc_type]) {
      byType[d.doc_type] = d;
    }
  }
  const allVerified = REQUIRED_DOCS.every(t => byType[t]?.status === 'Verified');
  const allUploaded = REQUIRED_DOCS.every(t => byType[t]);

  return (
    <div className={`rounded-xl border p-5 space-y-3 ${allVerified ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${allVerified ? 'text-green-800' : 'text-amber-800'}`}>
          {allVerified ? '✓ All required documents verified' : 'Required Documents for IAM Approval'}
        </span>
      </div>
      {!allVerified && (
        <p className="text-xs text-amber-700">
          Upload all three documents below. Our team reviews and verifies them before approving your account.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {REQUIRED_DOCS.map(type => {
          const doc = byType[type];
          return (
            <div
              key={type}
              className={`rounded-lg border px-4 py-3 ${
                !doc ? 'border-dashed border-amber-300 bg-white'
                : doc.status === 'Verified' ? 'border-green-300 bg-white'
                : doc.status === 'Rejected' ? 'border-red-300 bg-white'
                : 'border-amber-300 bg-white'
              }`}
            >
              <p className="text-xs font-semibold text-gray-700">{type}</p>
              {doc ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {doc.status}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate">{doc.file_name ?? doc.file_path.split('/').pop()}</span>
                </div>
              ) : (
                <p className="text-[10px] text-amber-600 mt-1">Not uploaded yet</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecyclerMyDocumentsPage() {
  const [docs, setDocs] = useState<RecyclerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterType, setFilterType] = useState('');

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recycler-portal/documents');
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      showToast('Failed to load documents', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(doc: RecyclerDoc) {
    if (!confirm(`Delete "${doc.doc_type}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    try {
      const res = await fetch('/api/recycler-portal/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id }),
      });
      if (res.ok) { trackEvent('Document Deleted', { doc_type: doc.doc_type, portal: 'recycler' }); showToast('Document deleted'); load(); }
      else { const j = await res.json(); showToast(j.error ?? 'Delete failed', false); }
    } finally {
      setDeleting(null);
    }
  }

  const filtered = filterType ? docs.filter(d => d.doc_type === filterType) : docs;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">My Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload your compliance and business documents. These are reviewed by our team for account verification.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
          </svg>
          Upload Document
        </button>
      </div>

      {/* Required docs checklist */}
      {!loading && <RequiredDocsChecklist docs={docs} />}

      {/* Filter */}
      {docs.length > 0 && (
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All types ({docs.length})</option>
            {ALL_DOC_TYPES.map(t => {
              const count = docs.filter(d => d.doc_type === t).length;
              return count > 0 ? <option key={t} value={t}>{t} ({count})</option> : null;
            })}
          </select>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center">
          <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm text-gray-500 mb-3">
            {filterType ? `No "${filterType}" documents uploaded` : 'No documents uploaded yet'}
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="text-sm text-green-700 font-medium hover:underline"
          >
            Upload your first document →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition"
            >
              {/* Icon */}
              <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{doc.doc_type}</p>
                  {REQUIRED_DOCS.includes(doc.doc_type) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Required</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[doc.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {doc.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {doc.file_name ?? doc.file_path.split('/').pop()}
                  {' · '}Uploaded {fmtDate(doc.uploaded_at)}
                  {doc.expiry_date && ` · Expires ${fmtDate(doc.expiry_date)}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {doc.status !== 'Verified' && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    {deleting === doc.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); load(); showToast('Document uploaded successfully'); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? 'bg-green-700 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
