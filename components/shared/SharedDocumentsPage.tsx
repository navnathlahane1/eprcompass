'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TourTarget from '@/components/portal/tour/TourTarget';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  'EPR Registration Certificate',
  'CPCB Filing Acknowledgment',
  'GSTIN Certificate',
  'PAN Card',
  'Company Incorporation Certificate',
  'Authorization Letter',
  'Board Resolution',
  'EPR Plan / Action Plan',
  'Annual Return Filing',
  'Environmental Compliance Report',
  'Audit Report',
  'Waste Generation Data',
  'Take-back Scheme Agreement',
  'Channel Partner Agreement',
  'Consent to Establish',
  'Consent to Operate',
  'MSME Certificate',
  'ISO Certificate',
  'Cancelled Cheque',
  'Partnership Deed',
  'Director ID Proof',
  'MOA / AOA',
  'Other',
];

const ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const ALLOWED_MIME = [
  'application/pdf', 'image/jpeg', 'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_BYTES = 20 * 1024 * 1024;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SharedDoc {
  id: string;
  owner_id: string;
  doc_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  note: string | null;
  created_at: string;
  is_owner: boolean;
  shared_with: string[];
  owner_name: string | null;
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTS.includes(ext)) return `Invalid file type. Allowed: ${ALLOWED_EXTS.join(', ')}`;
    if (!ALLOWED_MIME.includes(f.type)) return 'Unsupported MIME type.';
    if (f.size > MAX_BYTES) return 'File exceeds 20 MB limit.';
    return null;
  }

  function addEmail() {
    const em = emailInput.trim().toLowerCase();
    if (!em) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setEmailError('Invalid email address'); return; }
    if (emails.includes(em)) { setEmailError('Email already added'); return; }
    setEmails(prev => [...prev, em]);
    setEmailInput('');
    setEmailError('');
  }

  async function handleUpload() {
    if (!docType) { setError('Select a document type'); return; }
    if (!file) { setError('Select a file to upload'); return; }

    const fileErr = validateFile(file);
    if (fileErr) { setError(fileErr); return; }

    setUploading(true);
    setError('');
    try {
      // Step 1: Get signed upload URL
      const urlRes = await fetch('/api/shared-documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, mime_type: file.type }),
      });
      if (!urlRes.ok) { const j = await urlRes.json(); throw new Error(j.error || 'Upload URL failed'); }
      const { signedUrl, path } = await urlRes.json();

      // Step 2: PUT file directly to Supabase Storage
      const putRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('File upload failed. Try again.');

      // Step 3: Save metadata
      const metaRes = await fetch('/api/shared-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: docType,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
          note: note.trim() || undefined,
          share_emails: emails,
        }),
      });
      if (!metaRes.ok) { const j = await metaRes.json(); throw new Error(j.error || 'Metadata save failed'); }

      onUploaded();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Upload Document</h2>

        <div className="space-y-4">
          {/* Document type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select document type —</option>
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* File */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              File <span className="text-red-500">*</span>{' '}
              <span className="text-slate-400 font-normal">(PDF, JPG, PNG, Word — max 20 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => { setFile(e.target.files?.[0] || null); setError(''); }}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && <p className="text-xs text-slate-500 mt-1">{file.name} — {fmtSize(file.size)}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Brief description..."
              maxLength={300}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Share with */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Share with users (email)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                placeholder="user@example.com"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addEmail}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Add
              </button>
            </div>
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
            {emails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {emails.map(e => (
                  <span key={e} className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                    {e}
                    <button
                      onClick={() => setEmails(prev => prev.filter(x => x !== e))}
                      className="text-blue-400 hover:text-red-500 ml-0.5"
                      aria-label={`Remove ${e}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Access Manager ───────────────────────────────────────────────────────────

function AccessPanel({ doc, onClose, onUpdated }: { doc: SharedDoc; onClose: () => void; onUpdated: () => void }) {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>(doc.shared_with);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function addAccess() {
    const em = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError('Invalid email'); return; }
    if (emails.includes(em)) { setError('Already has access'); return; }
    setLoading(true); setError('');
    const res = await fetch(`/api/shared-documents/${doc.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em }),
    });
    setLoading(false);
    if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed'); return; }
    setEmails(prev => [...prev, em]);
    setEmailInput('');
    onUpdated();
  }

  async function removeAccess(email: string) {
    setLoading(true);
    await fetch(`/api/shared-documents/${doc.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setEmails(prev => prev.filter(e => e !== email));
    onUpdated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Manage Access</h2>
        <p className="text-xs text-slate-500 mb-4">{doc.doc_type} — {doc.file_name}</p>

        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={emailInput}
            onChange={e => { setEmailInput(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAccess(); } }}
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addAccess}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Grant
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        {emails.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No users have access yet</p>
        ) : (
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {emails.map(e => (
              <li key={e} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">{e}</span>
                <button
                  onClick={() => removeAccess(e)}
                  disabled={loading}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SharedDocumentsPageProps {
  /** Optional heading override (defaults to "My Documents") */
  heading?: string;
}

export default function SharedDocumentsPage({ heading = 'My Documents' }: SharedDocumentsPageProps) {
  const [docs, setDocs] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [accessDoc, setAccessDoc] = useState<SharedDoc | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterTab, setFilterTab] = useState<'mine' | 'shared'>('mine');
  const [downloading, setDownloading] = useState<string | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shared-documents');
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocs(data.documents || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  async function handleDelete(doc: SharedDoc) {
    if (!confirm(`Delete "${doc.doc_type}" (${doc.file_name})? This cannot be undone.`)) return;
    const res = await fetch('/api/shared-documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id }),
    });
    if (res.ok) { showToast('Document deleted'); loadDocs(); }
    else { const j = await res.json(); showToast(j.error || 'Delete failed', false); }
  }

  async function handleDownload(doc: SharedDoc) {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/shared-documents/${doc.id}`);
      if (!res.ok) throw new Error('Download failed');
      const { url } = await res.json();
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
    } catch (e: any) {
      showToast(e.message || 'Download failed', false);
    } finally {
      setDownloading(null);
    }
  }

  const mineDocs = docs.filter(d => d.is_owner);
  const sharedDocs = docs.filter(d => !d.is_owner);
  const currentDocs = filterTab === 'mine' ? mineDocs : sharedDocs;
  const filteredDocs = filterType
    ? currentDocs.filter(d => d.doc_type === filterType)
    : currentDocs;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h1 className="text-lg font-semibold text-slate-900">{heading}</h1>
        <TourTarget id="docs-upload-action">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            aria-label="Upload a new document"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z" />
            </svg>
            Upload Document
          </button>
        </TourTarget>
      </div>

      {/* Tabs */}
      <TourTarget id="docs-tabs" className="flex gap-2 mb-4 border-b border-slate-200">
        {(['mine', 'shared'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setFilterTab(tab); setFilterType(''); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filterTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'mine' ? `My Uploads (${mineDocs.length})` : `Shared with Me (${sharedDocs.length})`}
          </button>
        ))}
      </TourTarget>

      {/* Filter */}
      {currentDocs.length > 0 && (
        <div className="mb-4">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      {!loading && !error && filteredDocs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-3-3v6M5 7l1.5-1.5M19 7l-1.5-1.5M7 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m10 14h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6a2 2 0 0 1 2 2v0a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v0a2 2 0 0 1 2-2Z" />
          </svg>
          <p className="text-sm text-slate-500 mb-3">
            {filterTab === 'mine' ? 'No documents uploaded yet' : 'No documents shared with you yet'}
          </p>
          {filterTab === 'mine' && (
            <button
              onClick={() => setShowUpload(true)}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Upload your first document
            </button>
          )}
        </div>
      )}

      {/* Document list */}
      {!loading && !error && filteredDocs.length > 0 && (
        <div className="space-y-2">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              {/* Doc icon */}
              <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586A1 1 0 0 1 14 3.414L17.586 7A1 1 0 0 1 18 8v11a2 2 0 0 1-2 2Z" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.doc_type}</p>
                <p className="text-xs text-slate-500 truncate">
                  {doc.file_name}
                  {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ''}
                  {' · '}{fmtDate(doc.created_at)}
                  {!doc.is_owner && doc.owner_name ? ` · from ${doc.owner_name}` : ''}
                </p>
                {doc.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.note}</p>}
                {doc.is_owner && doc.shared_with.length > 0 && (
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Shared with {doc.shared_with.length} user{doc.shared_with.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                  aria-label={`Download ${doc.file_name}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {downloading === doc.id ? 'Loading…' : 'Download'}
                </button>
                {doc.is_owner && (
                  <>
                    <button
                      onClick={() => setAccessDoc(doc)}
                      aria-label="Manage access"
                      className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      aria-label={`Delete ${doc.file_name}`}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); loadDocs(); showToast('Document uploaded successfully'); }}
        />
      )}
      {accessDoc && (
        <AccessPanel
          doc={accessDoc}
          onClose={() => setAccessDoc(null)}
          onUpdated={loadDocs}
        />
      )}
    </div>
  );
}
