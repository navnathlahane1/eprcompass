'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import MessageClientButton from '@/components/inbox/MessageClientButton';
import { trackEvent } from '@/lib/analytics';

/* ─── Types ─────────────────────────────────────────────── */
interface Contact {
  id: string;
  client_id: string;
  person_name: string;
  designation: string | null;
  department: string | null;
  seniority_level: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  photo_url: string | null;
  photo_signed_url?: string | null;
  notes: string | null;
  is_active: boolean;
  left_company_at: string | null;
  created_at: string;
}

const BLANK_CONTACT_FORM = {
  person_name: '', designation: '', department: '',
  seniority_level: '', email: '', phone: '',
  linkedin_url: '', notes: '',
};

const SENIORITY_OPTIONS = ['C-Suite', 'VP', 'Director', 'Manager', 'Executive', 'Other'];
const DEPARTMENT_OPTIONS = ['Management', 'Finance', 'Legal', 'Operations', 'Compliance', 'HR', 'IT', 'Other'];

interface ClientData {
  id: string;
  status: string;
  category: string;
  waste_categories: string[] | null;
  onboarded_date: string | null;
  renewal_date: string | null;
  notes: string | null;
  health_score: number | null;
  ltv_inr: number | null;
  profile_id: string | null;
  company_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  state: string | null;
}

interface Filing {
  id: string;
  category: string;
  current_status: string;
  sla_due_at: string | null;
  updated_at: string;
  fy_id: string | null;
  fy_label: string;
}

interface Doc {
  id: string;
  category: string;
  doc_type: string;
  document_name: string;
  status: string;
  upload_date: string;
  admin_comment: string | null;
  rejection_reason: string | null;
  epr_financial_years: { label: string } | null;
}

/* ─── Helpers ────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  'Received':          'bg-blue-500/20 text-blue-300',
  'Under Review':      'bg-amber-500/20 text-amber-300',
  'Clarification':     'bg-orange-500/20 text-orange-300',
  'Approved':          'bg-emerald-500/20 text-emerald-300',
  'Certificate Issued':'bg-teal-500/20 text-teal-300',
  'Rejected':          'bg-rose-500/20 text-rose-300',
  'Pending':           'bg-slate-500/20 text-slate-400',
};

const CLIENT_STATUS_COLOR: Record<string, string> = {
  'Active':     'bg-emerald-500/20 text-emerald-300',
  'At Risk':    'bg-amber-500/20 text-amber-300',
  'Inactive':   'bg-slate-700/50 text-slate-400',
  'Churned':    'bg-rose-500/20 text-rose-300',
  'Onboarding': 'bg-blue-500/20 text-blue-300',
};

const FILING_STATUSES = [
  'Received', 'Under Review', 'Clarification', 'Approved', 'Certificate Issued', 'Rejected',
];

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(sla: string | null, status: string) {
  if (!sla) return false;
  if (['Approved', 'Certificate Issued'].includes(status)) return false;
  return new Date(sla) < new Date();
}

/* ─── Component ──────────────────────────────────────────── */
export default function ClientDetailClient({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState<ClientData | null>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [tab, setTab] = useState<'overview' | 'filings' | 'documents' | 'epr_tasks' | 'team'>('overview');

  // Team / Contacts
  const [contacts,       setContacts]      = useState<Contact[]>([]);
  const [contactsLoading,setContactsLoading] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm,    setContactForm]    = useState({ ...BLANK_CONTACT_FORM });
  const [savingContact,  setSavingContact]  = useState(false);
  const [contactMsg,     setContactMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [photoFile,      setPhotoFile]      = useState<File | null>(null);
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showInactiveContacts, setShowInactiveContacts] = useState(false);
  const [departModal,    setDepartModal]    = useState<Contact | null>(null);
  const [departDate,     setDepartDate]     = useState('');
  const [departSaving,   setDepartSaving]   = useState(false);

  // Filing status update
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  // EPR Tasks
  const [eprTasks, setEprTasks]       = useState<any[]>([]);
  const [eprLoading, setEprLoading]   = useState(false);
  const [eprSummary, setEprSummary]   = useState<any>(null);
  const [generating, setGenerating]   = useState(false);
  const [genMsg, setGenMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskNote, setTaskNote]       = useState('');
  const [taskStatus, setTaskStatus]   = useState('');
  const [savingTask, setSavingTask]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const res = await fetch(`/api/manager/clients/${clientId}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to load client.');
      setLoading(false); return;
    }
    const data = await res.json();
    setClient(data.client);
    setFilings(data.filings ?? []);
    setDocuments(data.documents ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const loadEprTasks = useCallback(async () => {
    if (!clientId) return;
    setEprLoading(true);
    const res = await fetch(`/api/manager/epr-tasks?clientId=${clientId}&fy=2026-27`);
    if (res.ok) {
      const d = await res.json();
      setEprTasks(d.tasks ?? []);
      setEprSummary(d.summary ?? null);
    }
    setEprLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (tab === 'epr_tasks' && eprTasks.length === 0) {
      loadEprTasks();
    }
  }, [tab, loadEprTasks, eprTasks.length]);

  async function generateEprTasks(overwrite = false) {
    setGenerating(true); setGenMsg(null);
    const res = await fetch('/api/manager/epr-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, fy: '2026-27', overwrite }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      trackEvent('Manager EPR Tasks Generated', { overwrite, created: d.created });
      setGenMsg({ ok: true, text: d.message ?? `Generated ${d.created} tasks.` });
      await loadEprTasks();
    } else {
      setGenMsg({ ok: false, text: d.error ?? 'Generation failed.' });
    }
    setGenerating(false);
  }

  // ── Contacts ────────────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    const res = await fetch(`/api/manager/clients/${clientId}/contacts`);
    if (res.ok) { const d = await res.json(); setContacts(d.contacts ?? []); }
    setContactsLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (tab === 'team' && contacts.length === 0) loadContacts();
  }, [tab, loadContacts, contacts.length]);

  function openAddContact() {
    setEditingContact(null);
    setContactForm({ ...BLANK_CONTACT_FORM });
    setPhotoFile(null); setPhotoPreview(null);
    setShowAddContact(true);
  }

  function openEditContact(c: Contact) {
    setEditingContact(c);
    setContactForm({
      person_name:     c.person_name,
      designation:     c.designation     ?? '',
      department:      c.department      ?? '',
      seniority_level: c.seniority_level ?? '',
      email:           c.email           ?? '',
      phone:           c.phone           ?? '',
      linkedin_url:    c.linkedin_url    ?? '',
      notes:           c.notes           ?? '',
    });
    setPhotoFile(null);
    setPhotoPreview(c.photo_signed_url ?? c.photo_url ?? null);
    setShowAddContact(true);
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
    const res = await fetch(`/api/manager/clients/${clientId}/contacts/upload-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: photoFile.name, contentType: photoFile.type }),
    });
    if (!res.ok) { setUploadingPhoto(false); return null; }
    const { signedUrl, storagePath } = await res.json();
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': photoFile.type },
      body: photoFile,
    });
    setUploadingPhoto(false);
    return uploadRes.ok ? storagePath : null;
  }

  async function saveContact() {
    if (!contactForm.person_name.trim()) return;
    setSavingContact(true); setContactMsg(null);
    const photo_url = await uploadPhoto();
    const payload = { ...contactForm, photo_url };

    const url    = editingContact
      ? `/api/manager/clients/${clientId}/contacts/${editingContact.id}`
      : `/api/manager/clients/${clientId}/contacts`;
    const method = editingContact ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      trackEvent('Manager Contact Saved', { is_new: !editingContact });
      setContactMsg({ ok: true, text: editingContact ? 'Contact updated.' : 'Contact added.' });
      await loadContacts();
      setShowAddContact(false);
      setEditingContact(null);
    } else {
      setContactMsg({ ok: false, text: d.error ?? 'Save failed.' });
    }
    setSavingContact(false);
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    const res = await fetch(`/api/manager/clients/${clientId}/contacts/${id}`, { method: 'DELETE' });
    if (res.ok) setContacts(prev => prev.filter(c => c.id !== id));
  }

  async function confirmDepart() {
    if (!departModal) return;
    setDepartSaving(true);
    await fetch(`/api/manager/clients/${clientId}/contacts/${departModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false, left_company_at: departDate || null }),
    });
    setDepartSaving(false);
    setDepartModal(null);
    setDepartDate('');
    await loadContacts();
  }

  async function reactivateContact(c: Contact) {
    await fetch(`/api/manager/clients/${clientId}/contacts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true, left_company_at: null }),
    });
    await loadContacts();
  }

  async function saveTaskUpdate(taskId: string) {
    setSavingTask(taskId);
    const res = await fetch(`/api/portal/epr-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: taskStatus, notes: taskNote }),
    });
    if (res.ok) {
      trackEvent('Manager EPR Task Updated', { status: taskStatus });
      setEprTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: taskStatus, notes: taskNote } : t
      ));
      setExpandedTask(null); setTaskNote(''); setTaskStatus('');
    }
    setSavingTask(null);
  }

  async function updateFilingStatus(filingId: string, newStatus: string) {
    setUpdatingId(filingId);
    const res = await fetch(`/api/manager/filings/${filingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      trackEvent('Filing Status Updated', { new_status: newStatus });
      setFilings(prev => prev.map(f => f.id === filingId ? { ...f, current_status: newStatus } : f));
      setUpdateMsg({ id: filingId, ok: true, text: 'Status updated.' });
    } else {
      setUpdateMsg({ id: filingId, ok: false, text: data.error || 'Update failed.' });
    }
    setUpdatingId(null);
    setTimeout(() => setUpdateMsg(null), 3000);
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="space-y-4">
      <div className="h-7 w-48 rounded bg-slate-800 animate-pulse" />
      <div className="h-32 rounded-xl bg-slate-800/60 animate-pulse" />
      <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse" />
    </div>
  );

  /* ── Error ── */
  if (error || !client) return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-rose-300">{error || 'Client not found.'}</p>
      <Link href="/manager/clients" className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-300 transition">
        ← Back to clients
      </Link>
    </div>
  );

  const displayName = client.company_name || client.full_name || 'Unknown Client';
  const pendingFilings = filings.filter(f => !['Approved', 'Certificate Issued'].includes(f.current_status)).length;
  const overdueFilings = filings.filter(f => isOverdue(f.sla_due_at, f.current_status)).length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Link href="/manager/clients" className="hover:text-slate-400 transition">My Clients</Link>
        <span>/</span>
        <span className="text-slate-400">{displayName}</span>
      </div>

      {/* Client header */}
      <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-100">{displayName}</h1>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${CLIENT_STATUS_COLOR[client.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                {client.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
              {client.state && <span>{client.state}</span>}
              {client.gstin && <span>GSTIN: {client.gstin}</span>}
            </div>
            <div className="mt-3">
              <MessageClientButton clientId={client.id} clientName={displayName} />
            </div>
          </div>
          {/* Mini-stats */}
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-slate-100 tabular-nums">{filings.length}</div>
              <div className="text-[11px] text-slate-500">Filings</div>
            </div>
            {pendingFilings > 0 && (
              <div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">{pendingFilings}</div>
                <div className="text-[11px] text-slate-500">Pending</div>
              </div>
            )}
            {overdueFilings > 0 && (
              <div>
                <div className="text-lg font-bold text-rose-400 tabular-nums">{overdueFilings}</div>
                <div className="text-[11px] text-slate-500">Overdue</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800/70 overflow-x-auto">
        {([
          { key: 'overview',   label: 'Overview' },
          { key: 'filings',    label: `Filings (${filings.length})` },
          { key: 'documents',  label: `Documents (${documents.length})` },
          { key: 'epr_tasks',  label: `EPR Tasks${eprSummary ? ` (${eprSummary.total})` : ''}` },
          { key: 'team',       label: `Team${contacts.filter(c => c.is_active).length ? ` (${contacts.filter(c => c.is_active).length})` : ''}` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              tab === key
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Company Details</h3>
            {[
              ['Category', client.category],
              ['State', client.state],
              ['GSTIN', client.gstin],
              ['Onboarded', fmtDate(client.onboarded_date)],
              ['Renewal', fmtDate(client.renewal_date)],
              ['Health Score', client.health_score !== null ? String(client.health_score) : '—'],
              ['Waste Categories', (client.waste_categories ?? []).join(', ') || '—'],
            ].map(([label, val]) => val && (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 text-right max-w-[60%] truncate">{val}</span>
              </div>
            ))}
          </div>
          {client.notes && (
            <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Notes</h3>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Filings tab ── */}
      {tab === 'filings' && (
        <div className="space-y-2">
          {filings.length === 0 && (
            <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] px-6 py-8 text-center text-sm text-slate-600">
              No filings found for this client.
            </div>
          )}
          {filings.map((f) => {
            const over = isOverdue(f.sla_due_at, f.current_status);
            const msg = updateMsg?.id === f.id ? updateMsg : null;
            return (
              <div key={f.id} className={`rounded-xl border bg-[#0c1022] p-4 ${over ? 'border-rose-500/30' : 'border-slate-800/70'}`}>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-200">{f.category}</p>
                      {f.fy_label && <span className="text-[11px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">{f.fy_label}</span>}
                      {over && <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded px-1.5 py-0.5">OVERDUE</span>}
                    </div>
                    <div className="flex gap-3 mt-1 text-[11px] text-slate-500">
                      {f.sla_due_at && <span>SLA: {fmtDate(f.sla_due_at)}</span>}
                      <span>Updated: {fmtDate(f.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[f.current_status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                      {f.current_status}
                    </span>
                    {/* Status update dropdown */}
                    <select
                      value={f.current_status}
                      disabled={updatingId === f.id}
                      onChange={e => updateFilingStatus(f.id, e.target.value)}
                      className="h-7 rounded-md border border-slate-700/60 bg-slate-800 px-2 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                    >
                      {FILING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {updatingId === f.id && (
                      <svg className="h-4 w-4 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    )}
                  </div>
                </div>
                {msg && (
                  <p className={`mt-2 text-[11px] ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Documents tab ── */}
      {tab === 'documents' && (
        <div className="space-y-2">
          {documents.length === 0 && (
            <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] px-6 py-8 text-center text-sm text-slate-600">
              No documents uploaded yet.
            </div>
          )}
          {documents.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-800/70 bg-[#0c1022] p-4">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{d.document_name}</p>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-slate-500">
                    <span>{d.doc_type}</span>
                    <span>{d.category}</span>
                    {d.epr_financial_years?.label && <span>{d.epr_financial_years.label}</span>}
                    <span>Uploaded: {fmtDate(d.upload_date)}</span>
                  </div>
                  {d.admin_comment && (
                    <p className="text-[11px] text-slate-400 mt-1">Comment: {d.admin_comment}</p>
                  )}
                  {d.rejection_reason && (
                    <p className="text-[11px] text-rose-400 mt-1">Reason: {d.rejection_reason}</p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[d.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Team tab ── */}
      {tab === 'team' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Client Team Members</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Key contacts and decision-makers at {displayName}</p>
            </div>
            {!showAddContact && (
              <button onClick={openAddContact}
                className="h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-[11px] font-medium text-white transition flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
            )}
          </div>

          {/* Add / Edit form */}
          {showAddContact && (
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-teal-300">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <button onClick={() => { setShowAddContact(false); setEditingContact(null); }}
                  className="text-slate-500 hover:text-slate-300 transition text-lg leading-none">✕</button>
              </div>

              {/* Photo upload */}
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="h-16 w-16 rounded-full object-cover border-2 border-teal-500/30" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center">
                      <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="text-[11px] text-teal-400 hover:text-teal-300 transition font-medium">
                      {photoPreview ? 'Change photo' : 'Upload photo'}
                    </span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-600 mt-0.5">JPG, PNG, WebP — max 3MB</p>
                </div>
              </div>

              {/* Form fields grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Full Name <span className="text-rose-400">*</span></label>
                  <input value={contactForm.person_name} onChange={e => setContactForm(p => ({ ...p, person_name: e.target.value }))}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Designation</label>
                  <input value={contactForm.designation} onChange={e => setContactForm(p => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. Chief Compliance Officer"
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Department</label>
                  <select value={contactForm.department} onChange={e => setContactForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500">
                    <option value="">Select department</option>
                    {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Seniority */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Seniority Level</label>
                  <select value={contactForm.seniority_level} onChange={e => setContactForm(p => ({ ...p, seniority_level: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500">
                    <option value="">Select level</option>
                    {SENIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Email</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@company.com"
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Phone</label>
                  <input type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>

                {/* LinkedIn */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">LinkedIn URL</label>
                  <input value={contactForm.linkedin_url} onChange={e => setContactForm(p => ({ ...p, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Notes</label>
                  <textarea value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2} placeholder="Any relevant notes about this person…"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-800 px-3 py-2 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" />
                </div>
              </div>

              {contactMsg && (
                <p className={`text-[11px] ${contactMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{contactMsg.text}</p>
              )}

              <div className="flex gap-2">
                <button onClick={saveContact} disabled={savingContact || uploadingPhoto || !contactForm.person_name.trim()}
                  className="h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[11px] font-medium text-white transition disabled:opacity-50 flex items-center gap-1.5">
                  {(savingContact || uploadingPhoto) && (
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  )}
                  {uploadingPhoto ? 'Uploading…' : savingContact ? 'Saving…' : (editingContact ? 'Update Contact' : 'Add Contact')}
                </button>
                <button onClick={() => { setShowAddContact(false); setEditingContact(null); }}
                  className="h-8 px-4 rounded-lg border border-slate-700/40 text-[11px] text-slate-400 hover:text-slate-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {contactsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-slate-800/50 animate-pulse" />)}
            </div>
          )}

          {/* Empty state */}
          {!contactsLoading && contacts.filter(c => c.is_active).length === 0 && !showAddContact && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">No team members added yet</p>
              <p className="text-[11px] text-slate-600 mt-1 mb-4">Add key contacts from {displayName}</p>
              <button onClick={openAddContact}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[11px] font-medium text-white transition">
                + Add First Contact
              </button>
            </div>
          )}

          {/* Contact cards grid — active contacts only */}
          {!contactsLoading && contacts.filter(c => c.is_active).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.filter(c => c.is_active).map(c => (
                <div key={c.id} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 space-y-3">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    {c.photo_signed_url || c.photo_url ? (
                      <img
                        src={c.photo_signed_url ?? c.photo_url ?? ''}
                        alt={c.person_name}
                        className="h-12 w-12 rounded-full object-cover border border-slate-700/50 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-600/30 to-slate-700 border border-slate-700/50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-teal-300">
                          {c.person_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{c.person_name}</p>
                      {c.designation && <p className="text-[11px] text-slate-400 truncate">{c.designation}</p>}
                    </div>
                  </div>

                  {/* Department + seniority */}
                  <div className="flex flex-wrap gap-1">
                    {c.department && (
                      <span className="text-[10px] bg-slate-800 border border-slate-700/40 rounded px-1.5 py-0.5 text-slate-400">{c.department}</span>
                    )}
                    {c.seniority_level && (
                      <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 rounded px-1.5 py-0.5 text-teal-400">{c.seniority_level}</span>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-teal-300 transition truncate">
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-teal-300 transition">
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {c.phone}
                      </a>
                    )}
                    {c.linkedin_url && (
                      <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition">
                        <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-[10px] text-slate-500 italic leading-relaxed line-clamp-2">{c.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-slate-800/50">
                    <button onClick={() => openEditContact(c)}
                      className="text-[10px] text-slate-500 hover:text-teal-300 transition">Edit</button>
                    <button onClick={() => { setDepartModal(c); setDepartDate(''); }}
                      className="text-[10px] text-slate-500 hover:text-amber-400 transition">Mark Departed</button>
                    <button onClick={() => deleteContact(c.id)}
                      className="text-[10px] text-slate-500 hover:text-rose-400 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Departed / inactive contacts ── */}
          {contacts.filter(c => !c.is_active).length > 0 && (
            <div className="rounded-lg border border-slate-700/40 overflow-hidden">
              <button
                onClick={() => setShowInactiveContacts(p => !p)}
                className="flex w-full items-center justify-between px-3 py-2 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition"
              >
                <span>Departed Members ({contacts.filter(c => !c.is_active).length})</span>
                <span>{showInactiveContacts ? '▲' : '▼'}</span>
              </button>
              {showInactiveContacts && (
                <div className="divide-y divide-slate-800/40">
                  {contacts.filter(c => !c.is_active).map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 opacity-50">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-300 truncate">{c.person_name}</p>
                        <p className="text-[10px] text-slate-500">
                          {c.designation || '—'}{c.left_company_at ? ` · Left ${c.left_company_at}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => reactivateContact(c)}
                        className="shrink-0 text-[10px] text-slate-500 hover:text-teal-300 transition border border-slate-700/60 rounded px-2 py-0.5"
                      >
                        Re-activate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Depart confirmation modal ── */}
          {departModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700/60 p-5">
                <h3 className="text-sm font-semibold text-slate-200">Mark as Departed</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Mark <span className="font-medium text-slate-300">{departModal.person_name}</span> as having left this company.
                  Their intel panel record will be archived.
                </p>
                <div className="mt-3">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Date of departure (optional)</label>
                  <input
                    type="date"
                    value={departDate}
                    onChange={e => setDepartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={confirmDepart}
                    disabled={departSaving}
                    className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 transition"
                  >
                    {departSaving ? 'Saving…' : 'Confirm Departure'}
                  </button>
                  <button
                    onClick={() => { setDepartModal(null); setDepartDate(''); }}
                    className="flex-1 rounded-lg border border-slate-700/40 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EPR Tasks tab ── */}
      {tab === 'epr_tasks' && (
        <div className="space-y-4">
          {/* Header row: title + action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">FY 2026-27 EPR Compliance Tasks</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Annual compliance calendar — Apr 2026 to Jun 2027 (returns)</p>
            </div>
            <div className="flex items-center gap-2">
              {eprTasks.length > 0 && (
                <button
                  onClick={() => generateEprTasks(true)}
                  disabled={generating}
                  className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Working…' : '↺ Regenerate'}
                </button>
              )}
              {eprTasks.length === 0 && !eprLoading && (
                <button
                  onClick={() => generateEprTasks(false)}
                  disabled={generating}
                  className="h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[12px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {generating ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Generating…
                    </>
                  ) : '+ Generate Tasks'}
                </button>
              )}
            </div>
          </div>

          {/* Feedback banner */}
          {genMsg && (
            <div className={`rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between gap-2 ${
              genMsg.ok
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/5 text-rose-300'
            }`}>
              <span>{genMsg.text}</span>
              <button onClick={() => setGenMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Loading skeleton */}
          {eprLoading && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!eprLoading && eprTasks.length === 0 && !generating && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">No compliance tasks yet</p>
              <p className="text-[11px] text-slate-600 mt-1 mb-4">
                Generate tasks from the master template for FY 2026-27
              </p>
              {client.waste_categories && client.waste_categories.length > 0 ? (
                <button
                  onClick={() => generateEprTasks(false)}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[12px] font-medium text-white transition disabled:opacity-50"
                >
                  + Generate FY 2026-27 Tasks
                </button>
              ) : (
                <p className="text-[11px] text-amber-400/80 border border-amber-500/20 bg-amber-500/5 rounded-lg px-3 py-2 inline-block">
                  ⚠ Assign waste categories to this client first (in Overview tab)
                </p>
              )}
            </div>
          )}

          {/* Stats strip */}
          {!eprLoading && eprSummary && eprTasks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {([
                { label: 'Total',       val: eprSummary.total,       color: 'text-slate-200' },
                { label: 'Completed',   val: eprSummary.completed,   color: 'text-emerald-400' },
                { label: 'In Progress', val: eprSummary.in_progress, color: 'text-blue-400' },
                { label: 'Pending',     val: eprSummary.pending,     color: 'text-slate-400' },
                { label: 'Overdue',     val: eprSummary.overdue,     color: 'text-rose-400' },
              ] as const).map(({ label, val, color }) => (
                <div key={label} className="rounded-lg border border-slate-800/60 bg-[#0c1022] px-3 py-2.5 text-center">
                  <div className={`text-lg font-bold tabular-nums ${color}`}>{val ?? 0}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Task list */}
          {!eprLoading && eprTasks.length > 0 && (
            <EprTaskList
              tasks={eprTasks}
              expandedTask={expandedTask}
              setExpandedTask={(id) => {
                if (expandedTask === id) {
                  setExpandedTask(null); setTaskNote(''); setTaskStatus('');
                } else {
                  const t = eprTasks.find(x => x.id === id);
                  setExpandedTask(id);
                  setTaskNote(t?.notes ?? '');
                  setTaskStatus(t?.status ?? 'pending');
                }
              }}
              taskNote={taskNote}
              setTaskNote={setTaskNote}
              taskStatus={taskStatus}
              setTaskStatus={setTaskStatus}
              savingTask={savingTask}
              onSave={saveTaskUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── EPR Task List sub-component ───────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  plastic:    'Plastic Waste EPR',
  ewaste:     'E-Waste EPR',
  battery:    'Battery Waste EPR',
  tyre:       'Tyre Waste EPR',
  used_oil:   'Used Oil EPR',
  hazardous:  'Hazardous Waste',
  cd_waste:   'Construction & Demolition Waste',
  governance: 'Internal Corporate Governance',
};

const CATEGORY_COLOR: Record<string, string> = {
  plastic:    'text-blue-400 border-blue-500/20 bg-blue-500/5',
  ewaste:     'text-violet-400 border-violet-500/20 bg-violet-500/5',
  battery:    'text-amber-400 border-amber-500/20 bg-amber-500/5',
  tyre:       'text-orange-400 border-orange-500/20 bg-orange-500/5',
  used_oil:   'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
  hazardous:  'text-rose-400 border-rose-500/20 bg-rose-500/5',
  cd_waste:   'text-stone-400 border-stone-500/20 bg-stone-500/5',
  governance: 'text-teal-400 border-teal-500/20 bg-teal-500/5',
};

const TASK_STATUS_COLOR: Record<string, string> = {
  pending:     'bg-slate-700/50 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed:   'bg-emerald-500/20 text-emerald-300',
  overdue:     'bg-rose-500/20 text-rose-300',
  skipped:     'bg-slate-600/40 text-slate-500',
  na:          'bg-slate-700/30 text-slate-600',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-rose-400',
  high:     'text-amber-400',
  medium:   'text-blue-400',
  low:      'text-slate-500',
};

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'skipped',     label: 'Skipped' },
  { value: 'na',          label: 'N/A' },
];

interface EprTaskListProps {
  tasks: any[];
  expandedTask: string | null;
  setExpandedTask: (id: string) => void;
  taskNote: string;
  setTaskNote: (v: string) => void;
  taskStatus: string;
  setTaskStatus: (v: string) => void;
  savingTask: string | null;
  onSave: (id: string) => void;
}

function EprTaskList({
  tasks, expandedTask, setExpandedTask,
  taskNote, setTaskNote, taskStatus, setTaskStatus,
  savingTask, onSave,
}: EprTaskListProps) {
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const t of tasks) {
    const cat = t.waste_category ?? 'governance';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }

  const categoryOrder = ['plastic','ewaste','battery','tyre','used_oil','hazardous','cd_waste','governance'];
  const sortedCats = categoryOrder.filter(c => grouped[c]);

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const statusLabel = (s: string) =>
    s === 'in_progress' ? 'In Progress' : s === 'na' ? 'N/A' : s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending';

  const totalOverdue = tasks.filter(t => t.status === 'overdue').length;

  return (
    <div className="space-y-3">
      {/* Toolbar: status filter + collapse-all */}
      <div className="flex flex-wrap items-center gap-2">
        {(['', 'pending', 'in_progress', 'completed', 'overdue'] as const).map(s => (
          <button
            key={s || 'all'}
            onClick={() => setFilterStatus(s)}
            className={`h-7 px-3 rounded-full text-[11px] font-medium transition border ${
              filterStatus === s
                ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'
            }`}
          >
            {s === '' ? `All (${tasks.length})` : statusLabel(s)}
          </button>
        ))}
        <button
          onClick={() => setCollapsedCats(collapsedCats.size ? new Set() : new Set(sortedCats))}
          className="ml-auto h-7 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition"
        >
          {collapsedCats.size ? 'Expand all' : 'Collapse all'}
        </button>
      </div>

      {totalOverdue > 0 && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-[11px] text-rose-300 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
          {totalOverdue} task{totalOverdue !== 1 ? 's are' : ' is'} overdue — update status or add a note
        </div>
      )}

      {sortedCats.map(cat => {
        const allCatTasks = grouped[cat];
        const catTasks    = filterStatus ? allCatTasks.filter(t => t.status === filterStatus) : allCatTasks;
        if (!catTasks.length) return null;

        const catDone    = allCatTasks.filter(t => t.status === 'completed').length;
        const catOver    = allCatTasks.filter(t => t.status === 'overdue').length;
        const catColor   = CATEGORY_COLOR[cat] ?? 'text-slate-400 border-slate-700/20 bg-slate-800/20';
        const isCollapsed = collapsedCats.has(cat);
        const pct         = allCatTasks.length ? Math.round((catDone / allCatTasks.length) * 100) : 0;

        return (
          <div key={cat} className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
            {/* Category header — click to collapse */}
            <button
              type="button"
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/20 transition text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${catColor}`}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">{catDone}/{allCatTasks.length}</span>
                {catOver > 0 && (
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded px-1.5 py-0.5">
                    {catOver} overdue
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Progress bar */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500/70 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-600 tabular-nums w-7 text-right">{pct}%</span>
                </div>
                <svg
                  className={`h-3.5 w-3.5 text-slate-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Tasks */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-800/40">
                {catTasks.map((t: any) => {
                  const isExpanded    = expandedTask === t.id;
                  const isOverdueTask = t.status === 'overdue';

                  return (
                    <div key={t.id}>
                      {/* Task row — 2-line layout */}
                      <button
                        type="button"
                        onClick={() => setExpandedTask(t.id)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-800/30 transition ${isExpanded ? 'bg-slate-800/20' : ''}`}
                      >
                        {/* Line 1: dot + title + status badge + chevron */}
                        <div className="flex items-center gap-2">
                          <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${
                            t.priority === 'critical' ? 'bg-rose-400' :
                            t.priority === 'high'     ? 'bg-amber-400' :
                            t.priority === 'medium'   ? 'bg-blue-400'  : 'bg-slate-600'
                          }`} />
                          <span className={`flex-1 min-w-0 text-xs font-medium truncate ${isOverdueTask ? 'text-rose-300' : 'text-slate-200'}`}>
                            {t.title}
                          </span>
                          <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${TASK_STATUS_COLOR[t.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                            {statusLabel(t.status)}
                          </span>
                          <svg
                            className={`shrink-0 h-3 w-3 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {/* Line 2: period + due date + dept */}
                        <div className="flex items-center gap-3 mt-1 pl-3.5">
                          {t.period_label && (
                            <span className="text-[10px] text-slate-600">{t.period_label}</span>
                          )}
                          <span className={`text-[10px] tabular-nums ${isOverdueTask ? 'text-rose-400' : 'text-slate-500'}`}>
                            Due: {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                          </span>
                          {t.responsible_dept && (
                            <span className="hidden md:inline text-[10px] text-slate-600 border border-slate-700/30 rounded px-1.5 py-0">
                              {t.responsible_dept}
                            </span>
                          )}
                          <span className={`text-[10px] capitalize ${PRIORITY_COLOR[t.priority] ?? 'text-slate-600'}`}>
                            {t.priority}
                          </span>
                        </div>
                      </button>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 bg-slate-900/30 border-t border-slate-800/40 space-y-3">
                          {t.description && (
                            <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>
                          )}

                          {t.frequency && (
                            <span className="inline-block text-[10px] text-slate-500 border border-slate-700/40 rounded px-1.5 py-0.5 capitalize">
                              {t.frequency.replace(/_/g, ' ')}
                            </span>
                          )}

                          {/* Update form */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select
                              value={taskStatus}
                              onChange={e => setTaskStatus(e.target.value)}
                              className="h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={taskNote}
                              onChange={e => setTaskNote(e.target.value)}
                              placeholder="Add a note (optional)…"
                              className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button
                              onClick={() => onSave(t.id)}
                              disabled={savingTask === t.id}
                              className="h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[11px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                            >
                              {savingTask === t.id ? (
                                <>
                                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  Saving
                                </>
                              ) : 'Save'}
                            </button>
                          </div>

                          {t.notes && t.notes !== taskNote && (
                            <p className="text-[11px] text-slate-500 italic">Previous note: {t.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
