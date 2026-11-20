'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

type Props = {
  portalName: string;
  redirectPath: string;
  accent?: 'violet' | 'teal' | 'rose';
};

const THEME = {
  violet: {
    icon: 'bg-violet-500/20 border-violet-500/40 text-violet-400',
    focus: 'focus:ring-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
  teal: {
    icon: 'bg-teal-500/20 border-teal-500/40 text-teal-400',
    focus: 'focus:ring-teal-500',
    button: 'bg-teal-600 hover:bg-teal-700',
  },
  rose: {
    icon: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
    focus: 'focus:ring-rose-500',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
} as const;

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function FirstLoginPasswordChange({ portalName, redirectPath, accent = 'violet' }: Props) {
  const router = useRouter();
  const theme = THEME[accent];
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const supabase = getBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        document.cookie = `sb-access-token=${session.access_token}; Path=/; Max-Age=${session.expires_in ?? 3600}; SameSite=Lax`;
      }

      const clearResponse = await fetch('/api/auth/clear-force-pw', { method: 'POST' });
      if (!clearResponse.ok) {
        setError('Password changed, but the first-login requirement could not be cleared. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(redirectPath), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${theme.icon}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">{portalName}</p>
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

          {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</div>}
          {success && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">Password updated! Redirecting…</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required minLength={8}
                  value={newPassword} onChange={event => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 ${theme.focus}`}
                />
                <button type="button" onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password" required value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)} placeholder="Re-enter new password"
                className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 ${theme.focus}`}
              />
              {confirmPassword && newPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-rose-400">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={saving || success}
              className={`w-full rounded-lg disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition ${theme.button}`}>
              {saving ? 'Updating…' : success ? '✓ Done!' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
