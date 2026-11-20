'use client';

import { useEffect, useRef, useState } from 'react';

const DOC_TYPES = ['Agreement', 'Guide', 'Marketing', 'Policy', 'Template', 'Other'] as const;
type DocType = typeof DOC_TYPES[number];

interface DocRow {
  id: string;
  name: string;
  doc_type: DocType;
  description: string | null;
  url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const TYPE_COLOR: Record<DocType, string> = {
  Agreement: 'bg-indigo-500/20 text-indigo-300',
  Guide:     'bg-emerald-500/20 text-emerald-300',
  Marketing: 'bg-blue-500/20 text-blue-300',
  Policy:    'bg-amber-500/20 text-amber-300',
  Template:  'bg-violet-500/20 text-violet-300',
  Other:     'bg-slate-500/20 text-slate-300',
};

const BLANK = {
  name: '', doc_type: 'Guide' as DocType, description: '', url: '', is_active: true, sort_order: 0,
};

export default function PartnerDocumentsAdminClient() {
  const [docs, setDocs]           = useState<DocRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({ ...BLANK });
  const [urlMode, setUrlMode]     = useState<'link' | 'upload'>('link');
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/partner-documents');
    const json = await res.json();
    setDocs(json.documents || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null);
    setForm({ ...BLANK });
    setUrlMode('link');
    setUploadedName('');
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEdit(doc: DocRow) {
    setEditId(doc.id);
    setForm({
      name: doc.name,
      doc_type: doc.doc_type,
      description: doc.description || '',
      url: doc.url,
      is_active: doc.is_active,
      sort_order: doc.sort_order,
    });
    setUrlMode('link');
    setUploadedName('');
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setError('');
    setSuccess('');
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/partner-documents/upload', { method: 'POST', body: fd });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) { setError(json.error || 'Upload failed'); return; }
    setForm(f => ({ ...f, url: json.url }));
    setUploadedName(json.fileName);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) { setError('Name and URL are required.'); return; }
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      doc_type: form.doc_type,
      description: form.description.trim() || null,
      url: form.url.trim(),
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };

    const res = editId
      ? await fetch(`/api/admin/partner-documents/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
      : await fetch('/api/admin/partner-documents', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });

    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || 'Save failed'); return; }
    setSuccess(editId ? 'Document updated.' : 'Document added.');
    setShowForm(false);
    setEditId(null);
    load();
  }

  async function handleToggle(doc: DocRow) {
    await fetch(`/api/admin/partner-documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !doc.is_active }),
    });
    load();
  }

  async function handleDelete(doc: DocRow) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/partner-documents/${doc.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Partner Documents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Documents shown in the Partner Portal → Documents page.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Document
        </button>
      </div>

      {/* Feedback */}
      {error   && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{success}</p>}

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">{editId ? 'Edit Document' : 'New Document'}</p>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name + Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document Name <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Partner Agreement FY 2026-27"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                <select
                  value={form.doc_type}
                  onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as DocType }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown to partners"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* URL / Upload toggle */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUrlMode('link')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${urlMode === 'link' ? 'bg-indigo-600 text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  Paste Link
                </button>
                <button
                  type="button"
                  onClick={() => setUrlMode('upload')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${urlMode === 'upload' ? 'bg-indigo-600 text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  Upload PDF / Doc
                </button>
              </div>

              {urlMode === 'link' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://drive.google.com/…  or  https://…"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    File <span className="text-rose-400">*</span>
                    <span className="ml-1 font-normal text-slate-600">(PDF, Word, PowerPoint — max 10 MB)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      {uploading ? 'Uploading…' : 'Choose file'}
                    </button>
                    {uploadedName && (
                      <span className="text-xs text-emerald-400">✓ {uploadedName}</span>
                    )}
                    {form.url && !uploadedName && (
                      <span className="text-xs text-slate-500 truncate max-w-xs">{form.url}</span>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                  {form.url && (
                    <input type="hidden" value={form.url} readOnly />
                  )}
                </div>
              )}
            </div>

            {/* Sort order + Active */}
            <div className="flex items-center gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none mt-5">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-300">Visible to partners</span>
              </label>
            </div>

            {/* Form error */}
            {error && <p className="text-sm text-rose-400">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading || (urlMode === 'upload' && !form.url)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition"
              >
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0c1022] py-16 text-center">
          <p className="text-sm text-slate-500">No documents yet. Click "Add Document" to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">URL / File</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{doc.name}</p>
                    {doc.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{doc.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[doc.doc_type] || TYPE_COLOR.Other}`}>
                      {doc.doc_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate block text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      {doc.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{doc.sort_order}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(doc)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                        doc.is_active
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-rose-500/15 hover:text-rose-300'
                          : 'bg-slate-700/40 text-slate-500 hover:bg-emerald-500/15 hover:text-emerald-300'
                      }`}
                    >
                      {doc.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(doc)}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="rounded border border-slate-800 px-2.5 py-1 text-xs text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600">
        Only documents marked <span className="text-emerald-500">Active</span> are visible to partners.
        Use Sort Order (0 = first) to control the display sequence.
      </p>
    </div>
  );
}
