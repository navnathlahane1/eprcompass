'use client';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { AUTH_CALLBACK_URL } from '@/lib/auth/config';

export default function GoogleWorkspaceSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!isSupabaseConfigured || process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED !== 'true') return null;
  async function signIn() {
    setBusy(true); setError('');
    try {
      // Return to the existing client login gate; Google identity alone grants no workspace access.
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: {
        redirectTo: AUTH_CALLBACK_URL, queryParams: { prompt: 'select_account' },
      } });
      if (error) throw error;
    } catch {
      setError('Google sign-in is unavailable. Please contact your administrator.'); setBusy(false);
    }
  }
  return <div className="mt-5"><button type="button" disabled={busy} onClick={signIn} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 disabled:opacity-50">{busy ? 'Connecting...' : 'Continue with Google'}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
