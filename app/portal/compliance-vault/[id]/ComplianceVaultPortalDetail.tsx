'use client';

import { useState, useRef } from 'react';
import { ACCOUNT_STATUS_COLORS, RENEWAL_WARN_DAYS, RENEWAL_CRITICAL_DAYS } from '@/lib/complianceVault/constants';
import type { AccountStatus } from '@/lib/complianceVault/constants';
import { trackEvent } from '@/lib/analytics';

type Account = {
  id: string;
  portal_name: string;
  portal_url?: string;
  status: string;
  renewal_due_date?: string;
  registration_number?: string;
  client_notes?: string;
  compliance_countries?: { name: string; flag_emoji: string } | null;
  compliance_types?: { name: string; region: string } | null;
  profiles?: { full_name: string } | null;
  compliance_credentials?: {
    username?: string;
    has_password: boolean;
    otp_email?: string;
    otp_mobile?: string;
    otp_owner_type?: string;
    otp_notes?: string;
    otp_status?: string;
    security_notes?: string;
  } | null;
};

export default function ComplianceVaultPortalDetail({ account }: { account: Account }) {
  const creds = account.compliance_credentials;

  const [revealedPw, setRevealedPw] = useState<string | null>(null);
  const [revealing, setRevealing]   = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);
  const [error, setError]           = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function revealPassword() {
    setRevealing(true);
    setError('');
    try {
      const res = await fetch(`/api/portal/compliance-vault/${account.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not reveal password'); return; }
      trackEvent('Client Vault Password Revealed', { portal_name: account.portal_name });
      setRevealedPw(data.password);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setRevealedPw(null), 30000);
    } catch { setError('Network error, please try again.'); }
    finally { setRevealing(false); }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  let renewal: { label: string; cls: string; warn: boolean } | null = null;
  if (account.renewal_due_date) {
    const days = Math.ceil((new Date(account.renewal_due_date).getTime() - Date.now()) / 86400000);
    if (days < 0) renewal = { label: `Expired ${Math.abs(days)} days ago`, cls: 'bg-red-100 text-red-700', warn: true };
    else if (days <= RENEWAL_CRITICAL_DAYS) renewal = { label: `Renewal due in ${days} days`, cls: 'bg-red-100 text-red-700', warn: true };
    else if (days <= RENEWAL_WARN_DAYS)     renewal = { label: `Renewal due in ${days} days`, cls: 'bg-amber-100 text-amber-700', warn: true };
    else renewal = { label: `Renews: ${new Date(account.renewal_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, cls: 'bg-slate-100 text-slate-600', warn: false };
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{account.compliance_countries?.flag_emoji || '🌐'}</span>
          <div>
            <p className="text-xs font-medium text-teal-700">{account.compliance_countries?.name} · {account.compliance_types?.name}</p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{account.portal_name}</h1>
          </div>
          <span className={`ml-auto inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ACCOUNT_STATUS_COLORS[account.status as AccountStatus] || 'bg-slate-100 text-slate-500'}`}>
            {account.status}
          </span>
        </div>

        {renewal?.warn && (
          <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${renewal.cls} mb-3`}>
            ⚠️ {renewal.label}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {account.registration_number && (
            <div>
              <p className="text-xs text-slate-400">Registration Number</p>
              <p className="font-mono text-slate-700 mt-0.5">{account.registration_number}</p>
            </div>
          )}
          {renewal && !renewal.warn && (
            <div>
              <p className="text-xs text-slate-400">Renewal Date</p>
              <p className="text-slate-700 mt-0.5">{renewal.label.replace('Renews: ', '')}</p>
            </div>
          )}
          {account.profiles?.full_name && (
            <div>
              <p className="text-xs text-slate-400">Compliance Manager</p>
              <p className="text-slate-700 mt-0.5">{account.profiles.full_name}</p>
            </div>
          )}
          {account.portal_url && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1">Portal URL</p>
              <a href={account.portal_url} target="_blank" rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 hover:underline text-sm break-all">
                {account.portal_url}
              </a>
            </div>
          )}
          {account.client_notes && (
            <div className="col-span-2 bg-blue-50 rounded-xl border border-blue-200 px-3 py-2">
              <p className="text-xs font-medium text-blue-700 mb-0.5">Note from your manager</p>
              <p className="text-sm text-blue-800">{account.client_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Credentials */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-5">
        <h2 className="font-semibold text-slate-900 mb-4">🔐 Login Credentials</h2>

        {error && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Username */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 mb-3">
          <span className="text-xs font-medium text-slate-500 w-20 shrink-0">Username</span>
          {creds?.username ? (
            <>
              <span className="text-sm font-mono text-slate-800 flex-1">{creds.username}</span>
              <button onClick={() => copy(creds.username!, 'username')}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${copied === 'username' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}>
                {copied === 'username' ? '✓' : 'Copy'}
              </button>
            </>
          ) : (
            <span className="text-sm text-slate-400">Not set</span>
          )}
        </div>

        {/* Password */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 w-20 shrink-0">Password</span>
            {creds?.has_password ? (
              revealedPw ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-mono bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg px-3 py-1.5 flex-1 break-all">
                    {revealedPw}
                  </span>
                  <button onClick={() => copy(revealedPw, 'password')}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition ${copied === 'password' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}>
                    {copied === 'password' ? '✓ Copied' : 'Copy'}
                  </button>
                  <button onClick={() => { setRevealedPw(null); if (timer.current) clearTimeout(timer.current); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium">Hide</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 font-mono tracking-widest text-sm">••••••••••</span>
                  <button onClick={revealPassword} disabled={revealing}
                    className="ml-auto text-xs font-medium px-4 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-60 transition">
                    {revealing ? '…' : '👁 Reveal Password'}
                  </button>
                </div>
              )
            ) : (
              <span className="text-sm text-slate-400">Not stored</span>
            )}
          </div>
          {revealedPw && (
            <p className="mt-2 text-[11px] text-slate-400">
              Auto-hides in 30 seconds · This reveal is logged and monitored
            </p>
          )}
        </div>
      </div>

      {/* OTP Info */}
      {creds && (creds.otp_email || creds.otp_mobile) && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-5">
          <h2 className="font-semibold text-slate-900 mb-4">📱 OTP Details</h2>
          <div className="space-y-3 text-sm">
            {creds.otp_email && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-28 shrink-0">OTP Email</span>
                <span className="font-mono text-slate-700">{creds.otp_email.replace(/(?<=.{3}).(?=.*@)/g, '•')}</span>
              </div>
            )}
            {creds.otp_mobile && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-28 shrink-0">OTP Mobile</span>
                <span className="font-mono text-slate-700">
                  {creds.otp_mobile.slice(0, 4) + '•'.repeat(Math.max(0, creds.otp_mobile.length - 8)) + creds.otp_mobile.slice(-4)}
                </span>
              </div>
            )}
            {creds.otp_owner_type && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-28 shrink-0">OTP Controller</span>
                <span className="text-slate-700">{creds.otp_owner_type}</span>
              </div>
            )}
            {creds.otp_notes && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                {creds.otp_notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manager contact */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-600">
        <p className="font-medium text-slate-800 mb-1">Need to update credentials?</p>
        <p>Contact your compliance manager to update login details, passwords, or OTP settings.</p>
        <a href="/contact"
          className="mt-3 inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition">
          Contact Manager
        </a>
      </div>
    </div>
  );
}

