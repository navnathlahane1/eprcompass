'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { KNOWLEDGE_SERVICE_TYPES } from '@/lib/knowledge/serviceTypes';

interface Item {
  id: string;
  title: string;
  description: string | null;
  item_type: 'document' | 'training_material';
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  tags: string[];
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  view_count: number;
  created_by: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface Category { id: string; name: string; color: string; }

interface Props {
  userId: string;
  role: string;
  canContribute: boolean;
  canManageAll: boolean;
}

function fmtSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function LibraryClient({ userId, role, canContribute, canManageAll }: Props) {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') || '');
  const [catFilter, setCatFilter] = useState(() => searchParams.get('category') || '');
  const [serviceFilter, setServiceFilter] = useState(() => searchParams.get('service') || '');

  const [editing, setEditing] = useState<Item | null>(null);
  const [busyId, setBusyId] = useState('');

  function canEdit(item: Item) {
    if (canManageAll) return true;
    if (role === 'knowledge_contributor') return !!item.created_by && item.created_by === userId;
    return false;
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (catFilter) params.set('category', catFilter);
      if (serviceFilter) params.set('service', serviceFilter);
      const [itemsRes, catsRes] = await Promise.all([
        fetch(`/api/knowledge/items?${params.toString()}`),
        fetch('/api/knowledge/categories'),
      ]);
      const itemsData = await itemsRes.json();
      const catsData = await catsRes.json();
      if (!itemsRes.ok) throw new Error(itemsData.error || 'Failed to load items');
      setItems(itemsData.items || []);
      setCategories((catsData.categories || []).map((c: any) => ({ id: c.id, name: c.name, color: c.color })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Initial load + reload when filters change (debounced on search).
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, catFilter, serviceFilter]);

  async function handleView(item: Item) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/knowledge/items/${item.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open item');
      window.open(data.url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to open item');
    } finally {
      setBusyId('');
    }
  }

  async function handleDownload(item: Item) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/knowledge/items/${item.id}?download=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get download link');
      window.open(data.url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setBusyId('');
    }
  }

  async function handleDelete(item: Item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/knowledge/items/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  }

  const empty = !loading && items.length === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Library</h1>
          <p className="text-sm text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
        </div>
        {canContribute && (
          <Link href="/knowledge/upload"
            className="rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition">
            + Upload
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title or description…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
          <option value="">All types</option>
          <option value="document">Documents</option>
          <option value="training_material">Training materials</option>
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
          <option value="">All services</option>
          {KNOWLEDGE_SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading…</div>
      ) : empty ? (
        <div className="rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <p className="text-sm text-slate-500">No items match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="flex flex-col rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  item.item_type === 'training_material'
                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                    : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                }`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                    {item.external_url
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.item_type === 'training_material' ? 'Training material' : 'Document'}
                    {item.file_size ? ` · ${fmtSize(item.file_size)}` : ''}
                  </p>
                </div>
              </div>

              {item.description && (
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">{item.description}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {item.category_name && (
                  <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    {item.category_name}
                  </span>
                )}
                {item.tags?.slice(0, 3).map(t => (
                  <span key={t} className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">#{t}</span>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-3">
                <button
                  onClick={() => handleView(item)}
                  disabled={busyId === item.id}
                  className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 py-1.5 text-xs font-semibold text-white transition"
                >
                  {busyId === item.id ? '…' : item.external_url ? 'Open link' : 'View'}
                </button>
                {canEdit(item) && (
                  <>
                    <button
                      onClick={() => setEditing(item)}
                      title="Edit"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {!item.external_url && (
                      <button
                        onClick={() => handleDownload(item)}
                        title="Download"
                        disabled={busyId === item.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      title="Delete"
                      disabled={busyId === item.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems(prev => prev.map(i => (i.id === updated.id ? { ...i, ...updated } : i)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  item, categories, onClose, onSaved,
}: {
  item: Item;
  categories: Category[];
  onClose: () => void;
  onSaved: (updated: Item) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [itemType, setItemType] = useState(item.item_type);
  const [categoryId, setCategoryId] = useState(item.category_id || '');
  const [tagsInput, setTagsInput] = useState((item.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tags = useMemo(
    () => tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    [tagsInput]
  );

  async function save() {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/knowledge/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, item_type: itemType, category_id: categoryId || null, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      const cat = categories.find(c => c.id === categoryId);
      onSaved({ ...item, title, description, item_type: itemType, category_id: categoryId || null, category_name: cat?.name ?? null, tags });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c1022] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Edit item</h2>
        {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
            <select value={itemType} onChange={e => setItemType(e.target.value as Item['item_type'])}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
              <option value="document">Document</option>
              <option value="training_material">Training material</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
              <option value="">— None —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags (comma-separated)</label>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. sop, compliance, 2026"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800/60 transition">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 py-2 text-sm font-semibold text-white transition">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
