'use client';
import { useState, useSyncExternalStore } from 'react';
import { analyticsAllowed, CONSENT_KEY, CONSENT_EVENT } from '@/lib/analyticsPrivacy';

export default function PrivacyPreferences() {
  const allowed = useSyncExternalStore(subscribe, analyticsAllowed, () => false);
  const [message, setMessage] = useState('');
  function change(value: boolean) {
    try {
      localStorage.setItem(CONSENT_KEY, value ? 'granted' : 'denied');
      window.dispatchEvent(new Event(CONSENT_EVENT));
      setMessage('Preference saved on this browser.');
    } catch { setMessage('Your browser could not save this preference.'); }
  }
  return <main className="mx-auto max-w-2xl px-5 py-12 text-slate-900"><h1 className="text-2xl font-semibold">Privacy preferences</h1>
    <label className="mt-8 flex min-h-12 items-center justify-between gap-6 border-y border-slate-200 py-5"><span>Optional usage analytics</span><input type="checkbox" checked={allowed} onChange={event => change(event.target.checked)} className="h-5 w-5" /></label>
    <p className="mt-4 text-sm text-slate-600">Off by default. Opting in shares selected usage events to improve EPR Compass. Session replay is disabled. Account security, audit records and service processing remain necessary to operate your account.</p>
    <p role="status" className="mt-4 text-sm">{message}</p>
  </main>;
}

function subscribe(notify: () => void) {
  window.addEventListener(CONSENT_EVENT, notify);
  window.addEventListener('storage', notify);
  return () => { window.removeEventListener(CONSENT_EVENT, notify); window.removeEventListener('storage', notify); };
}

