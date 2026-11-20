'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export default function PartnerSetupPrompt() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSetup() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner/setup', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Setup failed.'); return; }
      trackEvent('Partner Account Setup Completed', {});
      router.push('/partner/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Account Setup Pending</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your partner profile record is missing. Click below to complete the setup automatically.
          </p>
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Setting up…
            </>
          ) : 'Complete Account Setup'}
        </button>

        <p className="text-xs text-slate-400">
          If this error persists, please use the contact page on our website.
        </p>
      </div>
    </div>
  );
}

