'use client';

/**
 * /admin/epr-documents — EPR Client Document Manager
 * Admin: review/approve/reject documents, view version history, download.
 */

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];
const DOC_STATUSES = ['Pending Review', 'Approved', 'Rejected', 'Superseded'];
const REVIEW_STATUSES = ['Pending Review', 'Approved', 'Rejected'];

interface Doc {
  id: string;
  client_id: string;
  category: string;
  doc_type: string;
  file_name: string;
  file_size: number | null;
  status: string;
  version: number;
  rejection_reason: string | null;
  created_at: string;
  profiles?: { full_name: string; company_name: string };
  epr_financial_years?: { label: string };
}

interface FY { id: string; label: string }

export default function EPRDocumentsAdminPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [fys, setFys] = useState<FY[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterFy, setFilterFy] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [reviewing, setReviewing] = useState<Doc | null>(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  const [versions, setVersions] = useState<any[]>([]);
  const [versionDoc, setVersionDoc] = useState<Doc | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/epr/financial-years').then(r => r.json()).then(d => setFys(d.financialYears ?? []));
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams();
    if (filterFy) p.set('fy_id', filterFy);
    if (filterCat) p.set('category', filterCat);
    if (filterStatus) p.set('status', filterStatus);
    if (search) p.set('search', search);
    const res = await fetch(`/api/epr/client-documents?${p}`);
    if (!res.ok) { setError('Failed to load documents'); setLoading(false); return; }
    const d = await res.json();
    setDocs(d.documents ?? []);
    setLoading(false);
  }, [filterFy, filterCat, filterStatus, search]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleReview = async () => {
    if (!reviewing) return;
    if (reviewStatus === 'Rejected' && !rejectionReason.trim()) {
      showToast('error', 'Rejection reason is required');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/epr/client-documents/${reviewing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: reviewStatus, rejection_reason: rejectionReason }),
    });
    setSaving(false);
    if (res.ok) {
      showToast('success', `Document marked as ${reviewStatus}`);
      setReviewing(null);
      setRejectionReason('');
      loadDocs();
    } else {
      const d = await res.json();
      showToast('error', d.error || 'Review failed');
    }
  };

  const handleDownload = async (doc: Doc) => {
    const res = await fetch(`/api/epr/client-documents/${doc.id}/download`);
    if (!res.ok) { showToast('error', 'Could not generate download link'); return; }
    const { url } = await res.json();
    window.open(url, '_blank');
  };

  const loadVersions = async (doc: Doc) => {
    setVersionDoc(doc);
    setVersionLoading(true);
    const res = await fetch(`/api/epr/client-documents/${doc.id}/versions`);
    const d = res.ok ? await res.json() : { versions: [] };
    setVersions(d.versions ?? []);
    setVersionLoading(false);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      'Pending Review': 'bg-amber-900/30 text-amber-300',
      'Approved': 'bg-emerald-900/30 text-emerald-300',
      'Rejected': 'bg-rose-900/30 text-rose-300',
      'Superseded': 'bg-slate-900 text-slate-500',
    };
    return map[s] || 'bg-slate-900 text-slate-400';
  };

  const fmtBytes = (b: number | null) => {
    if (!b) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-100">EPR Client Documents</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search doc type / file name…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-56"
        />
        <select value={filterFy} onChange={e => setFilterFy(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All FYs</option>
          {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {DOC_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={loadDocs} className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-slate-900 rounded animate-pulse" />)}</div>
      ) : error ? (
        <div className="bg-rose-950/30 text-rose-300 p-4 rounded">{error}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium">No documents found</p>
          <p className="text-sm mt-1">Try adjusting the filters above</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Doc Type</th>
                <th className="px-4 py-3 text-left">Cat / FY</th>
                <th className="px-4 py-3 text-left">File</th>
                <th className="px-4 py-3 text-left">Ver</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-slate-950">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{d.profiles?.company_name || '—'}</p>
                    <p className="text-xs text-slate-500">{d.profiles?.full_name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{d.doc_type}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{d.category}<br />{d.epr_financial_years?.label}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200 truncate max-w-[160px]">{d.file_name}</p>
                    <p className="text-xs text-slate-500">{fmtBytes(d.file_size)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">v{d.version}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button onClick={() => handleDownload(d)} className="text-blue-400 hover:underline text-xs">Download</button>
                    <button onClick={() => { setReviewing(d); setReviewStatus('Approved'); setRejectionReason(''); }} className="text-emerald-300 hover:underline text-xs">Review</button>
                    <button onClick={() => loadVersions(d)} className="text-slate-500 hover:underline text-xs">Versions</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Review Document</h2>
            <p className="text-sm text-slate-400">{reviewing.doc_type} · {reviewing.file_name}</p>
            <div>
              <label className="text-xs font-medium text-slate-400">Decision</label>
              <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                {REVIEW_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {reviewStatus === 'Rejected' && (
              <div>
                <label className="text-xs font-medium text-slate-400">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none"
                  placeholder="Specify the reason for rejection…"
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setReviewing(null)} className="px-4 py-2 text-sm border rounded hover:bg-slate-950">Cancel</button>
              <button onClick={handleReview} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {versionDoc && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Document Versions</h2>
              <button onClick={() => setVersionDoc(null)} className="text-slate-500 hover:text-slate-400">✕</button>
            </div>
            <p className="text-sm text-slate-400">{versionDoc.doc_type} · {versionDoc.file_name}</p>
            {versionLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-900 rounded animate-pulse" />)}</div>
            ) : versions.length === 0 ? (
              <p className="text-slate-500 text-sm">No version history.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase border-b">
                  <tr>
                    <th className="py-2 text-left">Ver</th>
                    <th className="py-2 text-left">File</th>
                    <th className="py-2 text-left">Size</th>
                    <th className="py-2 text-left">Uploaded</th>
                    <th className="py-2 text-left">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {versions.map((v: any) => (
                    <tr key={v.id}>
                      <td className="py-2 font-medium">v{v.version}</td>
                      <td className="py-2 truncate max-w-[140px]">{v.file_name}</td>
                      <td className="py-2 text-slate-500">{fmtBytes(v.file_size)}</td>
                      <td className="py-2 text-slate-500">{new Date(v.uploaded_at).toLocaleDateString()}</td>
                      <td className="py-2 text-slate-500">{v.uploader?.full_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
