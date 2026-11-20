'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Contact {
  id: string;
  person_name: string;
  designation: string | null;
  department: string | null;
  seniority_level: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  is_active: boolean;
  intel_preserved: boolean;
  created_at: string;
}

const SENIORITY_LEVELS = ['Director', 'Manager', 'Officer', 'Executive', 'Other'];

const EMPTY_FORM = {
  person_name: '',
  designation: '',
  department: '',
  seniority_level: '',
  email: '',
  phone: '',
  linkedin_url: '',
  notes: '',
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function RecyclerContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/recycler-portal/contacts');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load');
      setContacts(d.contacts ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({
      person_name:     c.person_name,
      designation:     c.designation ?? '',
      department:      c.department ?? '',
      seniority_level: c.seniority_level ?? '',
      email:           c.email ?? '',
      phone:           c.phone ?? '',
      linkedin_url:    c.linkedin_url ?? '',
      notes:           c.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.person_name.trim()) { setFormError('Name is required'); return; }
    setSaving(true); setFormError('');
    try {
      const url = editing
        ? `/api/recycler-portal/contacts/${editing.id}`
        : '/api/recycler-portal/contacts';
      const method = editing ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setFormError(d.error || 'Failed'); return; }
      trackEvent('Recycler Contact Saved', { is_new: !editing });
      setModalOpen(false);
      load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/recycler-portal/contacts/${id}`, { method: 'DELETE' });
      if (r.ok) {
        trackEvent('Recycler Contact Deleted', {});
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Key people at your facility. Contacts you add here are shared with your EPR compliance officer and visible in the EPR network directory.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {/* Contact list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">No contacts yet</p>
          <p className="text-xs text-slate-400 mt-1">Add key people at your facility — plant managers, compliance officers, operations heads.</p>
          <button onClick={openAdd} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
            Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 relative">
              {c.intel_preserved && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                  Intel Synced
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-bold select-none">
                  {initials(c.person_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.person_name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {[c.designation, c.department].filter(Boolean).join(' · ') || 'No role set'}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <a href={`mailto:${c.email}`} className="hover:text-teal-600 truncate">{c.email}</a>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <a href={`tel:${c.phone}`} className="hover:text-teal-600">{c.phone}</a>
                  </div>
                )}
                {c.seniority_level && (
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
                    <span>{c.seniority_level}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => openEdit(c)}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                {c.intel_preserved ? (
                  <div
                    title="This contact is preserved in the EPR network directory and cannot be removed."
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-100 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    Intel Locked
                  </div>
                ) : (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {deletingId === c.id ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? 'Edit Contact' : 'Add Contact'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  value={form.person_name}
                  onChange={(e) => setForm((f) => ({ ...f, person_name: e.target.value }))}
                  placeholder="e.g. Ravi Deshmukh"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                <input
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Plant Manager"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Operations"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Seniority Level</label>
                <select
                  value={form.seniority_level}
                  onChange={(e) => setForm((f) => ({ ...f, seniority_level: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select level…</option>
                  {SENIORITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@company.in"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98xxx xxxxx"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (internal)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any internal notes about this contact…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
