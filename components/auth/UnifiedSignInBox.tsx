'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { finishSignIn } from '@/lib/auth/finishSignIn';
import GoogleWorkspaceSignIn from './GoogleWorkspaceSignIn';

export default function UnifiedSignInBox() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active=true;
    supabase.auth.getSession().then(async ({data:{session}}) => { if(active && session) await finishSignIn(searchParams?.get('returnUrl')); })
      .catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to restore your session');});
    return ()=>{active=false;};
  },[searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) { setError('Sign-in is currently unavailable. Please contact support.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        setError(
          authError.message.toLowerCase().includes('invalid login')
            ? 'Incorrect email or password.'
            : authError.message
        );
        return;
      }
      const user = data.session?.user;
      if (!user) {
        setError('Login failed — no session returned.');
        return;
      }
      await finishSignIn(searchParams?.get('returnUrl'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isSupabaseConfigured && <p role="status" className="text-sm text-amber-800">Sign-in is currently unavailable. Please contact support.</p>}
      <label className="block text-sm font-semibold text-[#102c32]">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="mt-1.5 min-h-12 w-full rounded-xl border border-[#dfe9e4] bg-white px-4 text-base text-[#102c32] placeholder:text-[#8aa0a6] outline-none transition focus:border-[#07875f] focus:ring-2 focus:ring-[#07875f]/20"
        />
      </label>
      <label className="block text-sm font-semibold text-[#102c32]">
        <span className="flex items-center justify-between gap-2">
          Password
          <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#07875f] hover:underline">
            Forgot password?
          </Link>
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 min-h-12 w-full rounded-xl border border-[#dfe9e4] bg-white px-4 text-base text-[#102c32] outline-none transition focus:border-[#07875f] focus:ring-2 focus:ring-[#07875f]/20"
        />
      </label>
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !isSupabaseConfigured}
        className="epr-button-shine flex min-h-12 w-full items-center justify-center rounded-xl bg-[#07875f] text-[15px] font-bold text-white shadow-[0_8px_18px_rgba(7,135,95,.22)] transition hover:bg-[#066e4e] disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <GoogleWorkspaceSignIn />
      <Link href="/signup" className="block text-center text-sm font-semibold text-emerald-700">Use email verification instead</Link>
    </form>
  );
}
