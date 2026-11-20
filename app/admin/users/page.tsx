'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/lib/toast/ToastContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusRow   { status: string; count: number; percentage: number; }
interface TopClient   { id: string; name: string; ltv: number; transaction_count: number; registration_date: string; }
interface TeamMember  {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const ROLE_OPTIONS = [
  'client', 'admin', 'manager', 'telecaller', 'sales-executive',
  'epr-executive', 'operator', 'hr-executive', 'training-executive',
] as const;

const ROLE_BADGE: Record<string, string> = {
  admin:               'bg-rose-900/30 text-rose-300',
  manager:             'bg-orange-900/30 text-orange-800',
  telecaller:          'bg-blue-900/30 text-blue-300',
  'sales-executive':   'bg-indigo-900/30 text-indigo-800',
  'epr-executive':     'bg-emerald-100 text-emerald-800',
  operator:            'bg-amber-900/30 text-amber-200',
  'hr-executive':      'bg-pink-100 text-pink-800',
  'training-executive':'bg-violet-900/30 text-purple-800',
  client:              'bg-slate-900 text-slate-400',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[role] || ROLE_BADGE.client}`}>
      {role}
    </span>
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30)  return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'clients' | 'team'>('clients');

  // ── Clients tab state ──────────────────────────────────────────────────────
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [topClients, setTopClients]   = useState<TopClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError,   setClientsError]   = useState('');
  const [search, setSearch] = useState('');

  // ── Team tab state ─────────────────────────────────────────────────────────
  const [team, setTeam]           = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSearch, setTeamSearch]   = useState('');
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [roleFilter, setRoleFilter]   = useState('');

  // ── Load clients overview ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setClientsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/admin/users/overview', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || 'Failed to load client data');
        setStatusRows(Array.isArray(payload?.statusRows) ? payload.statusRows : []);
        setTopClients(Array.isArray(payload?.topClients) ? payload.topClients : []);
      } catch (err: any) {
        setClientsError(err.message || 'Could not load users module.');
      } finally {
        setClientsLoading(false);
      }
    })();
  }, []);

  // ── Load team (all users) ──────────────────────────────────────────────────
  async function loadTeam() {
    setTeamLoading(true);
    try {
      const res  = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load team');
      setTeam(data.users || []);
    } catch (err: any) {
      toast(err.message || 'Could not load team members', 'error');
    } finally {
      setTeamLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'team') loadTeam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Update a user's role ───────────────────────────────────────────────────
  async function updateRole(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      const res  = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      setTeam((prev) => prev.map((m) => m.id === userId ? { ...m, role: newRole } : m));
      toast(`Role updated to "${newRole}"`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update role', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topClients;
    return topClients.filter((c) =>
      (c.name || '').toLowerCase().includes(q) || String(c.id).toLowerCase().includes(q),
    );
  }, [topClients, search]);

  const filteredTeam = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    return team.filter((m) => {
      const matchesSearch = !q
        || (m.email || '').toLowerCase().includes(q)
        || (m.full_name || '').toLowerCase().includes(q);
      const matchesRole = !roleFilter || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [team, teamSearch, roleFilter]);

  const roleCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of team) counts[m.role] = (counts[m.role] || 0) + 1;
    return counts;
  }, [team]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Users Management</h1>
        <p className="mt-1 text-slate-400">Manage clients, monitor activity, and assign team roles.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="-mb-px flex gap-1">
          {(['clients', 'team'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-blue-600 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-200 hover:border-slate-700',
              ].join(' ')}
            >
              {tab === 'team' ? 'Team & Roles' : 'Clients'}
            </button>
          ))}
        </nav>
      </div>

      {/* ── CLIENTS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <>
          {clientsLoading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-500">
              Loading…
            </div>
          )}
          {clientsError && (
            <div className="rounded-xl border border-rose-800/40 bg-rose-950/30 p-4 text-rose-300">
              {clientsError}
            </div>
          )}
          {!clientsLoading && !clientsError && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statusRows.map((row) => (
                  <div key={row.status} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <p className="text-sm text-slate-500">{row.status || 'Unknown'}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-100">{row.count || 0}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.percentage || 0}% of total</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">Top Clients by Lifetime Value</h2>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or ID"
                    className="w-full md:w-80 rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mb-3 text-sm text-slate-500">Showing {filteredClients.length} records</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-slate-500">
                        <th className="py-2 pr-3">Client</th>
                        <th className="py-2 pr-3">LTV</th>
                        <th className="py-2 pr-3">Transactions</th>
                        <th className="py-2">Registration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="border-b border-slate-800/60 last:border-b-0">
                          <td className="py-2 pr-3 font-medium text-slate-100">{client.name || 'N/A'}</td>
                          <td className="py-2 pr-3 text-slate-200">{Number(client.ltv || 0).toLocaleString()}</td>
                          <td className="py-2 pr-3 text-slate-200">{client.transaction_count || 0}</td>
                          <td className="py-2 text-slate-200">
                            {client.registration_date ? new Date(client.registration_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── TEAM & ROLES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <>
          {/* Role distribution chips */}
          {Object.keys(roleCount).length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter('')}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  !roleFilter
                    ? 'border-blue-500 bg-blue-950/30 text-blue-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                All ({team.length})
              </button>
              {Object.entries(roleCount).sort(([,a],[,b]) => b - a).map(([role, count]) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    roleFilter === role
                      ? 'border-blue-500 bg-blue-950/30 text-blue-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {role} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Search + refresh */}
          <div className="flex gap-3">
            <input
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadTeam}
              disabled={teamLoading}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-50 transition"
            >
              {teamLoading ? '…' : '↻'}
            </button>
          </div>

          {teamLoading && team.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading team members…</p>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs text-slate-500 bg-slate-950">
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Current Role</th>
                      <th className="px-4 py-3 font-medium">Change Role</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium">Last Sign-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.map((member) => (
                      <tr key={member.id} className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-950 transition-colors">
                        {/* User info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                              {((member.full_name || member.email || '?')[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-100 truncate">
                                {member.full_name || '(No name)'}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Current role badge */}
                        <td className="px-4 py-3">
                          <RoleBadge role={member.role} />
                        </td>
                        {/* Role selector */}
                        <td className="px-4 py-3">
                          <select
                            value={member.role}
                            disabled={updatingId === member.id}
                            onChange={(e) => updateRole(member.id, e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {updatingId === member.id && (
                            <span className="ml-2 text-xs text-blue-500">Saving…</span>
                          )}
                        </td>
                        {/* Dates */}
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {relativeTime(member.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {relativeTime(member.last_sign_in_at)}
                        </td>
                      </tr>
                    ))}
                    {filteredTeam.length === 0 && !teamLoading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
