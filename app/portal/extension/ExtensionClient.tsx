'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface TokenRow {
  id: string;
  name: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

type ConnectStatus = 'idle' | 'generating' | 'connected' | 'manual-fallback' | 'error';

function formatDate(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

function ExtensionClientInner() {
  const searchParams = useSearchParams();
  const autoConnectTried = useRef(false);
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [manualToken, setManualToken] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch('/api/portal/extension-token');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleConnect = useCallback(async () => {
    setStatus('generating');
    setErrorMsg('');
    setManualToken(null);

    try {
      const res = await fetch('/api/portal/extension-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Chrome Extension' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Could not generate a token.');
        setStatus('error');
        return;
      }

      const data = await res.json();
      setManualToken(data.token);

      const extensionId = process.env.NEXT_PUBLIC_EPR_EXTENSION_ID;
      // Regular web pages get a minimal chrome.runtime object for exactly this purpose —
      // no extension needs to be installed by *this* page, but the target extension must
      // list this origin in its manifest's externally_connectable.
      const chromeRuntime = (window as unknown as { chrome?: { runtime?: any } }).chrome?.runtime;

      if (!extensionId || !chromeRuntime?.sendMessage) {
        setStatus('manual-fallback');
        loadTokens();
        return;
      }

      chromeRuntime.sendMessage(extensionId, { type: 'SET_TOKEN', token: data.token }, (response: { ok?: boolean } | undefined) => {
        if (chromeRuntime.lastError || !response?.ok) {
          setStatus('manual-fallback');
        } else {
          setStatus('connected');
        }
        loadTokens();
      });
    } catch {
      setErrorMsg('Something went wrong generating the token.');
      setStatus('error');
    }
  }, [loadTokens]);

  // Arriving here via the extension's "Sign in" flow (?auto_connect=1, appended to the
  // returnUrl it sent to /portal/login) — connect immediately instead of making the user
  // click twice.
  useEffect(() => {
    if (autoConnectTried.current) return;
    if (searchParams?.get('auto_connect') === '1') {
      autoConnectTried.current = true;
      handleConnect();
    }
  }, [searchParams, handleConnect]);

  async function handleRevoke(id: string) {
    await fetch(`/api/portal/extension-token?id=${id}`, { method: 'DELETE' });
    loadTokens();
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Chrome Extension</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect the EPR Autofill Chrome extension to fill CPCB registration and return forms
          using your data on file here.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Connect Chrome Extension</h2>
        <p className="mt-1 text-sm text-slate-500">
          Generates a token and hands it to the extension automatically — no copying required,
          as long as the extension is installed in this browser.
        </p>

        <button
          onClick={handleConnect}
          disabled={status === 'generating'}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {status === 'generating' ? 'Connecting…' : 'Connect Chrome Extension'}
        </button>

        {status === 'connected' && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Connected — the extension picked up the token automatically. Open its icon to confirm.
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {status === 'manual-fallback' && manualToken && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            <p className="font-medium">Couldn't reach the extension automatically.</p>
            <p className="mt-1">
              Make sure it's installed, then copy this token into the extension's Settings → Manual
              token field. It won't be shown again.
            </p>
            <code className="mt-2 block break-all rounded bg-white px-2 py-1.5 font-mono text-xs text-slate-800 border border-amber-200">
              {manualToken}
            </code>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Connected devices</h2>

        {loadingTokens ? (
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        ) : tokens.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No extension tokens yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    Last used: {formatDate(t.last_used_at)} · Expires: {formatDate(t.expires_at)}
                    {!t.is_active && <span className="ml-2 text-red-600 font-medium">Revoked</span>}
                  </p>
                </div>
                {t.is_active && (
                  <button
                    onClick={() => handleRevoke(t.id)}
                    className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ExtensionClient() {
  return (
    <Suspense fallback={null}>
      <ExtensionClientInner />
    </Suspense>
  );
}
