'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category { id: string; name: string; }

type Source = 'file' | 'link';

export default function UploadForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const [source, setSource] = useState<Source>('file');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<'document' | 'training_material'>('document');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/knowledge/categories')
      .then(r => r.json())
      .then(d => setCategories((d.categories || []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) { setError('Title is required.'); return; }
    if (source === 'file' && !file) { setError('Please choose a file to upload.'); return; }
    if (source === 'link' && !externalUrl.trim()) { setError('Please enter a link.'); return; }

    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        item_type: itemType,
        category_id: categoryId || null,
        tags,
      };

      if (source === 'file' && file) {
        // 1. Get a signed upload URL
        const urlRes = await fetch('/api/knowledge/items/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_name: file.name, mime_type: file.type }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData.error || 'Could not get upload URL');

        // 2. PUT the file directly to storage
        const putRes = await fetch(urlData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error('File upload failed');

        payload.file_name = file.name;
        payload.file_path = urlData.path;
        payload.file_size = file.size;
        payload.mime_type = file.type;
      } else {
        payload.external_url = externalUrl.trim();
      }

      // 3. Save metadata
      const res = await fetch('/api/knowledge/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save item');

      setSuccess('Added to the library!');
      setTimeout(() => router.push('/knowledge/library'), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/knowledge/library"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/80 bg-[#0c1022] text-slate-500 hover:text-slate-300 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Add to Knowledge Hub</h1>
          <p className="text-sm text-slate-500">Upload a document or training material, or link to one.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success} Redirecting…
          </div>
        )}

        {/* Type picker */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-200">Item type</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: 'document', label: 'Document', desc: 'SOPs, guides, decks, reports' },
              { v: 'training_material', label: 'Training material', desc: 'Courses, videos, onboarding' },
            ] as const).map(t => (
              <button key={t.v} type="button" onClick={() => setItemType(t.v)}
                className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition ${
                  itemType === t.v
                    ? 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}>
                <p className={`text-xs font-semibold ${itemType === t.v ? 'text-cyan-300' : 'text-slate-400'}`}>{t.label}</p>
                <p className="text-[10px] text-slate-600">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Source: file or link */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <div className="flex gap-2">
            {(['file', 'link'] as const).map(s => (
              <button key={s} type="button" onClick={() => setSource(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  source === s ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {s === 'file' ? 'Upload file' : 'External link'}
              </button>
            ))}
          </div>

          {source === 'file' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">File <span className="text-rose-400">*</span></label>
              <input type="file" onChange={onFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.zip"
                className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-700" />
              <p className="text-[11px] text-slate-600">PDF, Word, PowerPoint, Excel, image, MP4, or ZIP — up to 50 MB.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Link URL <span className="text-rose-400">*</span></label>
              <input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
              <p className="text-[11px] text-slate-600">e.g. a hosted training video, Google Doc, or external resource.</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Title <span className="text-rose-400">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. EPR Onboarding SOP v2"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this and when should the team use it?"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                <option value="">— None —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags (comma-separated)</label>
              <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="sop, compliance, 2026"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/knowledge/library"
            className="flex-1 rounded-lg border border-slate-700 py-3 text-center text-sm font-semibold text-slate-400 hover:bg-slate-800/60 transition">
            Cancel
          </Link>
          <button type="submit" disabled={saving || !!success}
            className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 py-3 text-sm font-semibold text-white transition">
            {saving ? 'Saving…' : success ? '✓ Added!' : 'Add to library'}
          </button>
        </div>
      </form>
    </div>
  );
}
