'use client';

import { useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';

interface Props {
  initialData: {
    full_name: string | null;
    phone: string | null;
    state: string | null;
    email: string;
    role: string;
    created_at: string | null;
  };
}

export default function ManagerProfileClient({ initialData }: Props) {
  const [fullName, setFullName] = useState(initialData.full_name ?? '');
  const [phone, setPhone] = useState(initialData.phone ?? '');
  const [state, setState] = useState(initialData.state ?? '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, state }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to save');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const memberSince = initialData.created_at
    ? new Date(initialData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header card */}
      <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600/20 text-xl font-bold text-teal-400">
          {(fullName || initialData.email)[0]?.toUpperCase() ?? 'M'}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">{fullName || 'No name set'}</h1>
          <p className="text-sm text-slate-400">{initialData.email}</p>
          <span className="mt-1 inline-block rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400">
            Compliance Manager
          </span>
        </div>
      </div>

      {/* Editable form */}
      <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">Personal Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">State</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select state</option>
              {INDIA_STATES_UTS.map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {status === 'success' && (
            <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-400">
              Profile updated successfully.
            </p>
          )}
          {status === 'error' && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2 text-sm font-medium text-white transition"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Read-only info */}
      <div className="rounded-xl border border-slate-700 bg-[#0c1022] p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">Account Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
            <p className="mt-1 text-sm text-slate-300">{initialData.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</p>
            <p className="mt-1 text-sm text-slate-300">Compliance Manager</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Member Since</p>
            <p className="mt-1 text-sm text-slate-300">{memberSince}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
