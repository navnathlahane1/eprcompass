'use client';

import { useState, useEffect, useCallback } from 'react';

const WASTE_CATEGORIES = [
  { value: 'plastic', label: 'Plastic' },
  { value: 'ewaste', label: 'E-Waste' },
  { value: 'battery', label: 'Battery' },
  { value: 'tyre', label: 'Tyre' },
  { value: 'oil', label: 'Oil' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_BADGE: Record<string, string> = {
  plastic: 'bg-blue-900/30 text-blue-300',
  ewaste: 'bg-violet-900/30 text-purple-800',
  battery: 'bg-amber-900/30 text-amber-200',
  tyre: 'bg-slate-900 text-slate-200',
  oil: 'bg-orange-900/30 text-orange-800',
  other: 'bg-slate-100 text-slate-700',
};

interface Credential {
  id: string;
  client_id: string;
  client_name: string;
  waste_category: string;
  cpcb_login_link: string | null;
  username: string | null;
  password: string | null;
  otp_receiver: string | null;
  last_changed_date: string | null;
  comment: string | null;
  pending_edit: Record<string, any> | null;
  pending_status: string | null;
  pending_requested_at: string | null;
  created_at: string;
}

interface ClientOption { id: string; label: string; email: string }

const EMPTY_FORM = {
  client_id: '',
  waste_category: 'plastic',
  cpcb_login_link: '',
  username: '',
  password: '',
  otp_receiver: '',
  last_changed_date: '',
  comment: '',
};

function mask(val: string | null) {
  if (!val) return '—';
  return '•'.repeat(Math.min(val.length, 10));
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EprCredentialsAdminClient() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<Credential | null>(null);
  const [approveRow, setApproveRow] = useState<Credential | null>(null);
  const [deleteRow, setDeleteRow] = useState<Credential | null>(null);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    const p = new URLSearchParams();
    if (filterClient) p.set('client_id', filterClient);
    if (pendingOnly) p.set('pending', 'true');

    const [credsRes, clientsRes] = await Promise.all([
      fetch(`/api/admin/epr-credentials?${p}`),
      fetch('/api/admin/epr-credentials?list_clients=true'),
    ]);

    if (!credsRes.ok) { setError('Failed to load credentials'); setLoading(false); return; }
    const credsData = await credsRes.json();
    setCreds(credsData.credentials || []);

    if (clientsRes.ok) {
      const cd = await clientsRes.json();
      setClients(cd.clients || []);
    }
    setLoading(false);
  }, [filterClient, pendingOnly]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCreds = filterCategory
    ? creds.filter(c => c.waste_category === filterCategory)
    : creds;

  // -- Create --
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch('/api/admin/epr-credentials', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); showToast('error', d.error || 'Failed to create'); return; }
    showToast('success', 'Credential created');
    setAddOpen(false); setForm({ ...EMPTY_FORM }); loadData();
  }

  // -- Update (admin edit) --
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault(); if (!editRow) return; setSaving(true);
    const res = await fetch('/api/admin/epr-credentials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editRow.id, ...form }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); showToast('error', d.error || 'Failed to update'); return; }
    showToast('success', 'Credential updated');
    setEditRow(null); loadData();
  }

  // -- Approve --
  async function handleApprove() {
    if (!approveRow) return; setSaving(true);
    const res = await fetch('/api/admin/epr-credentials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: approveRow.id, action: 'approve' }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); showToast('error', d.error || 'Failed to approve'); return; }
    showToast('success', 'Changes approved and applied');
    setApproveRow(null); loadData();
  }

  // -- Reject --
  async function handleReject() {
    if (!approveRow) return; setSaving(true);
    const res = await fetch('/api/admin/epr-credentials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: approveRow.id, action: 'reject' }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); showToast('error', d.error || 'Failed to reject'); return; }
    showToast('success', 'Proposed changes rejected');
    setApproveRow(null); loadData();
  }

  // -- Delete --
  async function handleDelete() {
    if (!deleteRow) return; setSaving(true);
    const res = await fetch('/api/admin/epr-credentials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteRow.id }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); showToast('error', d.error || 'Failed to delete'); return; }
    showToast('success', 'Credential deleted');
    setDeleteRow(null); loadData();
  }

  function openEdit(row: Credential) {
    setForm({
      client_id: row.client_id,
      waste_category: row.waste_category,
      cpcb_login_link: row.cpcb_login_link || '',
      username: row.username || '',
      password: row.password || '',
      otp_receiver: row.otp_receiver || '',
      last_changed_date: row.last_changed_date || '',
      comment: row.comment || '',
    });
    setEditRow(row);
  }

  const pendingCount = creds.filter(c => c.pending_status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Client EPR Credentials</h1>
          <p className="mt-1 text-sm text-slate-400">Manage CPCB portal credentials for each client. Clients can propose edits which require your approval.</p>
        </div>
        <button
          onClick={() => { setForm({ ...EMPTY_FORM }); setAddOpen(true); }}
          className="inline-flex items-center gap-2 btn-primary"
        >
          <span>+ Add Credential</span>
        </button>
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3">
          <span className="text-amber-300 text-sm font-medium">
            ⚠ {pendingCount} credential{pendingCount > 1 ? 's have' : ' has'} pending client-proposed changes awaiting your approval.
          </span>
          <button
            onClick={() => setPendingOnly(!pendingOnly)}
            className="ml-auto rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
          >
            {pendingOnly ? 'Show All' : 'Show Pending Only'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="input min-w-[200px]"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input"
        >
          <option value="">All Categories</option>
          {WASTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button
          onClick={loadData}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading credentials…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : filteredCreds.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No credentials found. Add the first one using the button above.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">CPCB Login</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">OTP Receiver</th>
                <th className="px-4 py-3">Last Changed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCreds.map(row => (
                <tr key={row.id} className={`border-b border-slate-800/60 ${row.pending_status === 'pending' ? 'bg-amber-900/20' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-100">{row.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${CATEGORY_BADGE[row.waste_category] || 'bg-slate-900 text-slate-200'}`}>
                      {row.waste_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[160px] truncate">
                    {row.cpcb_login_link
                      ? <a href={row.cpcb_login_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">{row.cpcb_login_link}</a>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-200">{row.username || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-200">
                        {showPasswordId === row.id ? (row.password || '—') : mask(row.password)}
                      </span>
                      {row.password && (
                        <button
                          onClick={() => setShowPasswordId(showPasswordId === row.id ? null : row.id)}
                          className="text-xs text-slate-500 hover:text-slate-100"
                          aria-label={showPasswordId === row.id ? 'Hide password' : 'Show password'}
                        >
                          {showPasswordId === row.id ? '🙈' : '👁'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{row.otp_receiver || '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{fmtDate(row.last_changed_date)}</td>
                  <td className="px-4 py-3">
                    {row.pending_status === 'pending' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Pending Approval</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.pending_status === 'pending' && (
                        <button
                          onClick={() => setApproveRow(row)}
                          className="rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(row)}
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-950"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteRow(row)}
                        className="rounded-md border border-rose-800/40 px-2 py-1 text-xs font-medium text-rose-400 hover:bg-rose-950/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Add Modal ── */}
      {addOpen && (
        <CredentialModal
          title="Add EPR Credential"
          form={form}
          setForm={setForm}
          clients={clients}
          showClientSelect
          saving={saving}
          onSubmit={handleCreate}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* ── Edit Modal ── */}
      {editRow && (
        <CredentialModal
          title={`Edit — ${editRow.client_name} / ${editRow.waste_category}`}
          form={form}
          setForm={setForm}
          clients={clients}
          showClientSelect={false}
          saving={saving}
          onSubmit={handleUpdate}
          onClose={() => setEditRow(null)}
        />
      )}

      {/* ── Approve Modal ── */}
      {approveRow && (
        <ApprovalModal
          row={approveRow}
          saving={saving}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setApproveRow(null)}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-100">Delete Credential?</h2>
            <p className="mt-2 text-sm text-slate-400">
              This will permanently delete the {deleteRow.waste_category} credential for <strong>{deleteRow.client_name}</strong>. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setDeleteRow(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="btn-danger">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Credential Form Modal (Add / Edit)
// ─────────────────────────────────────────────
function CredentialModal({
  title, form, setForm, clients, showClientSelect, saving, onSubmit, onClose,
}: {
  title: string;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  clients: ClientOption[];
  showClientSelect: boolean;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-400 text-xl leading-none">×</button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {showClientSelect && (
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Client *</label>
              <select
                required
                value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
              >
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.label} ({c.email})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">EPR Waste Category *</label>
            <select
              required
              value={form.waste_category}
              onChange={e => setForm(f => ({ ...f, waste_category: e.target.value }))}
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {WASTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">CPCB Login Link</label>
            <input
              type="url"
              value={form.cpcb_login_link}
              onChange={e => setForm(f => ({ ...f, cpcb_login_link: e.target.value }))}
              placeholder="https://eprplan.cpcb.gov.in/…"
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Password</label>
              <div className="flex gap-1">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm font-mono"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="px-2 text-slate-500 hover:text-slate-100">
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">OTP Receiver (email/phone)</label>
              <input
                type="text"
                value={form.otp_receiver}
                onChange={e => setForm(f => ({ ...f, otp_receiver: e.target.value }))}
                placeholder="+91 9000000000"
                className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Last Changed Date</label>
              <input
                type="date"
                value={form.last_changed_date}
                onChange={e => setForm(f => ({ ...f, last_changed_date: e.target.value }))}
                className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">Comment</label>
            <textarea
              rows={2}
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Approval Modal — old (red) vs new (green)
// ─────────────────────────────────────────────
function ApprovalModal({ row, saving, onApprove, onReject, onClose }: {
  row: Credential;
  saving: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const pe = row.pending_edit || {};
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const fields: Array<{ key: string; label: string }> = [
    { key: 'waste_category', label: 'EPR Category' },
    { key: 'cpcb_login_link', label: 'CPCB Login Link' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password' },
    { key: 'otp_receiver', label: 'OTP Receiver' },
    { key: 'last_changed_date', label: 'Last Changed Date' },
    { key: 'comment', label: 'Comment' },
  ];

  function displayVal(val: any, key: string, isPw: boolean, showPw: boolean) {
    if (val == null || val === '') return <span className="text-slate-500 italic">—</span>;
    if (key === 'password') {
      return (
        <span className="flex items-center gap-1">
          <span className="font-mono">{showPw ? String(val) : '•'.repeat(Math.min(String(val).length, 10))}</span>
          <button onClick={isPw ? () => setShowOldPw(!showOldPw) : () => setShowNewPw(!showNewPw)} className="text-xs text-slate-500 hover:text-slate-100">
            {showPw ? '🙈' : '👁'}
          </button>
        </span>
      );
    }
    if (key === 'cpcb_login_link') return <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline truncate">{String(val)}</a>;
    return <span>{String(val)}</span>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Review Proposed Changes</h2>
            <p className="text-xs text-slate-500 mt-0.5">{row.client_name} — requested {row.pending_requested_at ? new Date(row.pending_requested_at).toLocaleString('en-IN') : '—'}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-400 text-xl">×</button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-2 text-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Field</div>
            <div className="rounded bg-rose-950/30 px-2 py-1 text-xs font-semibold text-rose-300">Current (will be replaced)</div>
            <div className="rounded bg-emerald-950/30 px-2 py-1 text-xs font-semibold text-emerald-300">Proposed (new)</div>
            {fields.map(({ key, label }) => {
              const oldVal = (row as any)[key];
              const newVal = pe[key];
              const changed = newVal !== undefined && String(newVal ?? '') !== String(oldVal ?? '');
              return (
                <>
                  <div key={`${key}-label`} className={`py-1 text-xs font-medium ${changed ? 'text-slate-100' : 'text-slate-500'}`}>{label}</div>
                  <div key={`${key}-old`} className={`rounded px-2 py-1 text-xs ${changed ? 'bg-rose-950/30 text-rose-300' : 'text-slate-500'}`}>
                    {displayVal(oldVal, key, true, showOldPw)}
                  </div>
                  <div key={`${key}-new`} className={`rounded px-2 py-1 text-xs ${changed ? 'bg-emerald-950/30 text-emerald-300 font-medium' : 'text-slate-500'}`}>
                    {newVal !== undefined ? displayVal(newVal, key, false, showNewPw) : <span className="italic text-slate-500">unchanged</span>}
                  </div>
                </>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500">On approval: the current values (red) will be replaced by the proposed values (green). The old password will be permanently deleted from the system.</p>
          <div className="mt-5 flex gap-3 justify-end">
            <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">Cancel</button>
            <button onClick={onReject} disabled={saving} className="rounded-lg border border-rose-700/50 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/30 disabled:opacity-60">
              {saving ? '…' : 'Reject Changes'}
            </button>
            <button onClick={onApprove} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'Approving…' : 'Approve & Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
