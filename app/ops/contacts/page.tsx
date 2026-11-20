'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Contact {
  id: string;
  title: string;
  description: string | null;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_company: string | null;
  created_at: string;
}

export default function OpsContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ contact_name: '', contact_company: '', contact_phone: '', contact_email: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/ops/tasks?status=all&role_context=contact');
    const data = await res.json();
    setContacts(data.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name.trim()) return;
    setSubmitting(true);
    await fetch('/api/ops/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, title: form.contact_name, role_context: 'contact', status: 'done' }),
    });
    trackEvent('Ops Contact Created', {});
    setShowCreate(false);
    setForm({ contact_name: '', contact_company: '', contact_phone: '', contact_email: '', description: '' });
    setSubmitting(false);
    load();
  }

  async function toggleArchived(c: Contact) {
    const next = c.status === 'blocked' ? 'done' : 'blocked';
    await fetch(`/api/ops/tasks/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    trackEvent('Ops Contact Archived Toggled', { status: next });
    load();
  }

  const q = search.trim().toLowerCase();
  const filtered = contacts.filter(c => {
    if (!q) return true;
    return [c.contact_name, c.contact_company, c.contact_phone, c.contact_email]
      .some(v => v?.toLowerCase().includes(q));
  });
  const active = filtered.filter(c => c.status !== 'blocked');
  const archived = filtered.filter(c => c.status === 'blocked');

  function ContactCard({ c }: { c: Contact }) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100">{c.contact_name}</p>
            {c.contact_company && <p className="text-xs text-slate-400 mt-0.5">{c.contact_company}</p>}
            <p className="text-[11px] text-slate-500 mt-1">
              {[c.contact_phone, c.contact_email].filter(Boolean).join(' · ') || 'No contact details'}
            </p>
            {c.description && <p className="mt-1.5 text-xs text-slate-400">{c.description}</p>}
          </div>
          <button onClick={() => toggleArchived(c)}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
            {c.status === 'blocked' ? 'Restore' : 'Archive'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Contacts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your contact directory</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition shrink-0">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Contact
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, phone, email…"
        className="w-full mb-6 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-medium text-slate-400">{q ? 'No contacts match your search' : 'No contacts yet'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            {active.map(c => <ContactCard key={c.id} c={c} />)}
          </div>
          {archived.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-400">
                Archived ({archived.length})
              </summary>
              <div className="space-y-3 mt-3">
                {archived.map(c => <ContactCard key={c.id} c={c} />)}
              </div>
            </details>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">New Contact</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
                <input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company</label>
                <input value={form.contact_company} onChange={e => setForm(f => ({ ...f, contact_company: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Adding…' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
