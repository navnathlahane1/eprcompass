'use client';
import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

export default function TeamInvitation() {
  const token = useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '', () => '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function accept() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/portal/team/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      window.location.replace('/portal/dashboard');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to accept invitation'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-xl px-5 py-12 text-slate-900"><h1 className="text-2xl font-semibold">Join your company team</h1>
    <p className="mt-4 text-sm text-slate-600">Use the email your company invited. Staff validation is required before workspace access is granted.</p>
    <div className="mt-6 flex flex-wrap gap-4"><Link href="/login" target="_blank" rel="noopener noreferrer" className="min-h-11 py-2 font-semibold text-emerald-700">Sign in</Link><Link href="/signup" target="_blank" rel="noopener noreferrer" className="min-h-11 py-2 font-semibold text-emerald-700">Request account access</Link></div>
    <button disabled={busy || !/^[a-f0-9]{64}$/.test(token)} onClick={accept} className="mt-4 min-h-11 rounded-lg bg-emerald-700 px-5 text-white disabled:opacity-50">{busy ? 'Checking invitation...' : 'Accept invitation'}</button>
    <p role="status" className="mt-4 text-sm">{message}</p><Link href="/contact" className="mt-4 inline-block text-sm text-emerald-700">Contact account team</Link>
  </main>;
}

function subscribe(notify: () => void) {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
}
