'use client';

import { useEffect, useMemo, useState } from 'react';

type UserRequest = {
  id: string;
  role: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  notes: string | null;
  status: 'pending' | 'fulfilled' | 'rejected';
  rejection_reason: string | null;
  handled_by_name: string | null;
  handled_at: string | null;
  created_at: string;
};

const REQUESTABLE_ROLES = [
  { value: 'trainer',         label: 'Trainer',         desc: 'Delivers sessions, owns LMS & assessments' },
  { value: 'guest_trainer',   label: 'Guest Trainer',   desc: 'Limited to assigned sessions' },
  { value: 'academy_manager', label: 'Academy Manager', desc: 'Manages programs, trainers & registrations' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  trainer: 'Trainer',
  guest_trainer: 'Guest Trainer',
  academy_manager: 'Academy Manager',
};

const STATUS_PILL: Record<string, string> = {
  pending:   'border-amber-500/30 bg-amber-500/10 text-amber-300',
  fulfilled: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rejected:  'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

const EMPTY_FORM = {
  role: 'trainer',
  full_name: '',
  email: '',
  phone: '',
  company_name: '',
  notes: '',
};

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AcademyUserRequestsPage() {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  async function load() {
    try {
      const res = await fetch('/api/academy/user-requests');
      const json = await res.json();
      if (res.ok) setRequests(json.requests ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/academy/user-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to submit request'); return; }
      setSuccess('Request sent to the IAM team. You’ll be notified once it’s actioned.');
      setForm({ ...EMPTY_FORM });
      setRequests(prev => [json.request, ...prev]);
    } catch {
      setError('Failed to submit request');
    } finally {
      setSaving(false);
    }
  }

  const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Request New Academy Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask the IAM team to provision a Trainer, Guest Trainer or Academy Manager. Provide their
          details below — IAM will create the account and you&rsquo;ll be notified when it&rsquo;s ready.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Request form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-5">
          <p className="text-sm font-semibold text-slate-200">New request</p>

          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{success}</div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</label>
            <div className="space-y-2">
              {REQUESTABLE_ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`flex w-full flex-col rounded-lg border p-3 text-left transition ${
                    form.role === r.value
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <span className={`text-xs font-semibold ${form.role === r.value ? 'text-indigo-300' : 'text-slate-300'}`}>{r.label}</span>
                  <span className="text-[11px] text-slate-500">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Full Name *</label>
            <input
              type="text" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Priya Nair"
              className="w-full rounded-lg border border-white/10 bg-[#060910] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email *</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-white/10 bg-[#060910] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</label>
              <input
                type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 …"
                className="w-full rounded-lg border border-white/10 bg-[#060910] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Company</label>
              <input
                type="text" value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="(optional)"
                className="w-full rounded-lg border border-white/10 bg-[#060910] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes for IAM</label>
            <textarea
              value={form.notes} rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any context that helps IAM set up the account…"
              className="w-full rounded-lg border border-white/10 bg-[#060910] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Sending…' : 'Send Request to IAM'}
          </button>
        </form>

        {/* ── My requests ── */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">My requests</p>
            {pendingCount > 0 && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                {pendingCount} pending
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-10 text-center text-sm text-slate-500">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-10 text-center">
              <p className="text-sm font-medium text-slate-300">No requests yet</p>
              <p className="mt-1 text-xs text-slate-500">Submit the form to request a new academy user.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-200">{r.full_name}</p>
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                          {ROLE_LABELS[r.role] ?? r.role}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_PILL[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.notes && <p className="mt-2 text-xs text-slate-500">{r.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                    <span>Requested {fmtDate(r.created_at)}</span>
                    {r.status !== 'pending' && r.handled_by_name && (
                      <span>{r.status === 'fulfilled' ? 'Created' : 'Declined'} by {r.handled_by_name} · {fmtDate(r.handled_at)}</span>
                    )}
                  </div>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <p className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-300">
                      Reason: {r.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
