'use client';

/**
 * /admin/epr-audit — Audit Documents Manager
 * Admin: upload, manage visibility, edit metadata, delete.
 */

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];
const DOC_TYPES = ['EPR Authorization', 'Audit Report', 'PWM Certificate', 'Form 3', 'Form 4', 'Annual Return', 'Other'];
const MARK_AS_OPTIONS = ['Draft', 'Final', 'Certified Copy'];

interface AuditDoc {
  id: string;
  client_id: string;
  category: string;
  doc_type: string;
  title: string;
  file_name: string;
  file_size: number | null;
  mark_as: string;
  visible_to_client: boolean;
  internal_note: string | null;
  client_note: string | null;
  created_at: string;
  profiles?: { full_name: string; company_name: string };
  epr_financial_years?: { label: string };
}

interface FY { id: string; label: string }
interface ClientOption { id: string; name: string }

export default function EPRAuditAdminPage() {
  const [docs, setDocs] = useState<AuditDoc[]>([]);
  const [fys, setFys] = useState<FY[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterFy, setFilterFy] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterVisible, setFilterVisible] = useState('');

  // Upload flow state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMeta, setUploadMeta] = useState({
    client_id: '', category: '', fy_id: '', doc_type: DOC_TYPES[0],
    title: '', mark_as: 'Draft', visible_to_client: false,
    internal_note: '', client_note: '',
  });
  const [uploading, setUploading] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<AuditDoc | null>(null);
  const [editPatch, setEditPatch] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/epr/financial-years').then(r => r.json()).then(d => setFys(d.financialYears ?? []));
    // Fetch client list for dropdown
    fetch('/api/admin/epr-credentials?list_clients=true')
      .then(r => r.json())
      .then(d => setClients((d.clients ?? []).map((c: any) => ({ id: c.id, name: c.company_name || c.full_name || c.id }))));
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true); setError(null);
    const p = new URLSearchParams();
    if (filterFy) p.set('fy_id', filterFy);
    if (filterCat) p.set('category', filterCat);
    if (filterVisible !== '') p.set('visible', filterVisible);
    const res = await fetch(`/api/epr/audit-documents?${p}`);
    if (!res.ok) { setError('Failed to load'); setLoading(false); return; }
    const d = await res.json();
    setDocs(d.documents ?? []);
    setLoading(false);
  }, [filterFy, filterCat, filterVisible]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleToggleVisible = async (doc: AuditDoc) => {
    await fetch(`/api/epr/audit-documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible_to_client: !doc.visible_to_client }),
    });
    showToast('success', `Visibility ${!doc.visible_to_client ? 'enabled' : 'disabled'}`);
    loadDocs();
  };

  const handleDelete = async (doc: AuditDoc) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/epr/audit-documents/${doc.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Deleted'); loadDocs(); }
    else { const d = await res.json(); showToast('error', d.error || 'Delete failed'); }
  };

  const handleEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    const res = await fetch(`/api/epr/audit-documents/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPatch),
    });
    setEditSaving(false);
    if (res.ok) { showToast('success', 'Updated'); setEditing(null); loadDocs(); }
    else { const d = await res.json(); showToast('error', d.error || 'Update failed'); }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadMeta.client_id || !uploadMeta.fy_id || !uploadMeta.title.trim()) {
      showToast('error', 'Please fill all required fields and select a file'); return;
    }
    setUploading(true);

    // Step 1: get signed upload URL
    const urlRes = await fetch('/api/epr/client-documents/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: uploadFile.name, mime_type: uploadFile.type,
        category: uploadMeta.category, fy_id: uploadMeta.fy_id,
      }),
    });
    if (!urlRes.ok) { showToast('error', 'Failed to get upload URL'); setUploading(false); return; }
    const { signedUrl, path } = await urlRes.json();

    // Step 2: PUT file to storage
    const putRes = await fetch(signedUrl, { method: 'PUT', body: uploadFile, headers: { 'content-type': uploadFile.type } });
    if (!putRes.ok) { showToast('error', 'File upload failed'); setUploading(false); return; }

    // Step 3: save metadata
    const metaRes = await fetch('/api/epr/audit-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...uploadMeta, file_path: path,
        file_name: uploadFile.name, file_size: uploadFile.size, mime_type: uploadFile.type,
      }),
    });
    setUploading(false);
    if (metaRes.ok) {
      showToast('success', 'Audit document uploaded');
      setShowUpload(false);
      setUploadFile(null);
      setUploadMeta({ client_id: '', category: '', fy_id: '', doc_type: DOC_TYPES[0], title: '', mark_as: 'Draft', visible_to_client: false, internal_note: '', client_note: '' });
      loadDocs();
    } else {
      const d = await metaRes.json();
      showToast('error', d.error || 'Metadata save failed');
    }
  };

  const fmtBytes = (b: number | null) => {
    if (!b) return '—';
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">EPR Audit Documents</h1>
        <button onClick={() => setShowUpload(true)} className="btn-primary">
          + Upload Audit Document
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
        <select value={filterVisible} onChange={e => setFilterVisible(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Visibility</option>
          <option value="true">Client-Visible</option>
          <option value="false">Internal Only</option>
        </select>
        <button onClick={loadDocs} className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-700">Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-slate-900 rounded animate-pulse" />)}</div>
      ) : error ? (
        <div className="bg-rose-950/30 text-rose-300 p-4 rounded">{error}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium">No audit documents yet</p>
          <p className="text-sm mt-1">Click &ldquo;Upload Audit Document&rdquo; to add one</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Cat / FY</th>
                <th className="px-4 py-3 text-left">Mark As</th>
                <th className="px-4 py-3 text-left">Visible</th>
                <th className="px-4 py-3 text-left">Size</th>
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
                  <td className="px-4 py-3">
                    <p className="text-slate-100 font-medium">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.doc_type}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{d.category}<br />{d.epr_financial_years?.label}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.mark_as === 'Final' ? 'bg-emerald-900/30 text-emerald-300' : d.mark_as === 'Certified Copy' ? 'bg-blue-900/30 text-blue-300' : 'bg-slate-900 text-slate-400'}`}>
                      {d.mark_as}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVisible(d)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${d.visible_to_client ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-slate-500'}`}
                    >
                      {d.visible_to_client ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtBytes(d.file_size)}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => { setEditing(d); setEditPatch({}); }} className="text-blue-400 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(d)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Upload Audit Document</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400">Client <span className="text-red-500">*</span></label>
                <select value={uploadMeta.client_id} onChange={e => setUploadMeta(m => ({ ...m, client_id: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">Category</label>
                <select value={uploadMeta.category} onChange={e => setUploadMeta(m => ({ ...m, category: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">Financial Year</label>
                <select value={uploadMeta.fy_id} onChange={e => setUploadMeta(m => ({ ...m, fy_id: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select FY</option>
                  {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">Doc Type</label>
                <select value={uploadMeta.doc_type} onChange={e => setUploadMeta(m => ({ ...m, doc_type: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">Mark As</label>
                <select value={uploadMeta.mark_as} onChange={e => setUploadMeta(m => ({ ...m, mark_as: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  {MARK_AS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400">Title <span className="text-red-500">*</span></label>
                <input value={uploadMeta.title} onChange={e => setUploadMeta(m => ({ ...m, title: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400">Internal Note (admin only)</label>
                <textarea rows={2} value={uploadMeta.internal_note} onChange={e => setUploadMeta(m => ({ ...m, internal_note: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400">Client Note</label>
                <textarea rows={2} value={uploadMeta.client_note} onChange={e => setUploadMeta(m => ({ ...m, client_note: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="vis" checked={uploadMeta.visible_to_client} onChange={e => setUploadMeta(m => ({ ...m, visible_to_client: e.target.checked }))} className="rounded" />
                <label htmlFor="vis" className="text-sm text-slate-200">Make visible to client immediately</label>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400">File (PDF, JPG, PNG) <span className="text-red-500">*</span></label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} className="mt-1 block text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm border rounded hover:bg-slate-950">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="btn-primary">
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Edit Audit Document</h2>
            <p className="text-sm text-slate-400">{editing.title}</p>
            <div>
              <label className="text-xs font-medium text-slate-400">Title</label>
              <input defaultValue={editing.title} onChange={e => setEditPatch((p: any) => ({ ...p, title: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Mark As</label>
              <select defaultValue={editing.mark_as} onChange={e => setEditPatch((p: any) => ({ ...p, mark_as: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                {MARK_AS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Client Note</label>
              <textarea rows={2} defaultValue={editing.client_note ?? ''} onChange={e => setEditPatch((p: any) => ({ ...p, client_note: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Internal Note</label>
              <textarea rows={2} defaultValue={editing.internal_note ?? ''} onChange={e => setEditPatch((p: any) => ({ ...p, internal_note: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border rounded hover:bg-slate-950">Cancel</button>
              <button onClick={handleEdit} disabled={editSaving} className="btn-primary">
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
