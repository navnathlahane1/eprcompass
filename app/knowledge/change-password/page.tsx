'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function KnowledgeChangePasswordPage() {
  const router = useRouter();
  const [newPw,   setNewPw]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPw.length < 8)  { setError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirm)  { setError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      const supabase = getBrowserClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) { setError(updateErr.message); return; }

      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession?.access_token) {
        document.cookie = `sb-access-token=${newSession.access_token}; Path=/; Max-Age=${newSession.expires_in ?? 3600}; SameSite=Lax`;
      }

      await fetch('/api/auth/clear-force-pw', { method: 'POST' });

      setSuccess(true);
      setTimeout(() => router.push('/knowledge/dashboard'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Knowledge Hub</p>
            <p className="text-[11px] text-slate-500">Password change required</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Set your password</h1>
            <p className="text-sm text-slate-400 mt-1">
              Your account was created by an administrator. Please set a new password before continuing.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 flex items-start gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Password updated! Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'} required minLength={8}
                  value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showNew
                    ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {confirm && newPw && confirm !== newPw && (
                <p className="text-[11px] text-rose-400">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={saving || success}
              className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Updating…
                </>
              ) : success ? '✓ Done!' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
