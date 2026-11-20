"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
  .split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);

export default function AdminImpersonatePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null); // { email, name }
  const [impersonating, setImpersonating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user || !SUPER_ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
        const reason = SUPER_ADMIN_EMAILS.length === 0
          ? 'Access denied. NEXT_PUBLIC_SUPER_ADMIN_EMAILS is not configured — contact your system administrator.'
          : 'Access denied. Only superadmins can access this page.';
        setError(reason);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/users');
      const json = await res.json();

      if (!res.ok || json.error) {
        setError('Failed to load users: ' + (json.error || res.statusText));
      } else {
        setUsers(json.users || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const handleLoginAs = async () => {
    if (!confirm) return;
    setImpersonating(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: confirm.email })
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Failed to generate login link');
      }
      setSuccessMsg(`Magic link generated for ${confirm.email}. Opening in new tab…`);
      window.open(json.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message);
    } finally {
      setImpersonating(false);
      setConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="p-6">
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-4 text-rose-300 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Login as User</h1>
        <p className="text-sm text-slate-500 mt-1">Generate a one-time magic link to access any user's account. The link opens in a new tab.</p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-700/50 rounded-lg p-4">
        <svg className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="text-sm text-amber-200">
          <span className="font-semibold">Superadmin action.</span> Impersonation generates a single-use login link for the target user. The link expires after use. Audit all impersonation actions.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-lg p-3 text-emerald-300 text-sm">{successMsg}</div>
      )}
      {error && (
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-3 text-rose-300 text-sm">{error}</div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search users by name, email, or role…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <p className="text-sm text-slate-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-left">
                <th className="px-4 py-3 font-semibold text-slate-400">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Company</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Last Login</th>
                <th className="px-4 py-3 font-semibold text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((u) => {
                const isSelf = (u.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase();
                return (
                  <tr key={u.id} className="hover:bg-slate-950 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.company_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-teal-900/60 text-teal-300 rounded-full text-xs font-medium capitalize">{u.role || 'client'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate-500 italic">You</span>
                      ) : (
                        <button
                          onClick={() => setConfirm({ email: u.email, name: u.full_name || u.email })}
                          className="btn-primary"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                          </svg>
                          Login As
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Confirm Impersonation</h2>
            <p className="text-sm text-slate-400">
              You are about to generate a login link for <span className="font-semibold text-slate-100">{confirm.name}</span> (<code className="text-xs bg-slate-900 px-1 py-0.5 rounded">{confirm.email}</code>). This will open their session in a new tab.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={impersonating}
                className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLoginAs}
                disabled={impersonating}
                className="btn-primary"
              >
                {impersonating && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                {impersonating ? 'Generating…' : 'Confirm & Open'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
