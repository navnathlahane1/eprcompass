'use client';

import { useState, useCallback, useRef } from 'react';

interface PortalUser {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  last_sign_in_at: string | null;
  /** Populated when this portal user is already linked to a different client */
  linked_client_id?: string | null;
  linked_company_name?: string | null;
}

interface Props {
  clientId: string;
  /** Currently linked portal user (null = not linked yet) */
  linkedUser: PortalUser | null;
}

function relativeTime(d: string | null) {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LinkPortalUserPanel({ clientId, linkedUser: initialLinkedUser }: Props) {
  const [linked, setLinked] = useState<PortalUser | null>(initialLinkedUser);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PortalUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [movedFrom, setMovedFrom] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setSearching(true);
      setError('');
      try {
        const res = await fetch(
          `/api/admin/clients/${clientId}/link-user?search=${encodeURIComponent(q)}`,
          { method: 'GET' }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        setResults(data.users || []);
      } catch (e: any) {
        setError(e.message || 'Search error');
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [clientId]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  async function callLink(profileId: string | null, userToSet: PortalUser | null) {
    const isUnlink = profileId === null;
    if (isUnlink) setUnlinking(true);
    else setLinking(profileId);
    setError('');
    setSuccessMsg('');
    setMovedFrom(null);

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/link-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setLinked(userToSet);
      setResults([]);
      setSearch('');

      if (isUnlink) {
        setSuccessMsg('Portal user unlinked. The company no longer has a portal login.');
      } else if (data.moved_from_client_id) {
        setMovedFrom(data.moved_from_client_id);
        setSuccessMsg(
          `Moved successfully. ${userToSet?.email ?? userToSet?.full_name ?? 'User'} is now linked to this company.`
        );
      } else {
        setSuccessMsg(
          `Linked successfully. ${userToSet?.email ?? userToSet?.full_name ?? 'User'} can now log in and see this company's data.`
        );
      }
      setTimeout(() => { setSuccessMsg(''); setMovedFrom(null); }, 8000);
    } catch (e: any) {
      setError(e.message || 'Operation failed');
    } finally {
      setUnlinking(false);
      setLinking(null);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card-header flex items-center justify-between">
        <span>Portal Access</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${linked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {linked ? 'Linked' : 'Not linked'}
        </span>
      </div>

      <div className="admin-card-body space-y-4">
        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
          Each company in the CRM can be connected to a portal login account. Once linked, the
          portal user will see this company&apos;s services, documents, and filings after logging in to
          the client portal.
        </p>

        {/* ── Currently linked user ─────────────────────────────────────── */}
        {linked ? (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Linked Portal User
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {linked.full_name || linked.email || 'Unknown'}
              </p>
              {linked.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate select-all">
                  {linked.email}
                </p>
              )}
              {linked.company_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {linked.company_name}
                </p>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Last sign-in: {relativeTime(linked.last_sign_in_at)}
              </p>
            </div>
            <button
              type="button"
              disabled={unlinking}
              onClick={() => {
                if (!window.confirm('Unlink this portal user? They will lose access to this company\'s portal data until re-linked.')) return;
                callLink(null, null);
              }}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
            >
              {unlinking ? 'Unlinking…' : 'Unlink'}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/10">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              No portal user linked
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Search below to connect an IAM-created portal account to this company.
            </p>
          </div>
        )}

        {/* ── Moved-from notice ─────────────────────────────────────────── */}
        {movedFrom && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-400">
            ↔ Login was previously connected to another company (client&nbsp;
            <a href={`/admin/crm/clients/${movedFrom}`} className="underline hover:text-blue-900 dark:hover:text-blue-300">
              {movedFrom.slice(0, 8)}…
            </a>
            ) and has been moved here. That record now has no portal login. This change has been recorded in the&nbsp;
            <a href="/iam/audit" className="underline hover:text-blue-900 dark:hover:text-blue-300">audit log</a>.
          </div>
        )}

        {/* ── Success / Error banners ────────────────────────────────────── */}
        {successMsg && !movedFrom && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400">
            ✓ {successMsg}
          </div>
        )}
        {successMsg && movedFrom && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400">
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-400">
            ✕ {error}
          </div>
        )}

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            {linked ? 'Change linked user' : 'Search portal users'}
          </label>
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              fill="none" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, company, or email…"
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-violet-600 dark:focus:ring-violet-900/30"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                Searching…
              </span>
            )}
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {results.map((user) => {
                const isAlreadyLinkedElsewhere =
                  !!user.linked_client_id && user.linked_client_id !== clientId;
                return (
                  <div
                    key={user.id}
                    className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {user.full_name || user.email || 'Unnamed user'}
                      </p>
                      {user.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      )}
                      {user.company_name && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {user.company_name}
                        </p>
                      )}
                      {/* Conflict warning */}
                      {isAlreadyLinkedElsewhere && (
                        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Already linked to{' '}
                          <a
                            href={`/admin/crm/clients/${user.linked_client_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-amber-800 dark:hover:text-amber-200"
                          >
                            {user.linked_company_name || 'another company'}
                          </a>
                          {' '}— clicking Move will transfer it here.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={linking === user.id}
                      onClick={() => {
                        if (isAlreadyLinkedElsewhere) {
                          if (!window.confirm(
                            `"${user.full_name || user.email}" is currently linked to "${user.linked_company_name || 'another company'}". ` +
                            `Moving it here will disconnect it from that company. Continue?`
                          )) return;
                        } else if (linked) {
                          if (!window.confirm(
                            `This will replace the current linked user (${linked.email || linked.full_name}). Continue?`
                          )) return;
                        }
                        callLink(user.id, user);
                      }}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 ${
                        isAlreadyLinkedElsewhere
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-violet-600 hover:bg-violet-700'
                      }`}
                    >
                      {linking === user.id
                        ? (isAlreadyLinkedElsewhere ? 'Moving…' : 'Linking…')
                        : (isAlreadyLinkedElsewhere ? 'Move here' : 'Link')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {search.trim() && !searching && results.length === 0 && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              No portal users found matching &quot;{search}&quot;.{' '}
              <a href="/iam/create" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">
                Create one in the IAM portal →
              </a>
            </p>
          )}
        </div>

        {/* ── How this works ────────────────────────────────────────────── */}
        <details className="group">
          <summary className="cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
            How does this work?
          </summary>
          <div className="mt-2 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Portal access flow:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Go to <a href="/iam/create" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">IAM → Create User</a> and create a user with role <strong>Client</strong>.</li>
              <li>Come back here and use the search above to link that user to this company.</li>
              <li>The client logs into <code className="font-mono bg-slate-200 dark:bg-slate-700 rounded px-1">/portal/login</code> and sees this company&apos;s services, filings, and documents.</li>
              <li>Each login can only be connected to one company at a time. Moving it here will disconnect it from the previous company.</li>
              <li>All link and unlink actions are recorded in the <a href="/iam/audit" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">IAM Audit Log</a>.</li>
            </ol>
          </div>
        </details>
      </div>
    </section>
  );
}
