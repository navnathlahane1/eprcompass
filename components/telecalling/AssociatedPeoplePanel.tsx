'use client';

import { useState, useEffect, useCallback } from 'react';

interface Person {
  id: string;
  person_name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  department: string | null;
  seniority_level: string | null;
  source_type?: string | null;
  is_placeholder?: boolean;
  created_at?: string;
}

const EMPTY_FORM = {
  person_name: '',
  designation: '',
  email: '',
  phone: '',
  linkedin_url: '',
  notes: '',
  department: '',
  seniority_level: '',
};

const SENIORITY_LEVELS = ['', 'C-Suite', 'VP / Director', 'Manager', 'Senior', 'Mid-level', 'Junior', 'Unknown'];
const DEPARTMENTS = ['', 'Management', 'Operations', 'Compliance / Legal', 'Finance', 'Procurement', 'HR', 'IT', 'Other'];

function PersonCard({
  person,
  onEdit,
  onDelete,
  intelCompanyId,
}: {
  person: Person;
  onEdit: (p: Person) => void;
  onDelete: (id: string) => void;
  intelCompanyId: string | null;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initials = (person.person_name || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 group">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-teal-300">
          {initials || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-100">
                  {person.is_placeholder ? <span className="text-slate-400 italic">Unnamed contact</span> : person.person_name}
                </span>
                {person.seniority_level && (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700 text-slate-400">
                    {person.seniority_level}
                  </span>
                )}
                {person.source_type === 'telecaller' && (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-teal-500/15 border border-teal-500/20 text-teal-400">
                    telecaller
                  </span>
                )}
                {intelCompanyId && (
                  <a
                    href={`/intel/companies/${intelCompanyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View in Intel"
                    className="px-1.5 py-0.5 text-xs rounded bg-purple-500/15 border border-purple-500/20 text-purple-400 hover:opacity-80"
                  >
                    ◉ Intel ↗
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {person.designation && <span className="text-xs text-slate-400">{person.designation}</span>}
                {person.designation && person.department && <span className="text-xs text-slate-600">·</span>}
                {person.department && <span className="text-xs text-slate-500">{person.department}</span>}
              </div>
            </div>

            {/* Actions — show on hover */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onEdit(person)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6 3.536 3.536-6 6H9v-3.536z" />
                </svg>
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { onDelete(person.id); setConfirmDelete(false); }}
                    className="px-2 py-1 text-xs rounded bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact channels */}
          <div className="flex flex-wrap gap-2 mt-2">
            {person.phone && (
              <a href={`tel:${person.phone}`} className="flex items-center gap-1 text-xs text-slate-300 hover:text-teal-400 transition-colors">
                <span>📞</span> {person.phone}
              </a>
            )}
            {person.email && (
              <a href={`mailto:${person.email}`} className="flex items-center gap-1 text-xs text-slate-300 hover:text-teal-400 transition-colors truncate max-w-[180px]">
                <span>✉️</span> {person.email}
              </a>
            )}
            {person.linkedin_url && (
              <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <span>in</span> LinkedIn
              </a>
            )}
          </div>

          {person.notes && (
            <p className="text-xs text-slate-500 mt-1.5 italic">"{person.notes}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: Partial<typeof EMPTY_FORM>;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const hasContact = form.email.trim() || form.phone.trim() || form.linkedin_url.trim();

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3">
      {/* Row 1: name + designation */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            value={form.person_name}
            onChange={set('person_name')}
            placeholder="e.g. Rahul Sharma"
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Designation</label>
          <input
            type="text"
            value={form.designation}
            onChange={set('designation')}
            placeholder="e.g. Director - Operations"
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Row 2: phone + email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Phone <span className="text-slate-600">(required if no email)</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+91 XXXXX XXXXX"
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="rahul@company.com"
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Row 3: department + seniority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
          <select
            value={form.department}
            onChange={set('department')}
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 focus:outline-none focus:border-teal-500"
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d || 'Select…'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Seniority</label>
          <select
            value={form.seniority_level}
            onChange={set('seniority_level')}
            className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 focus:outline-none focus:border-teal-500"
          >
            {SENIORITY_LEVELS.map(s => <option key={s} value={s}>{s || 'Select…'}</option>)}
          </select>
        </div>
      </div>

      {/* LinkedIn */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn URL</label>
        <input
          type="url"
          value={form.linkedin_url}
          onChange={set('linkedin_url')}
          placeholder="https://linkedin.com/in/..."
          className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={set('notes')}
          placeholder="e.g. Speaks only after 11am, prefers WhatsApp"
          className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-700 text-slate-400 rounded-lg py-2 text-sm hover:bg-slate-800/40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !hasContact}
          className="flex-1 bg-teal-500/20 border border-teal-500/40 text-teal-200 rounded-lg py-2 text-sm font-semibold hover:bg-teal-500/30 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Contact'}
        </button>
      </div>
    </div>
  );
}

interface Props {
  leadId: string;
  intelCompanyId?: string | null;
}

export default function AssociatedPeoplePanel({ leadId, intelCompanyId }: Props) {
  const [contacts, setContacts] = useState<Person[]>([]);
  const [source, setSource] = useState<'intel' | 'local' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/telecalling/leads/${leadId}/contacts`);
      const d = await res.json();
      setContacts(d.contacts || []);
      setSource(d.source || null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form: typeof EMPTY_FORM) {
    setSaving(true);
    setFormError('');
    try {
      const url = editing
        ? `/api/admin/telecalling/leads/${leadId}/contacts/${editing.id}`
        : `/api/admin/telecalling/leads/${leadId}/contacts`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save');
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(personId: string) {
    await fetch(`/api/admin/telecalling/leads/${leadId}/contacts/${personId}`, { method: 'DELETE' });
    load();
  }

  function startEdit(person: Person) {
    setEditing(person);
    setShowForm(true);
    setFormError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
    setFormError('');
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-200">Associated People</h2>
          {contacts.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {contacts.length}
            </span>
          )}
          {/* Sync indicator */}
          {source === 'intel' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-teal-500/15 border border-teal-500/20 text-teal-400">
              <span>◉</span> Synced to Intel
            </span>
          ) : source === 'local' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400">
              <span>○</span> Local only
            </span>
          ) : null}
        </div>

        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setFormError(''); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-500/15 border border-teal-500/30 text-teal-200 rounded-lg text-xs font-semibold hover:bg-teal-500/20 transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Person
          </button>
        )}
      </div>

      {/* Intel sync notice */}
      {source === 'intel' && (
        <div className="flex items-start gap-2 mb-4 bg-teal-500/8 border border-teal-500/15 rounded-lg px-3 py-2 text-xs text-teal-400/80">
          <span className="mt-0.5 flex-shrink-0">⚡</span>
          <span>
            Contacts you add here are immediately visible in the{' '}
            <a href={`/intel/companies/${intelCompanyId}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-300">
              Intel company profile
            </a>
            {' '}under Associated People.
          </span>
        </div>
      )}

      {source === 'local' && !showForm && contacts.length === 0 && (
        <div className="mb-4 bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2 text-xs text-amber-400/80">
          This lead is not linked to an Intel company yet. Contacts are saved locally. Once linked to Intel, they will sync automatically.
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-4">
          <ContactForm
            initial={editing ? {
              person_name: editing.person_name || '',
              designation: editing.designation || '',
              email: editing.email || '',
              phone: editing.phone || '',
              linkedin_url: editing.linkedin_url || '',
              notes: editing.notes || '',
              department: editing.department || '',
              seniority_level: editing.seniority_level || '',
            } : undefined}
            onSave={handleSave}
            onCancel={cancelForm}
            saving={saving}
            error={formError}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-6 text-slate-500 text-sm">Loading contacts…</div>
      ) : contacts.length === 0 && !showForm ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>No contacts added yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-teal-400 hover:underline text-xs"
          >
            Add the first contact →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              onEdit={startEdit}
              onDelete={handleDelete}
              intelCompanyId={intelCompanyId || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
