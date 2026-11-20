'use client';

import { useEffect, useMemo, useState } from 'react';
import { ACADEMY_ROLE_LABELS } from '@/lib/academy/access';

type AcademyUser = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  role: string;
  is_banned: boolean;
  created_at: string | null;
  created_by: string | null;
  created_via_iam: boolean;
};

type ApiResponse = {
  users: AcademyUser[];
  total: number;
  countsByRole: Record<string, number>;
  recentCount: number;
};

const ROLE_ORDER = [
  'academy_director',
  'academy_manager',
  'training_program_manager',
  'trainer',
  'guest_trainer',
  'partner_trainer',
  'learner',
];

const ROLE_BADGE: Record<string, string> = {
  academy_director:         'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  academy_manager:          'bg-indigo-500/10 text-indigo-200 border-indigo-500/20',
  training_program_manager: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  trainer:                  'bg-violet-500/10 text-violet-200 border-violet-500/20',
  guest_trainer:            'bg-purple-500/15 text-purple-300 border-purple-500/30',
  partner_trainer:          'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  learner:                  'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function isNew(created_at: string | null): boolean {
  if (!created_at) return false;
  return Date.now() - new Date(created_at).getTime() < SEVEN_DAYS;
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AcademyTeamMembersPage() {
  const [data, setData]       = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/academy/team-members');
        const json = await res.json();
        if (!active) return;
        if (!res.ok) { setError(json.error || 'Failed to load academy users'); return; }
        setData(json);
      } catch {
        if (active) setError('Failed to load academy users');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.company_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [data, roleFilter, search]);

  const presentRoles = useMemo(() => {
    if (!data) return [];
    return ROLE_ORDER.filter(r => (data.countsByRole[r] ?? 0) > 0);
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Academy Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every account provisioned for the EPR Academy portal from the IAM portal, in one place.
            You&rsquo;re notified here whenever a new academy user is created.
          </p>
        </div>
        <a
          href="/academy/user-requests"
          className="shrink-0 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/25"
        >
          + Request New User
        </a>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
            <p className="mt-1 text-2xl font-bold text-white">{data.total}</p>
          </div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-400">New (7 days)</p>
            <p className="mt-1 text-2xl font-bold text-indigo-300">{data.recentCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Trainers</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {(data.countsByRole.trainer ?? 0) + (data.countsByRole.guest_trainer ?? 0) + (data.countsByRole.partner_trainer ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Managers</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {(data.countsByRole.academy_director ?? 0) + (data.countsByRole.academy_manager ?? 0) + (data.countsByRole.training_program_manager ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {data && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === 'all'
                ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({data.total})
          </button>
          {presentRoles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === r
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              {ACADEMY_ROLE_LABELS[r] ?? r} ({data.countsByRole[r] ?? 0})
            </button>
          ))}
          <div className="ml-auto">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, company…"
              className="w-56 rounded-lg border border-white/10 bg-[#0a0e1a] px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-12 text-center text-sm text-slate-500">
          Loading academy users…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-sm text-rose-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0e1a] p-12 text-center">
          <p className="text-sm font-medium text-slate-300">No academy users found</p>
          <p className="mt-1 text-xs text-slate-500">
            Users created from the IAM portal with an academy role will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e1a]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Added by</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-200">
                            {u.full_name || <span className="italic text-slate-500">No name</span>}
                          </p>
                          {isNew(u.created_at) && (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
                              New
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500">{u.email || '—'}</p>
                        {u.company_name && (
                          <p className="truncate text-[11px] text-slate-600">{u.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[u.role] ?? 'border-slate-700 text-slate-400'}`}>
                      {ACADEMY_ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {u.created_by || (u.created_via_iam ? 'IAM' : '—')}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="inline-flex rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        Active
                      </span>
                    )}
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
