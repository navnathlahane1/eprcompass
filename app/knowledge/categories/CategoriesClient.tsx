'use client';

import { useEffect, useState } from 'react';
import { KNOWLEDGE_SERVICE_TYPES, type KnowledgeServiceType } from '@/lib/knowledge/serviceTypes';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  service_type: KnowledgeServiceType | null;
  sort_order: number;
  item_count: number;
}

export default function CategoriesClient({ canManage }: { canManage: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState<Category | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setCategories(data.categories || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/knowledge/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          service_type: serviceType || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category');
      setName('');
      setDescription('');
      setServiceType('');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  }

  async function remove(cat: Category) {
    const msg = cat.item_count > 0
      ? `Delete "${cat.name}"? Its ${cat.item_count} item(s) will become uncategorized.`
      : `Delete "${cat.name}"?`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/knowledge/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/knowledge/categories/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          description: editing.description,
          service_type: editing.service_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setCategories(prev => prev.map(c => (c.id === editing.id
        ? { ...c, name: editing.name, description: editing.description, service_type: editing.service_type }
        : c)));
      setEditing(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Categories</h1>
        <p className="text-sm text-slate-500">
          {canManage
            ? 'Organize documents and training materials into categories.'
            : 'Browse categories and the EPR service each one belongs to.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</div>
      )}

      {/* Add new */}
      {canManage && (
        <form onSubmit={add} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-200">Add a category</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Service</label>
            <select value={serviceType} onChange={e => setServiceType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:w-64">
              <option value="">— None —</option>
              {KNOWLEDGE_SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" disabled={adding || !name.trim()}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition">
            {adding ? 'Adding…' : '+ Add category'}
          </button>
        </form>
      )}

      {/* List */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022]">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No categories yet.</div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {categories.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  {editing?.id === c.id ? (
                    <div className="space-y-2">
                      <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                      <input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
                        placeholder="Description"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                      <select value={editing.service_type || ''}
                        onChange={e => setEditing({ ...editing, service_type: (e.target.value || null) as KnowledgeServiceType | null })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        <option value="">— No service —</option>
                        {KNOWLEDGE_SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-200">{c.name}</p>
                      {c.description && <p className="truncate text-xs text-slate-500">{c.description}</p>}
                    </>
                  )}
                </div>
                {editing?.id !== c.id && c.service_type && (
                  <span className="shrink-0 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">
                    {c.service_type}
                  </span>
                )}
                <span className="shrink-0 rounded bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-400">{c.item_count} item{c.item_count === 1 ? '' : 's'}</span>
                {canManage && (editing?.id === c.id ? (
                  <>
                    <button onClick={saveEdit} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Save</button>
                    <button onClick={() => setEditing(null)} className="text-xs font-medium text-slate-500 hover:text-slate-300">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(c)} title="Edit"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => remove(c)} title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
