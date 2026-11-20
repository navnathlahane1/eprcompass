'use client';

import { useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';

interface Props {
  profile: { full_name: string | null; phone: string | null; state: string | null };
  email: string;
  memberSince: string;
}

export default function ManagerProfileClient({ profile, email, memberSince }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [phone, setPhone]       = useState(profile.phone ?? '');
  const [state, setState]       = useState(profile.state ?? '');
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState<'idle' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg]     = useState('');

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, state }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || 'Failed to save'); setStatus('error'); }
      else setStatus('success');
    } catch {
      setErrMsg('Network error'); setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400';

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600/20 text-xl font-bold text-teal-400">
            {(fullName || email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-100">{fullName || '—'}</p>
            <p className="text-xs text-slate-400">{email}</p>
            <span className="mt-1 inline-block rounded-full bg-teal-600/20 px-2 py-0.5 text-[11px] font-semibold text-teal-400">
              Compliance Manager
            </span>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Personal Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98000 00000" />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <select className={inputCls} value={state} onChange={e => setState(e.target.value)}>
              <option value="">Select state</option>
              {INDIA_STATES_UTS.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Read-only info */}
      <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Account Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className={labelCls}>Email</p>
            <p className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-400">{email}</p>
          </div>
          <div>
            <p className={labelCls}>Role</p>
            <p className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-400">Compliance Manager</p>
          </div>
          <div>
            <p className={labelCls}>Member Since</p>
            <p className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-400">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {status === 'success' && <span className="text-sm text-emerald-400">Profile saved successfully.</span>}
        {status === 'error'   && <span className="text-sm text-red-400">{errMsg}</span>}
      </div>
    </div>
  );
}
