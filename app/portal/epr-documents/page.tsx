'use client';

/**
 * /portal/epr-documents — Client EPR Document Library
 * Upload required documents, view review status, download.
 * Uses Supabase Storage via signed URL flow.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];
const ALLOWED_TYPES = 'application/pdf,image/jpeg,image/png';
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface Doc {
  id: string;
  category: string;
  doc_type: string;
  file_name: string;
  file_size: number | null;
  status: string;
  version: number;
  rejection_reason: string | null;
  created_at: string;
  epr_financial_years?: { label: string };
}

interface FY { id: string; label: string; is_active: boolean }

export default function EPRDocumentsPortalPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [fys, setFys] = useState<FY[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFy, setFilterFy] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // Upload form state
  const [showForm, setShowForm] = useState(false);
  const [uploadCat, setUploadCat] = useState(CATEGORIES[0]);
  const [uploadFy, setUploadFy] = useState('');
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/epr/financial-years').then(r => r.json()).then(d => {
      const list: FY[] = d.financialYears ?? [];
      setFys(list);
      const active = list.find(f => f.is_active);
      if (active) setUploadFy(active.id);
    });
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterFy) p.set('fy_id', filterFy);
    if (filterCat) p.set('category', filterCat);
    const res = await fetch(`/api/epr/client-documents?${p}`);
    const d = res.ok ? await res.json() : { documents: [] };
    setDocs(d.documents ?? []);
    setLoading(false);
  }, [filterFy, filterCat]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async () => {
    if (!file || !docType.trim() || !uploadFy) {
      showToast('error', 'Please fill all fields and select a file'); return;
    }
    if (file.size > MAX_SIZE) { showToast('error', 'File exceeds 10 MB limit'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { showToast('error', 'Only PDF, JPG, PNG allowed'); return; }

    setUploading(true);

    // 1. Get signed upload URL
    const urlRes = await fetch('/api/epr/client-documents/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: file.name, mime_type: file.type, category: uploadCat, fy_id: uploadFy }),
    });
    if (!urlRes.ok) { showToast('error', 'Could not get upload URL'); setUploading(false); return; }
    const { signedUrl, path } = await urlRes.json();

    // 2. PUT to storage
    const putRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type } });
    if (!putRes.ok) { showToast('error', 'File upload failed'); setUploading(false); return; }

    // 3. Save metadata
    const metaRes = await fetch('/api/epr/client-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: uploadCat, fy_id: uploadFy, doc_type: docType.trim(),
        file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type,
      }),
    });
    setUploading(false);
    if (metaRes.ok) {
      trackEvent('Document Uploaded', { category: uploadCat, doc_type: docType.trim(), portal: 'client' });
      showToast('success', 'Document uploaded successfully');
      setShowForm(false);
      setFile(null);
      setDocType('');
      if (fileRef.current) fileRef.current.value = '';
      loadDocs();
    } else {
      const d = await metaRes.json();
      showToast('error', d.error || 'Upload failed');
    }
  };

  const handleDownload = async (doc: Doc) => {
    const res = await fetch(`/api/epr/client-documents/${doc.id}/download`);
    if (!res.ok) { showToast('error', 'Could not generate download link'); return; }
    const { url } = await res.json();
    window.open(url, '_blank');
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      'Pending Review': 'bg-yellow-100 text-yellow-700',
      'Approved': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Superseded': 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const fmtBytes = (b: number | null) => {
    if (!b) return '—';
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">EPR Documents</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterFy} onChange={e => setFilterFy(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All FYs</option>
          {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed">
          <p className="text-slate-500 font-medium">No documents uploaded yet</p>
          <p className="text-sm text-slate-400 mt-1">Click &ldquo;+ Upload Document&rdquo; to submit your EPR compliance documents.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.id} className="border rounded-xl bg-white p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{d.doc_type}</p>
                <p className="text-xs text-slate-500">{d.file_name} · {fmtBytes(d.file_size)} · v{d.version} · {d.category} · {d.epr_financial_years?.label}</p>
                {d.rejection_reason && (
                  <p className="text-xs text-red-600 mt-1">Rejected: {d.rejection_reason}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(d.status)}`}>
                  {d.status}
                </span>
                <button onClick={() => handleDownload(d)} className="text-blue-600 hover:underline text-xs">Download</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Upload EPR Document</h2>
            <div>
              <label className="text-xs font-medium text-slate-600">Category</label>
              <select value={uploadCat} onChange={e => setUploadCat(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Financial Year</label>
              <select value={uploadFy} onChange={e => setUploadFy(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                <option value="">Select FY</option>
                {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}{fy.is_active ? ' (Active)' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Document Type <span className="text-red-500">*</span></label>
              <input
                value={docType}
                onChange={e => setDocType(e.target.value)}
                placeholder="e.g. EPR Registration Certificate"
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">File (PDF, JPG, PNG — max 10 MB) <span className="text-red-500">*</span></label>
              <input
                ref={fileRef}
                type="file"
                accept={ALLOWED_TYPES}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded hover:bg-slate-50">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
