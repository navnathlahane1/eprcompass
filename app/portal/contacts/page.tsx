'use client';

/**
 * /portal/contacts  — Team Members (Client Portal)
 *
 * Full CRUD for the client company's key people (client_contacts).
 * Both the client portal user AND the assigned manager can add / edit /
 * mark team members as departed — this page handles the client side.
 *
 * Routes used:
 *   GET  /api/portal/client-contacts
 *   POST /api/portal/client-contacts
 *   PATCH/DELETE /api/portal/client-contacts/[contactId]
 *   POST /api/portal/client-contacts/upload-photo
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  person_name: string;
  designation: string | null;
  department: string | null;
  seniority_level: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  photo_url: string | null;
  photo_signed_url: string | null;
  notes: string | null;
  is_active: boolean;
  left_company_at: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  person_name: '', designation: '', department: '', seniority_level: '',
  email: '', phone: '', linkedin_url: '', photo_url: '', notes: '',
};

const SENIORITY_OPTIONS = ['C-Suite', 'VP', 'Director', 'Manager', 'Executive', 'Other'];
const DEPARTMENT_OPTIONS = ['Management', 'Finance', 'Legal', 'Operations', 'Compliance', 'HR', 'IT', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const GRADIENT_PAIRS = [
  'from-blue-500 to-blue-700',
  'from-teal-500 to-teal-700',
  'from-violet-500 to-violet-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-emerald-500 to-emerald-700',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PortalContactsPage() {
  const [contacts,        setContacts]        = useState<Contact[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [showForm,        setShowForm]        = useState(false);
  const [editingContact,  setEditingContact]  = useState<Contact | null>(null);
  const [form,            setForm]            = useState({ ...BLANK_FORM });
  const [saving,          setSaving]          = useState(false);
  const [msg,             setMsg]             = useState<{ ok: boolean; text: string } | null>(null);
  const [photoFile,       setPhotoFile]       = useState<File | null>(null);
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(null);
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false);
  const [showInactive,    setShowInactive]    = useState(false);
  const [departModal,     setDepartModal]     = useState<Contact | null>(null);
  const [departDate,      setDepartDate]      = useState('');
  const [departSaving,    setDepartSaving]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/portal/client-contacts');
    if (res.ok) { const d = await res.json(); setContacts(d.contacts ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditingContact(null);
    setForm({ ...BLANK_FORM });
    setPhotoFile(null);
    setPhotoPreview(null);
    setMsg(null);
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditingContact(c);
    setForm({
      person_name:     c.person_name,
      designation:     c.designation     ?? '',
      department:      c.department      ?? '',
      seniority_level: c.seniority_level ?? '',
      email:           c.email           ?? '',
      phone:           c.phone           ?? '',
      linkedin_url:    c.linkedin_url    ?? '',
      photo_url:       c.photo_url       ?? '',
      notes:           c.notes           ?? '',
    });
    setPhotoFile(null);
    setPhotoPreview(c.photo_signed_url ?? null);
    setMsg(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingContact(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setMsg(null);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return editingContact?.photo_url ?? null;
    setUploadingPhoto(true);
    try {
      const res = await fetch('/api/portal/client-contacts/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: photoFile.name, contentType: photoFile.type }),
      });
      if (!res.ok) return null;
      const { signedUrl, storagePath } = await res.json();
      const uploadRes = await fetch(signedUrl, { method: 'PUT', body: photoFile, headers: { 'Content-Type': photoFile.type } });
      return uploadRes.ok ? storagePath : null;
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save() {
    if (!form.person_name.trim()) return;
    setSaving(true); setMsg(null);
    const photo_url = await uploadPhoto();
    const payload   = { ...form, photo_url };
    const url    = editingContact
      ? `/api/portal/client-contacts/${editingContact.id}`
      : '/api/portal/client-contacts';
    const method = editingContact ? 'PATCH' : 'POST';
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      trackEvent('Client Contact Saved', { is_new: !editingContact });
      setMsg({ ok: true, text: editingContact ? 'Contact updated.' : 'Team member added successfully.' });
      await load();
      setTimeout(closeForm, 900);
    } else {
      setMsg({ ok: false, text: data.error ?? 'Save failed.' });
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Remove this team member? This cannot be undone.')) return;
    const res = await fetch(`/api/portal/client-contacts/${id}`, { method: 'DELETE' });
    if (res.ok) { trackEvent('Client Contact Removed', {}); setContacts(prev => prev.filter(c => c.id !== id)); }
  }

  async function confirmDepart() {
    if (!departModal) return;
    setDepartSaving(true);
    const res = await fetch(`/api/portal/client-contacts/${departModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false, left_company_at: departDate || null }),
    });
    if (res.ok) { trackEvent('Client Contact Departed', {}); await load(); }
    setDepartSaving(false);
    setDepartModal(null);
    setDepartDate('');
  }

  async function reactivate(c: Contact) {
    await fetch(`/api/portal/client-contacts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true, left_company_at: null }),
    });
    trackEvent('Client Contact Reactivated', {});
    await load();
  }

  const activeContacts   = contacts.filter(c => c.is_active);
  const inactiveContacts = contacts.filter(c => !c.is_active);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Team Members</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Key people at your company involved in EPR compliance.
            {activeContacts.length > 0 && ` ${activeContacts.length} active member${activeContacts.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Team Member
        </button>
      </div>

      {/* ── Add / Edit form ────────────────────────────────────────────────── */}
      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {editingContact ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 transition">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Photo upload */}
          <div className="mb-5 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover border-2 border-blue-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white">
                  {form.person_name ? initials(form.person_name) : '?'}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition"
              >
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              <p className="mt-1 text-[11px] text-slate-400">JPEG, PNG or WebP · max 3 MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
              <input
                value={form.person_name}
                onChange={e => setForm(p => ({ ...p, person_name: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
              <input
                value={form.designation}
                onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                placeholder="e.g. Chief Sustainability Officer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="">Select department…</option>
                {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Seniority Level</label>
              <select
                value={form.seniority_level}
                onChange={e => setForm(p => ({ ...p, seniority_level: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="">Select level…</option>
                {SENIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="person@company.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn URL</label>
              <input
                value={form.linkedin_url}
                onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="Any relevant notes about this person's role in EPR compliance…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
              />
            </div>
          </div>

          {msg && (
            <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || uploadingPhoto || !form.person_name.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-700 transition"
            >
              {(saving || uploadingPhoto) && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {uploadingPhoto ? 'Uploading photo…' : saving ? 'Saving…' : editingContact ? 'Update Member' : 'Add Member'}
            </button>
            <button onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-slate-400 transition">
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Active contacts ────────────────────────────────────────────────── */}
      {!loading && activeContacts.length === 0 && !showForm && (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">No team members yet</p>
          <p className="mt-1 text-sm text-slate-400">Add the key people involved in EPR compliance at your company.</p>
          <button
            onClick={openAdd}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Add First Team Member
          </button>
        </section>
      )}

      {!loading && activeContacts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeContacts.map((c, i) => (
            <ContactCard
              key={c.id}
              contact={c}
              gradientClass={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length]}
              onEdit={() => openEdit(c)}
              onDepart={() => { setDepartModal(c); setDepartDate(''); }}
              onDelete={() => remove(c.id)}
            />
          ))}
        </div>
      )}

      {/* ── Departed members ───────────────────────────────────────────────── */}
      {!loading && inactiveContacts.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowInactive(p => !p)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Departed Members ({inactiveContacts.length})
            </span>
            <svg className={`h-4 w-4 text-slate-400 transition-transform ${showInactive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showInactive && (
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {inactiveContacts.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 opacity-60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {initials(c.person_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.person_name}</p>
                      <p className="text-xs text-slate-500">
                        {c.designation || '—'}{c.left_company_at ? ` · Left ${fmtDate(c.left_company_at)}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => reactivate(c)}
                    className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    Re-activate
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Depart confirmation modal ──────────────────────────────────────── */}
      {departModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
            <h3 className="text-base font-semibold text-slate-900">Mark as Departed</h3>
            <p className="mt-1 text-sm text-slate-600">
              Mark <span className="font-medium">{departModal.person_name}</span> as having left your company.
              Their profile will be archived in our compliance records.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Date of departure (optional)</label>
              <input
                type="date"
                value={departDate}
                onChange={e => setDepartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={confirmDepart}
                disabled={departSaving}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition"
              >
                {departSaving ? 'Saving…' : 'Confirm Departure'}
              </button>
              <button
                onClick={() => { setDepartModal(null); setDepartDate(''); }}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-slate-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Info footer ───────────────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 text-center">
        Team members added here also appear in our compliance records for your company.
        Your compliance manager can view and manage these contacts as well.
      </p>
    </div>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({
  contact: c,
  gradientClass,
  onEdit,
  onDepart,
  onDelete,
}: {
  contact: Contact;
  gradientClass: string;
  onEdit: () => void;
  onDepart: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top accent strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />

      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div className="shrink-0">
          {c.photo_signed_url ? (
            <img src={c.photo_signed_url} alt={c.person_name} className="h-12 w-12 rounded-full object-cover border-2 border-slate-100" />
          ) : (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} text-sm font-bold text-white`}>
              {c.person_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{c.person_name}</p>
          {c.designation && <p className="text-xs text-slate-500 truncate">{c.designation}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {c.department && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{c.department}</span>
            )}
            {c.seniority_level && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">{c.seniority_level}</span>
            )}
          </div>
        </div>
      </div>

      {/* Contact details */}
      <div className="px-4 pb-3 space-y-1.5 flex-1">
        {c.email && (
          <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline truncate">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{c.email}</span>
          </a>
        )}
        {c.phone && (
          <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {c.phone}
          </a>
        )}
        {c.linkedin_url && (
          <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" />
            </svg>
            LinkedIn Profile
          </a>
        )}
        {c.notes && (
          <p className="text-[11px] text-slate-400 line-clamp-2 pt-0.5">{c.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-end gap-3">
        <button
          onClick={onEdit}
          className="text-xs text-slate-500 hover:text-blue-600 transition"
        >
          Edit
        </button>
        <button
          onClick={onDepart}
          className="text-xs text-slate-500 hover:text-amber-600 transition"
          title="Mark as departed"
        >
          Mark Departed
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-slate-500 hover:text-rose-600 transition"
          title="Delete permanently"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
