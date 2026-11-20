'use client';

import { useState } from 'react';

interface Props {
  credId: string;
  accountId: string;
  fieldName: string;
  fieldLabel: string | null;
  canReveal: boolean;
  canViewMasked: boolean;
}

const FIELD_ICONS: Record<string, string> = {
  login_email:     'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207',
  password:        'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  twofa_method:    'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  backup_codes:    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  recovery_email:  'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  recovery_phone:  'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  ad_account_ids:  'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  api_keys:        'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  other:           'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export default function CredentialField({ credId, accountId, fieldName, fieldLabel, canReveal, canViewMasked }: Props) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'show' | 'copy'>('show');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const label = fieldLabel || fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const icon = FIELD_ICONS[fieldName] ?? FIELD_ICONS.other;

  async function handleReveal(action: 'show' | 'copy') {
    setModalAction(action);
    setPassword('');
    setError('');
    setShowModal(true);
  }

  async function submitReveal() {
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/comms/accounts/${accountId}/credentials/${credId}/reveal`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password, action: modalAction }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to authenticate'); return; }

      if (modalAction === 'copy') {
        await navigator.clipboard.writeText(data.value);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        setShowModal(false);
      } else {
        setRevealed(data.value);
        setShowModal(false);
        // Auto-clear after 30 seconds
        setTimeout(() => setRevealed(null), 30_000);
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
      setPassword('');
    }
  }

  async function copyRevealed() {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (!canViewMasked) return null;

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-[#0c1022] px-4 py-3">
        {/* Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800/60">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>

        {/* Label + value */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          {revealed ? (
            <p className="mt-0.5 font-mono text-sm text-emerald-300 break-all">{revealed}</p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-600 tracking-widest select-none">••••••••••••</p>
          )}
          {revealed && (
            <p className="mt-0.5 text-[10px] text-amber-600">Auto-hidden in 30 s — do not screenshot</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canReveal && !revealed && (
            <button
              onClick={() => handleReveal('show')}
              title="Reveal value"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-700 hover:text-slate-200 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {canReveal && revealed && (
            <button
              onClick={() => setRevealed(null)}
              title="Hide value"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-700 hover:text-slate-200 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          )}
          {canReveal && (
            <button
              onClick={revealed ? copyRevealed : () => handleReveal('copy')}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition ${copied ? 'text-emerald-400' : 'text-slate-600 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              {copied ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Step-up re-auth modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-700/60 bg-[#0c1022] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Re-authenticate</p>
                <p className="text-xs text-slate-400">Confirm your password to {modalAction === 'copy' ? 'copy' : 'reveal'} this credential</p>
              </div>
            </div>

            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitReveal()}
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 mb-3"
            />

            {error && <p className="mb-3 text-xs text-rose-400">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
                Cancel
              </button>
              <button onClick={submitReveal} disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                {loading ? 'Verifying…' : modalAction === 'copy' ? 'Copy' : 'Reveal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
