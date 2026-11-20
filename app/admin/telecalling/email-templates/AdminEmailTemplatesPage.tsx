'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EmailTemplateWithRelations } from '@/lib/telecalling/email-templates/types';
import EmailTemplateEditor from './EmailTemplateEditor';

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateWithRelations[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function parseJsonSafe(res: Response) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: res.ok ? 'Unexpected response format' : 'Server returned non-JSON error response' };
    }
  }

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/telecalling/email-templates?active_only=false');
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        setTemplates([]);
        setSelectedId('');
        setLoadError(data?.error || 'Failed to load email templates');
        return;
      }

      const list = Array.isArray(data?.templates) ? data.templates : [];
      setTemplates(list);
      if (list.length > 0) {
        setSelectedId((curr) => (curr && list.some((t: any) => t.id === curr) ? curr : list[0].id));
      } else {
        setSelectedId('');
      }
    } catch {
      setTemplates([]);
      setSelectedId('');
      setLoadError('Failed to load email templates');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => `${t.title} ${t.subject} ${t.category} ${t.call_stage}`.toLowerCase().includes(q));
  }, [templates, search]);

  const selected = filtered.find((item) => item.id === selectedId) || null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        {loadError ? (
          <div className="mb-3 rounded border border-rose-800/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            {loadError}
          </div>
        ) : null}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Email Templates</h2>
          <button
            onClick={() => {
              setSelectedId('new');
            }}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white"
          >
            + New
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title/subject"
          className="mb-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
        />

        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Title</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Category</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Stage</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-xs text-slate-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-xs text-slate-500">No templates.</td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} onClick={() => setSelectedId(t.id)} className={`cursor-pointer border-t border-slate-800/60 ${selectedId === t.id ? 'bg-blue-950/30' : ''}`}>
                    <td className="px-3 py-2 text-xs text-slate-100">{t.title}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{t.category}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{t.call_stage}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{t.is_active ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lg:col-span-8">
        <EmailTemplateEditor
          template={selectedId === 'new' ? null : selected}
          onSaved={async () => {
            await load();
          }}
          onDeleted={async () => {
            await load();
          }}
        />
      </section>
    </div>
  );
}
