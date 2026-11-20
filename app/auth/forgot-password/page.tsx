'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [estimated, setEstimated] = useState(false);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading' || Date.now() < retryAt) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (result.retryAfter) {
        setRetryAt(Date.now() + result.retryAfter * 1000);
        setRemaining(result.retryAfter);
        setEstimated(Boolean(result.estimated));
      }
      if (!response.ok) throw new Error(result.error || 'Unable to send reset link. Please try again.');
      setStatus('sent');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to send reset link. Please try again.');
      setStatus('error');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Forgot Password</h1>

        {status === 'sent' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              If an account exists for <span className="font-semibold">{email}</span>, you&apos;ll receive a password reset link. Check your inbox and spam folder.
            </div>
            <p className="text-center text-sm text-gray-600">
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                disabled={remaining > 0}
                onClick={() => setStatus('idle')}
                className="text-blue-700 hover:underline"
              >
                {remaining > 0 ? `Try again in ${remaining}s` : 'Try again'}
              </button>
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-600">
              Enter the email address associated with your account and we&apos;ll send you a password reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {status === 'error' && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
              )}
              {remaining > 0 && <p role="status" className="text-sm text-gray-600">{estimated ? 'Suggested wait' : 'You can retry'} in {Math.floor(remaining / 60)}m {remaining % 60}s.{estimated ? ' Your email provider may require longer.' : ''}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || remaining > 0}
                className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending…' : remaining > 0 ? `Wait ${remaining}s` : 'Send Reset Link'}
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
