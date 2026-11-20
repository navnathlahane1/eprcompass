'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Member {
  id: string;
  full_name: string;
  email: string;
  member_role: string;
  phone: string | null;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';
  created_at: string;
}
interface Activity {
  id: string;
  actor_name: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

const ROLES = [
  { value: 'PLANT_MANAGER', label: 'Plant Manager', desc: 'Operations, traceability, collection & logistics' },
  { value: 'COMPLIANCE', label: 'Compliance', desc: 'Authorizations, CPCB returns, documents' },
  { value: 'FINANCE', label: 'Finance', desc: 'Invoices, credits, financing' },
  { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access' },
];
const ROLE_LABEL: Record<string, string> = { OWNER: 'Owner', PLANT_MANAGER: 'Plant Manager', COMPLIANCE: 'Compliance', FINANCE: 'Finance', VIEWER: 'Viewer' };

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  INVITED: 'bg-blue-100 text-blue-800 border-blue-300',
  SUSPENDED: 'bg-gray-100 text-gray-500 border-gray-300',
};

function initials(n: string) { return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function fmtDT(d: string) { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function actionLabel(a: string) { return a.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()); }

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [myRole, setMyRole] = useState('OWNER');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', member_role: 'PLANT_MANAGER', phone: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [credential, setCredential] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/team').then(r => r.json())
      .then(d => { setMembers(d.members ?? []); setActivity(d.activity ?? []); setMyRole(d.myRole ?? 'OWNER'); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const isOwner = myRole === 'OWNER';

  async function save() {
    if (!form.full_name.trim()) { setErr('Name is required'); return; }
    if (!form.email.trim()) { setErr('Email is required'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/recycler-portal/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed'); return; }
      trackEvent('Recycler Team Member Added', { role: form.member_role });
      setOpen(false);
      setForm({ full_name: '', email: '', member_role: 'PLANT_MANAGER', phone: '' });
      if (d.tempPassword) setCredential({ email: d.member.email, password: d.tempPassword });
      load();
    } finally { setSaving(false); }
  }

  async function setStatus(m: Member, status: string) {
    await fetch(`/api/recycler-portal/team/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    trackEvent('Recycler Team Member Status Changed', { status });
    load();
  }
  async function changeRole(m: Member, member_role: string) {
    await fetch(`/api/recycler-portal/team/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_role }) });
    trackEvent('Recycler Team Member Role Changed', { role: member_role });
    load();
  }
  async function remove(m: Member) {
    if (!confirm(`Remove ${m.full_name}? Their login will be revoked.`)) return;
    await fetch(`/api/recycler-portal/team/${m.id}`, { method: 'DELETE' });
    trackEvent('Recycler Team Member Removed', {});
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team &amp; Access</h1>
          <p className="text-sm text-gray-500 mt-1">Add colleagues with their own logins and scoped roles. All actions are logged.</p>
        </div>
        {isOwner && <button onClick={() => { setOpen(true); setErr(''); }} className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">+ Add Member</button>}
      </div>

      {!isOwner && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          You&apos;re signed in as <strong>{ROLE_LABEL[myRole] ?? myRole}</strong>. Only the account owner can manage team members.
        </div>
      )}

      {/* New credential banner */}
      {credential && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">Member added — share these login details securely:</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-white border border-green-200 px-3 py-2"><span className="text-xs text-gray-500">Email</span><p className="font-mono text-gray-900">{credential.email}</p></div>
            <div className="rounded-lg bg-white border border-green-200 px-3 py-2"><span className="text-xs text-gray-500">Temp Password</span><p className="font-mono text-gray-900">{credential.password}</p></div>
          </div>
          <p className="text-xs text-green-600 mt-2">They&apos;ll be asked to change this password on first login. This is shown only once.</p>
          <button onClick={() => setCredential(null)} className="mt-2 text-xs font-medium text-green-700 underline">Dismiss</button>
        </div>
      )}

      {/* Members */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {/* Owner row (implicit) */}
          {members.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">No additional members yet. {isOwner && 'Add your first team member.'}</div>
          )}
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-bold">{initials(m.full_name)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.full_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
              </div>
              {isOwner ? (
                <div className="flex items-center gap-2 shrink-0">
                  <select value={m.member_role} onChange={e => changeRole(m, e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  {m.status === 'ACTIVE'
                    ? <button onClick={() => setStatus(m, 'SUSPENDED')} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50">Suspend</button>
                    : <button onClick={() => setStatus(m, 'ACTIVE')} className="rounded-lg border border-green-200 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50">Activate</button>}
                  <button onClick={() => remove(m)} className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button>
                </div>
              ) : (
                <span className="text-xs font-medium text-gray-600 shrink-0">{ROLE_LABEL[m.member_role] ?? m.member_role}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Activity log */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Activity Log</h2>
        {activity.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center"><p className="text-sm text-gray-500">No activity recorded yet.</p></div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {activity.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-2 w-2 rounded-full bg-teal-400 shrink-0" />
                <p className="text-sm text-gray-700 flex-1 min-w-0"><span className="font-medium">{actionLabel(a.action)}</span>{a.detail && <span className="text-gray-500"> · {a.detail}</span>}</p>
                <p className="text-xs text-gray-400 shrink-0">{a.actor_name} · {fmtDT(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Add Team Member</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label><input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Role</label>
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${form.member_role === r.value ? 'border-teal-400 bg-teal-50' : 'border-gray-200'}`}>
                      <input type="radio" name="role" checked={form.member_role === r.value} onChange={() => setForm(f => ({ ...f, member_role: r.value }))} className="mt-0.5 accent-teal-600" />
                      <div><p className="text-sm font-medium text-gray-900">{r.label}</p><p className="text-xs text-gray-500">{r.desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Adding…' : 'Add Member'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
