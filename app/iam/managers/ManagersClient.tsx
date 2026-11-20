'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ManagerRow } from './page';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string | null) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (email ?? '?')[0].toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return (
    dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
}

// ─── Create Manager Panel ─────────────────────────────────────────────────────

interface CreatePanelProps {
  onCreated: (mgr: ManagerRow) => void;
  onClose: () => void;
}

function CreateManagerPanel({ onCreated, onClose }: CreatePanelProps) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isValid = form.email.trim() && form.password.length >= 8 && form.full_name.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/iam/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'manager' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create manager'); return; }

      onCreated({
        id: data.userId,
        full_name: form.full_name.trim() || null,
        company_name: null,
        phone: form.phone.trim() || null,
        email: form.email.trim().toLowerCase(),
        last_sign_in_at: null,
        created_at: new Date().toISOString(),
        is_banned: false,
        assigned_client_count: 0,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-[#0c1022] overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/20">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">New Compliance Manager</p>
            <p className="text-[11px] text-slate-500">Role is locked to Manager — grants Admin Panel access</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Priya Sharma"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Login Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="manager@company.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Temporary Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-9 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPw ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Role badge — locked */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2">
          <span className="rounded border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
            Manager
          </span>
          <span className="text-[11px] text-slate-500">Access to Admin Panel · Can be assigned to client companies</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin text-violet-300" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : 'Create Compliance Manager'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManagersClient({ initialManagers }: { initialManagers: ManagerRow[] }) {
  const [managers, setManagers] = useState<ManagerRow[]>(initialManagers);
  const [showCreate, setShowCreate] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null);

  function handleCreated(mgr: ManagerRow) {
    setManagers(prev => [mgr, ...prev]);
    setNewlyCreated(mgr.id);
    setShowCreate(false);
    setTimeout(() => setNewlyCreated(null), 4000);
  }

  const totalAssigned = managers.reduce((sum, m) => sum + m.assigned_client_count, 0);
  const activeCount = managers.filter(m => !m.is_banned).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Compliance Managers</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {managers.length} manager{managers.length !== 1 ? 's' : ''} · {totalAssigned} client{totalAssigned !== 1 ? 's' : ''} assigned
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Compliance Manager
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Managers', value: managers.length, color: 'text-slate-100' },
          { label: 'Active',         value: activeCount,     color: 'text-emerald-400' },
          { label: 'Clients Assigned', value: totalAssigned, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create panel (inline, slides in above the table) */}
      {showCreate && (
        <CreateManagerPanel
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* New-manager success flash */}
      {newlyCreated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Compliance manager account created. Link clients to this manager from{' '}
          <Link href="/iam/users?role=manager" className="font-semibold underline hover:text-emerald-200">
            Manage → Clients tab
          </Link>
          , or from the client side via its Manager tab.
        </div>
      )}

      {/* Table */}
      {managers.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-16 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto mb-3 h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No compliance managers yet</p>
          <p className="mt-1 text-xs text-slate-600">Click "New Compliance Manager" to create the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3 hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3">Clients</th>
                <th className="px-4 py-3 hidden lg:table-cell">Last Sign In</th>
                <th className="px-4 py-3 hidden lg:table-cell">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map(mgr => (
                <tr
                  key={mgr.id}
                  className={`border-b border-slate-800/40 transition-colors hover:bg-slate-800/20 ${
                    mgr.id === newlyCreated ? 'bg-emerald-500/5 border-emerald-500/20' : ''
                  } ${mgr.is_banned ? 'opacity-60' : ''}`}
                >
                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold select-none ${
                        mgr.is_banned ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {initials(mgr.full_name, mgr.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                          {mgr.full_name ?? <span className="italic text-slate-500">No name</span>}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{mgr.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-slate-400">{mgr.phone ?? '—'}</span>
                  </td>

                  {/* Assigned clients count */}
                  <td className="px-4 py-3">
                    {mgr.assigned_client_count > 0 ? (
                      <Link
                        href={`/iam/users?role=client`}
                        className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                      >
                        {mgr.assigned_client_count} client{mgr.assigned_client_count !== 1 ? 's' : ''}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600">None assigned</span>
                    )}
                  </td>

                  {/* Last sign in */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">{fmtDateTime(mgr.last_sign_in_at)}</span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">{fmtDate(mgr.created_at)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {mgr.is_banned ? (
                      <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/iam/users?role=manager&search=${encodeURIComponent(mgr.email ?? mgr.full_name ?? '')}`}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
