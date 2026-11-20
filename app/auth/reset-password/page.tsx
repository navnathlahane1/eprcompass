'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [ready, setReady] = useState(false);

  // Supabase sends the user here with an access_token fragment after email link click
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setStatus('loading');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message || 'Unable to update password. Please try again.');
      setStatus('error');
    } else {
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Reset Password</h1>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Password updated successfully. Redirecting to sign in…
            </div>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="text-blue-700 hover:underline">Go to sign in now</Link>
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-600">
              Enter your new password below. It must be at least 8 characters.
            </p>

            {!ready && (
              <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Waiting for verification… If you arrived here without clicking an email link,{' '}
                <Link href="/auth/forgot-password" className="font-medium underline">request a new reset link</Link>.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                New Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {errorMsg && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !ready}
                className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {status === 'loading' ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        <p className="mt-5 text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-700 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
