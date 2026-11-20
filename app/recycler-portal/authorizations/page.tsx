'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Authorization {
  id: string;
  auth_type: string;
  authority_name: string | null;
  reference_no: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  renewal_reminder_days: number;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PENDING_RENEWAL' | 'NA';
  daysLeft: number | null;
  notes: string | null;
}

interface Summary { active: number; expiring: number; expired: number; }

const AUTH_TYPES = [
  'CPCB EPR Registration',
  'SPCB Consent to Operate (CTO)',
  'SPCB Consent to Establish (CTE)',
  'Hazardous Waste Authorization',
  'Factory Licence',
  'Fire NOC',
  'GST Registration',
  'Pollution Insurance',
  'Other',
];

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  EXPIRING: 'bg-amber-100 text-amber-800 border-amber-300',
  EXPIRED: 'bg-red-100 text-red-800 border-red-300',
  PENDING_RENEWAL: 'bg-purple-100 text-purple-800 border-purple-300',
  NA: 'bg-gray-100 text-gray-500 border-gray-300',
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

const EMPTY = { auth_type: '', authority_name: '', reference_no: '', issue_date: '', expiry_date: '', document_url: '', renewal_reminder_days: '60', notes: '' };

export default function AuthorizationsPage() {
  const [auths, setAuths] = useState<Authorization[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Authorization | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/authorizations').then(r => r.json())
      .then(d => { setAuths(d.authorizations ?? []); setSummary(d.summary ?? null); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setErr(''); setOpen(true); }
  function openEdit(a: Authorization) {
    setEditing(a);
    setForm({
      auth_type: a.auth_type, authority_name: a.authority_name ?? '', reference_no: a.reference_no ?? '',
      issue_date: a.issue_date ?? '', expiry_date: a.expiry_date ?? '', document_url: a.document_url ?? '',
      renewal_reminder_days: String(a.renewal_reminder_days ?? 60), notes: a.notes ?? '',
    });
    setErr(''); setOpen(true);
  }

  async function save() {
    if (!form.auth_type) { setErr('Select an authorization type'); return; }
    setSaving(true); setErr('');
    try {
      const url = editing ? `/api/recycler-portal/authorizations/${editing.id}` : '/api/recycler-portal/authorizations';
      const r = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed'); return; }
      trackEvent('Recycler Authorization Saved', { auth_type: form.auth_type, is_new: !editing });
      setOpen(false); load();
    } finally { setSaving(false); }
  }

  async function markRenewal(a: Authorization) {
    await fetch(`/api/recycler-portal/authorizations/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PENDING_RENEWAL' }) });
    trackEvent('Recycler Authorization Marked For Renewal', {});
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/recycler-portal/authorizations/${id}`, { method: 'DELETE' });
    trackEvent('Recycler Authorization Removed', {});
    setAuths(prev => prev.filter(a => a.id !== id));
  }

  const expiringOrExpired = auths.filter(a => a.status === 'EXPIRING' || a.status === 'EXPIRED');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statutory Authorizations</h1>
          <p className="text-sm text-gray-500 mt-1">Track every licence and consent — CPCB, SPCB (CTO/CTE), hazardous waste, factory licence — and never miss a renewal.</p>
        </div>
        <button onClick={openAdd} className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">+ Add Authorization</button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Active</p><p className="text-3xl font-bold text-green-600 mt-1">{summary.active}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Expiring Soon</p><p className="text-3xl font-bold text-amber-600 mt-1">{summary.expiring}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Expired</p><p className="text-3xl font-bold text-red-600 mt-1">{summary.expired}</p></div>
        </div>
      )}

      {/* Renewal alerts */}
      {expiringOrExpired.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Renewal Attention Needed</p>
          <ul className="space-y-1">
            {expiringOrExpired.map(a => (
              <li key={a.id} className="text-xs text-amber-700">
                <strong>{a.auth_type}</strong> — {a.status === 'EXPIRED' ? `expired ${Math.abs(a.daysLeft ?? 0)} days ago` : `expires in ${a.daysLeft} days`} ({fmt(a.expiry_date)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : auths.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-gray-700">No authorizations recorded</p>
          <p className="text-xs text-gray-400 mt-1">Add your CPCB registration, SPCB consents, and other statutory licences to track renewals.</p>
          <button onClick={openAdd} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Add First Authorization</button>
        </div>
      ) : (
        <div className="space-y-3">
          {auths.map(a => (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{a.auth_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[a.status]}`}>
                      {a.status === 'PENDING_RENEWAL' ? 'Renewal In Progress' : a.status === 'NA' ? 'No Expiry' : a.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {a.authority_name && `${a.authority_name} · `}{a.reference_no && `Ref: ${a.reference_no} · `}
                    Issued {fmt(a.issue_date)} · Expires {fmt(a.expiry_date)}
                    {a.daysLeft != null && a.status !== 'NA' && ` (${a.daysLeft >= 0 ? `${a.daysLeft}d left` : `${Math.abs(a.daysLeft)}d overdue`})`}
                  </p>
                  {a.document_url && <a href={a.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 underline mt-0.5 inline-block">View document ↗</a>}
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  {(a.status === 'EXPIRING' || a.status === 'EXPIRED') && (
                    <button onClick={() => markRenewal(a)} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700">Mark Renewing</button>
                  )}
                  <button onClick={() => openEdit(a)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                  <button onClick={() => remove(a.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{editing ? 'Edit' : 'Add'} Authorization</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Authorization Type *</label><select value={form.auth_type} onChange={e => setForm((f: any) => ({ ...f, auth_type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select…</option>{AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Issuing Authority</label><input value={form.authority_name} onChange={e => setForm((f: any) => ({ ...f, authority_name: e.target.value }))} placeholder="e.g. MPCB" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Reference No.</label><input value={form.reference_no} onChange={e => setForm((f: any) => ({ ...f, reference_no: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date</label><input type="date" value={form.issue_date} onChange={e => setForm((f: any) => ({ ...f, issue_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label><input type="date" value={form.expiry_date} onChange={e => setForm((f: any) => ({ ...f, expiry_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Reminder (days before)</label><input type="number" value={form.renewal_reminder_days} onChange={e => setForm((f: any) => ({ ...f, renewal_reminder_days: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Document URL</label><input value={form.document_url} onChange={e => setForm((f: any) => ({ ...f, document_url: e.target.value }))} placeholder="https://…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" /></div>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
