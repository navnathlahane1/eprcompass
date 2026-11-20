'use client';

import { useEffect, useMemo, useState } from 'react';

type SharedItem = {
  id: string;
  title: string;
  description: string | null;
  item_type: 'document' | 'training_material';
  category_name: string | null;
  tags: string[];
  file_size: number | null;
  external_url: string | null;
  shared_at: string;
};

function fmtSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsClient() {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/telecalling/documents');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load shared documents');
        setItems(data.items || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load shared documents');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map(item => item.category_name).filter(Boolean))) as string[],
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      if (typeFilter && item.item_type !== typeFilter) return false;
      if (categoryFilter && item.category_name !== categoryFilter) return false;
      return !query || `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query);
    });
  }, [items, search, typeFilter, categoryFilter]);

  async function openItem(item: SharedItem, download = false) {
    setBusyId(item.id);
    setError('');
    try {
      const res = await fetch(`/api/telecalling/documents/${item.id}${download ? '?download=1' : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to open document');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Unable to open document');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Shared Documents</h1>
        <p className="mt-1 text-sm text-slate-500">Training materials and company documents shared with you by the Knowledge team.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your documents…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
        </div>
        <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500">
          <option value="">All types</option>
          <option value="document">Documents</option>
          <option value="training_material">Training materials</option>
        </select>
        <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500">
          <option value="">All categories</option>
          {categories.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</div>}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading your documents…</div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-400">No shared documents</p>
          <p className="mt-1 text-xs text-slate-600">Documents assigned by a Knowledge Admin will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <article key={item.id} className="flex flex-col rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${item.item_type === 'training_material' ? 'border-violet-500/30 bg-violet-500/10 text-violet-300' : 'border-teal-500/30 bg-teal-500/10 text-teal-300'}`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                    {item.external_url
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-100">{item.title}</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.item_type === 'training_material' ? 'Training material' : 'Document'}
                    {item.file_size ? ` · ${fmtSize(item.file_size)}` : ''}
                  </p>
                </div>
              </div>
              {item.description && <p className="mt-3 line-clamp-2 text-xs text-slate-400">{item.description}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.category_name && <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-300">{item.category_name}</span>}
                {(item.tags || []).slice(0, 3).map(tag => <span key={tag} className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-300">#{tag}</span>)}
              </div>
              <p className="mt-3 text-[10px] text-slate-600">Shared {new Date(item.shared_at).toLocaleDateString('en-IN')}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <button onClick={() => openItem(item)} disabled={busyId === item.id}
                  className="flex-1 rounded-lg bg-teal-600 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50">
                  {busyId === item.id ? 'Opening…' : item.external_url ? 'Open link' : 'View'}
                </button>
                {!item.external_url && (
                  <button onClick={() => openItem(item, true)} disabled={busyId === item.id}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">
                    Download
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
