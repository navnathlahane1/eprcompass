'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const WASTE_CATEGORY_LABELS: Record<string, string> = {
  plastic: 'Plastic',
  ewaste: 'E-Waste',
  battery: 'Battery',
  tyre: 'Tyre',
  oil: 'Oil',
  other: 'Other',
};

const CATEGORY_BADGE: Record<string, string> = {
  plastic: 'bg-blue-100 text-blue-800',
  ewaste: 'bg-purple-100 text-purple-800',
  battery: 'bg-yellow-100 text-yellow-800',
  tyre: 'bg-slate-100 text-slate-700',
  oil: 'bg-orange-100 text-orange-800',
  other: 'bg-slate-100 text-slate-700',
};

interface Credential {
  id: string;
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
  updated_at: string;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EprCredentialsClient() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  const [editRow, setEditRow] = useState<Credential | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Password reveal state per credential id
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const toggleReveal = (id: string) =>
    setRevealed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const loadCreds = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await fetch('/api/epr-credentials');
    if (!res.ok) { setError('Failed to load credentials'); setLoading(false); return; }
    const d = await res.json();
    setCreds(d.credentials || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCreds(); }, [loadCreds]);

  function openEdit(row: Credential) {
    setEditForm({
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

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault(); if (!editRow) return; setSaving(true);
    const res = await fetch('/api/epr-credentials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editRow.id, ...editForm }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      showToast('error', d.error || 'Failed to submit changes');
      return;
    }
    trackEvent('Client EPR Credential Change Proposed', {});
    showToast('success', 'Your changes have been submitted for admin approval');
    setEditRow(null); loadCreds();
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My EPR Credentials</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your CPCB portal login details managed by your compliance team. You can request changes — they take effect once approved.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your credentials…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">{error}</div>
      ) : creds.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No EPR credentials yet</p>
          <p className="mt-1 text-xs text-slate-500">Your compliance manager will add your CPCB login details here. Contact support if you need assistance.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {creds.map(row => (
            <CredentialCard
              key={row.id}
              row={row}
              revealed={revealed.has(row.id)}
              onToggleReveal={() => toggleReveal(row.id)}
              onEdit={() => openEdit(row)}
            />
          ))}
        </div>
      )}

      {/* ── Edit / Propose Modal ── */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Request Credential Update</h2>
                <p className="text-xs text-slate-500 mt-0.5">Changes require admin approval before taking effect.</p>
              </div>
              <button onClick={() => setEditRow(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <form onSubmit={handlePropose} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">CPCB Login Link</label>
                <input
                  type="url"
                  value={editForm.cpcb_login_link}
                  onChange={e => setEditForm(f => ({ ...f, cpcb_login_link: e.target.value }))}
                  placeholder="https://eprplan.cpcb.gov.in/…"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">OTP Receiver</label>
                  <input
                    type="text"
                    value={editForm.otp_receiver}
                    onChange={e => setEditForm(f => ({ ...f, otp_receiver: e.target.value }))}
                    placeholder="+91 9000000000"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Changed Date</label>
                  <input
                    type="date"
                    value={editForm.last_changed_date}
                    onChange={e => setEditForm(f => ({ ...f, last_changed_date: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Comment / Reason for Change</label>
                <textarea
                  rows={2}
                  value={editForm.comment}
                  onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditRow(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Submitting…' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Credential Card
// ─────────────────────────────────────────────
function CredentialCard({ row, revealed, onToggleReveal, onEdit }: {
  row: Credential;
  revealed: boolean;
  onToggleReveal: () => void;
  onEdit: () => void;
}) {
  const hasPending = row.pending_status === 'pending';
  const pe = row.pending_edit || {};

  return (
    <div className={`rounded-xl border bg-white ${hasPending ? 'border-amber-300' : 'border-slate-200'}`}>
      {/* Card header */}
      <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${hasPending ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-slate-50/60'}`}>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${CATEGORY_BADGE[row.waste_category] || 'bg-slate-100 text-slate-700'}`}>
          {WASTE_CATEGORY_LABELS[row.waste_category] || row.waste_category}
        </span>
        {hasPending ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            ⏳ Change Pending Admin Approval
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
        )}
        <div className="ml-auto">
          <button
            onClick={onEdit}
            disabled={hasPending}
            title={hasPending ? 'A change is already pending approval' : 'Request changes to this credential'}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Edit
          </button>
        </div>
      </div>

      {/* Current values */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="CPCB Login Link">
          {row.cpcb_login_link
            ? <a href={row.cpcb_login_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all text-sm">{row.cpcb_login_link}</a>
            : <span className="text-slate-400 text-sm">—</span>}
        </Field>
        <Field label="Username">
          <span className="text-sm text-slate-900">{row.username || '—'}</span>
        </Field>
        <Field label="Password">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-900">
              {revealed ? (row.password || '—') : (row.password ? '•'.repeat(Math.min(row.password.length, 10)) : '—')}
            </span>
            {row.password && (
              <button onClick={onToggleReveal} className="text-xs text-slate-500 hover:text-slate-800" aria-label={revealed ? 'Hide password' : 'Show password'}>
                {revealed ? '🙈' : '👁'}
              </button>
            )}
          </div>
        </Field>
        <Field label="OTP Receiver">
          <span className="text-sm text-slate-900">{row.otp_receiver || '—'}</span>
        </Field>
        <Field label="Last Changed">
          <span className="text-sm text-slate-900">{fmtDate(row.last_changed_date)}</span>
        </Field>
        {row.comment && (
          <Field label="Comment">
            <span className="text-sm text-slate-700">{row.comment}</span>
          </Field>
        )}
      </div>

      {/* Pending changes comparison */}
      {hasPending && (
        <div className="border-t border-amber-200 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-amber-800 uppercase tracking-wide">Your Proposed Changes (awaiting approval)</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(pe).map(([key, val]) => {
              if (val === null || val === undefined || val === '') return null;
              const oldVal = (row as any)[key];
              const changed = String(val) !== String(oldVal ?? '');
              if (!changed) return null;
              return (
                <div key={key} className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                  <div className="px-2 py-1 bg-slate-50 text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                  <div className="px-2 py-1 bg-red-50 text-red-700 line-through">
                    {key === 'password' ? '•'.repeat(10) : String(oldVal || '—')}
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-800 font-medium">
                    {key === 'password' ? '(new password set)' : String(val)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
      {children}
    </div>
  );
}
