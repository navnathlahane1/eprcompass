'use client';

import { useState, useEffect } from 'react';

interface Script {
  id: string;
  title: string;
  category: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export default function ScriptsClient() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Script | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'General', content: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/telecalling/scripts');
    const data = await res.json();
    setScripts(data.scripts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createScript(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/telecalling/scripts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.script) { setScripts(s => [data.script, ...s]); setShowCreate(false); setForm({ title: '', category: 'General', content: '' }); }
    setSaving(false);
  }

  async function toggleActive(script: Script) {
    await fetch(`/api/admin/telecalling/scripts/${script.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: !script.is_active }),
    });
    load();
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* List panel */}
      <div className="w-72 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-slate-100">Scripts</h1>
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">+ New</button>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 text-center py-8">Loading…</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            {scripts.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selected?.id === s.id ? 'bg-blue-950/30 text-blue-300' : 'hover:bg-slate-900 text-slate-200'}`}
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.category}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div className="flex-1 bg-slate-900/60 rounded-xl border border-slate-800 p-6 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-slate-500">Select a script to view</div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selected.title}</h2>
                <div className="text-xs text-slate-500 mt-1">{selected.category}</div>
              </div>
              <button
                onClick={() => toggleActive(selected)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${selected.is_active ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}
              >
                {selected.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{selected.content}</div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900/60 rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">New Script</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 text-xl">&times;</button>
            </div>
            <form onSubmit={createScript} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100">
                    <option>General</option><option>Cold Call</option><option>Follow-up</option><option>Objection Handling</option><option>Closing</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Content *</label>
                <textarea required rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                  placeholder="Write your call script here…" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border border-slate-700 text-slate-200 rounded-lg py-2 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create Script'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
