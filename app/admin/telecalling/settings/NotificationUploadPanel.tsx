'use client';

import { useEffect, useMemo, useState } from 'react';

interface NotificationEntry {
  id: string;
  category: string;
  title: string;
  sourceUrl: string;
  sourcePage?: string;
  localPath?: string;
  publishedAt?: string | null;
  tags?: string[];
  summary?: string | null;
  downloadedAt?: string;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const CATEGORY_OPTIONS = [
  'Plastic Packaging',
  'E-Waste',
  'Battery Waste',
  'Tyre Waste',
  'Used Oil',
  'ELV (End-of-Life Vehicles)',
  'Construction and Demolition',
  'Non-Ferrous Materials',
  'General CPCB',
];

export default function NotificationUploadPanel() {
  const [list, setList] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('E-Waste');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePage, setSourcePage] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/telecalling/intelligence/notifications');
      const data = await res.json();
      setList(Array.isArray(data?.notifications) ? data.notifications : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const recent = useMemo(() => list.slice(0, 10), [list]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMsg('Select a file first.');
      return;
    }

    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      setMsg('Invalid file size. Max 25MB.');
      return;
    }

    setUploading(true);
    setMsg(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('category', category);
      form.append('title', title);
      form.append('sourceUrl', sourceUrl);
      form.append('sourcePage', sourcePage);
      form.append('publishedAt', publishedAt);
      form.append('tags', tags);
      form.append('summary', summary);

      const res = await fetch('/api/admin/telecalling/intelligence/notifications', {
        method: 'POST',
        body: form,
      });
      const raw = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const fallbackMessage = raw
          ? raw.replace(/\s+/g, ' ').trim().slice(0, 240)
          : 'Upload failed';
        throw new Error(data?.error || fallbackMessage || 'Upload failed');
      }

      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      setMsg('Uploaded and indexed successfully.');
      setFile(null);
      setTitle('');
      setSourceUrl('');
      setSourcePage('');
      setPublishedAt('');
      setTags('');
      setSummary('');
      await load();
    } catch (err: any) {
      setMsg(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 mt-8">
      <h2 className="font-semibold text-slate-100 mb-1">Regulatory Notification Upload</h2>
      <p className="text-xs text-slate-500 mb-5">
        Upload CPCB/MoEF&CC notifications manually to update the telecalling intelligence corpus.
      </p>

      <form onSubmit={onUpload} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">File (PDF/DOC/XLS/ZIP/TXT)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Published Date (optional)</label>
            <input
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty to infer from file name"
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ewaste, cpcb, rules"
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Source URL (optional, official link preferred)</label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://cpcb.nic.in/..."
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Source Page (optional)</label>
          <input
            value={sourcePage}
            onChange={(e) => setSourcePage(e.target.value)}
            placeholder="https://cpcb.nic.in/e-waste/"
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Summary (optional)</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short abstract for better retrieval relevance"
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={uploading} className="btn-primary">
            {uploading ? 'Uploading…' : 'Upload & Index'}
          </button>
          {msg && <span className="text-sm text-slate-400">{msg}</span>}
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-100">Recent Indexed Notifications</h3>
        {loading ? (
          <p className="text-xs text-slate-500 mt-2">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-xs text-slate-500 mt-2">No notifications indexed yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((n) => (
              <li key={n.id} className="rounded-lg border border-slate-800 p-3 text-xs">
                <div className="font-medium text-slate-100">{n.title}</div>
                <div className="text-slate-500">{n.category}{n.publishedAt ? ` • ${n.publishedAt}` : ''}</div>
                {n.localPath && (
                  <a href={n.localPath} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">
                    {n.localPath}
                  </a>
                )}
                <div className="text-slate-500 break-all">{n.sourceUrl}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
