'use client';

import { useState, useRef } from 'react';
import { ACCOUNT_STATUS_COLORS, OTP_STATUS_COLORS, RENEWAL_WARN_DAYS, RENEWAL_CRITICAL_DAYS } from '@/lib/complianceVault/constants';
import type { AccountStatus, OtpStatus } from '@/lib/complianceVault/constants';

type RefType    = { id: string; name: string; code: string; region: string };
type Country    = { id: string; name: string; iso2: string; flag_emoji: string };
type Manager    = { id: string; full_name: string };

type Credentials = {
  id: string;
  username?: string;
  has_password: boolean;
  recovery_email?: string;
  recovery_phone?: string;
  otp_email?: string;
  otp_mobile?: string;
  otp_owner_type?: string;
  otp_notes?: string;
  otp_status?: string;
  security_notes?: string;
  last_password_update?: string;
};

type ActivityLog = {
  id: string;
  action: string;
  actor_role?: string;
  details?: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name?: string } | null;
};

type Account = {
  id: string;
  portal_name: string;
  portal_url?: string;
  status: string;
  renewal_due_date?: string;
  registration_number?: string;
  internal_notes?: string;
  client_notes?: string;
  created_at: string;
  updated_at: string;
  clients?: { profiles?: { full_name: string; company_name?: string; phone?: string } | null } | null;
  compliance_countries?: Country | null;
  compliance_types?: RefType | null;
  profiles?: Manager | null;
  compliance_credentials?: Credentials | null;
  compliance_activity_logs?: ActivityLog[];
};

const ACTION_LABELS: Record<string, string> = {
  account_created:      '✅ Account created',
  account_updated:      '✏️ Account updated',
  account_deleted:      '🗑 Account deleted',
  credentials_created:  '🔑 Credentials added',
  credentials_updated:  '🔑 Credentials updated',
  password_revealed:    '👁 Password revealed',
  password_copied:      '📋 Password copied',
  account_accessed:     '🔍 Account accessed',
  portal_opened:        '🌐 Portal opened',
};

export default function ComplianceVaultAdminDetail({
  account: initialAccount,
  types, countries, managers,
}: {
  account: Account;
  types: RefType[];
  countries: Country[];
  managers: Manager[];
}) {
  const [account, setAccount] = useState(initialAccount);
  const [editMode, setEditMode] = useState(false);
  const [editCredMode, setEditCredMode] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Reveal state
  const [revealedPw, setRevealedPw] = useState<string | null>(null);
  const [revealing, setRevealing]   = useState(false);
  const [revealCopied, setRevealCopied] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Account edit form
  const [aForm, setAForm] = useState({
    country_id:          account.compliance_countries?.id || '',
    compliance_type_id:  account.compliance_types?.id || '',
    portal_name:         account.portal_name,
    portal_url:          account.portal_url || '',
    status:              account.status,
    renewal_due_date:    account.renewal_due_date || '',
    registration_number: account.registration_number || '',
    assigned_manager_id: account.profiles?.id || '',
    internal_notes:      account.internal_notes || '',
    client_notes:        account.client_notes || '',
  });

  // Credentials edit form
  const creds = account.compliance_credentials;
  const [cForm, setCForm] = useState({
    username:            creds?.username || '',
    password:            '',
    recovery_email:      creds?.recovery_email || '',
    recovery_phone:      creds?.recovery_phone || '',
    otp_email:           creds?.otp_email || '',
    otp_mobile:          creds?.otp_mobile || '',
    otp_owner_type:      creds?.otp_owner_type || 'Client',
    otp_notes:           creds?.otp_notes || '',
    otp_status:          creds?.otp_status || 'Active',
    security_notes:      creds?.security_notes || '',
  });
  const [showPw, setShowPw] = useState(false);

  const setA = (k: keyof typeof aForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setAForm(f => ({ ...f, [k]: e.target.value }));
  const setC = (k: keyof typeof cForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setCForm(f => ({ ...f, [k]: e.target.value }));

  const showFeedback = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Save account
  async function saveAccount() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/compliance-vault/${account.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aForm),
      });
      const data = await res.json();
      if (!res.ok) { showFeedback('err', data.error || 'Save failed'); return; }
      setAccount(a => ({
        ...a,
        portal_name:         aForm.portal_name,
        portal_url:          aForm.portal_url,
        status:              aForm.status,
        renewal_due_date:    aForm.renewal_due_date || undefined,
        registration_number: aForm.registration_number || undefined,
        internal_notes:      aForm.internal_notes || undefined,
        client_notes:        aForm.client_notes || undefined,
      }));
      setEditMode(false);
      showFeedback('ok', 'Account updated');
    } catch { showFeedback('err', 'Network error'); }
    finally { setSaving(false); }
  }

  // Save credentials
  async function saveCreds() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/compliance-vault/${account.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cForm),
      });
      const data = await res.json();
      if (!res.ok) { showFeedback('err', data.error || 'Save failed'); return; }
      setAccount(a => ({
        ...a,
        compliance_credentials: {
          ...a.compliance_credentials,
          id: a.compliance_credentials?.id || '',
          ...cForm,
          has_password: Boolean(cForm.password) || Boolean(a.compliance_credentials?.has_password),
          password: undefined,
        } as Credentials,
      }));
      setCForm(f => ({ ...f, password: '' }));
      setEditCredMode(false);
      showFeedback('ok', 'Credentials saved (password encrypted)');
    } catch { showFeedback('err', 'Network error'); }
    finally { setSaving(false); }
  }

  // Reveal password
  async function revealPassword() {
    setRevealing(true);
    try {
      const res = await fetch(`/api/admin/compliance-vault/${account.id}/reveal`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { showFeedback('err', data.error || 'Reveal failed'); return; }
      setRevealedPw(data.password);
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => {
        setRevealedPw(null);
        setRevealCopied(false);
      }, 30000); // auto-hide after 30s
    } catch { showFeedback('err', 'Network error'); }
    finally { setRevealing(false); }
  }

  function copyPassword() {
    if (!revealedPw) return;
    navigator.clipboard.writeText(revealedPw).then(() => {
      setRevealCopied(true);
      setTimeout(() => setRevealCopied(false), 2000);
    });
  }

  function copyField(value: string) {
    navigator.clipboard.writeText(value);
  }

  // Renewal badge
  let renewalBadge: { label: string; cls: string } | null = null;
  if (account.renewal_due_date) {
    const days = Math.ceil((new Date(account.renewal_due_date).getTime() - Date.now()) / 86400000);
    if (days < 0) renewalBadge = { label: `Expired ${Math.abs(days)} days ago`, cls: 'bg-rose-900/30 text-rose-300' };
    else if (days <= RENEWAL_CRITICAL_DAYS) renewalBadge = { label: `Due in ${days} days — Critical`, cls: 'bg-rose-900/30 text-rose-300' };
    else if (days <= RENEWAL_WARN_DAYS) renewalBadge = { label: `Due in ${days} days`, cls: 'bg-amber-100 text-amber-700' };
    else renewalBadge = { label: `Due: ${new Date(account.renewal_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, cls: 'bg-slate-900 text-slate-500' };
  }

  const inputCls = 'w-full rounded-lg border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      {/* ── LEFT COLUMN ── */}
      <div className="space-y-5">

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-lg px-4 py-2.5 text-sm ${feedback.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-950/30 border border-rose-800/40 text-rose-300'}`}>
            {feedback.text}
          </div>
        )}

        {/* Account Info */}
        <div className="admin-card">
          <div className="admin-card-header flex items-center justify-between">
            <span>Account Information</span>
            <button onClick={() => setEditMode(m => !m)}
              className="text-xs font-medium text-teal-600 hover:text-teal-700">
              {editMode ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>
          <div className="admin-card-body">
            {!editMode ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Client', account.clients?.profiles?.company_name || account.clients?.profiles?.full_name || '—'],
                  ['Country', account.compliance_countries ? `${account.compliance_countries.flag_emoji} ${account.compliance_countries.name}` : '—'],
                  ['Compliance Type', account.compliance_types ? `[${account.compliance_types.region}] ${account.compliance_types.name}` : '—'],
                  ['Registration #', account.registration_number || '—'],
                  ['Status', null],
                  ['Renewal', null],
                  ['Assigned Manager', account.profiles?.full_name || '—'],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="admin-field-label">{label}</p>
                    {label === 'Status' ? (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACCOUNT_STATUS_COLORS[account.status as AccountStatus] || 'bg-slate-900 text-slate-500'}`}>
                        {account.status}
                      </span>
                    ) : label === 'Renewal' ? (
                      renewalBadge ? (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${renewalBadge.cls}`}>
                          {renewalBadge.label}
                        </span>
                      ) : <span className="text-slate-500 text-xs">Not set</span>
                    ) : (
                      <p className="admin-field-value">{value as string}</p>
                    )}
                  </div>
                ))}
                {account.portal_url && (
                  <div className="col-span-2">
                    <p className="admin-field-label">Portal URL</p>
                    <a href={account.portal_url} target="_blank" rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 text-sm hover:underline break-all">
                      {account.portal_url}
                    </a>
                  </div>
                )}
                {account.client_notes && (
                  <div className="col-span-2">
                    <p className="admin-field-label">Client Notes</p>
                    <p className="admin-field-value whitespace-pre-wrap">{account.client_notes}</p>
                  </div>
                )}
                {account.internal_notes && (
                  <div className="col-span-2">
                    <p className="admin-field-label">Internal Notes</p>
                    <p className="admin-field-value whitespace-pre-wrap text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{account.internal_notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Country</label>
                  <select value={aForm.country_id} onChange={setA('country_id')} className={inputCls}>
                    <option value="">Select country…</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Compliance Type</label>
                  <select value={aForm.compliance_type_id} onChange={setA('compliance_type_id')} className={inputCls}>
                    <option value="">Select type…</option>
                    {types.map(t => <option key={t.id} value={t.id}>[{t.region}] {t.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Portal Name</label>
                  <input value={aForm.portal_name} onChange={setA('portal_name')} required className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Portal URL</label>
                  <input type="url" value={aForm.portal_url} onChange={setA('portal_url')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={aForm.status} onChange={setA('status')} className={inputCls}>
                    {['Active','Inactive','Expired','Locked','Pending Setup','Unknown'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Renewal Due Date</label>
                  <input type="date" value={aForm.renewal_due_date} onChange={setA('renewal_due_date')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Registration Number</label>
                  <input value={aForm.registration_number} onChange={setA('registration_number')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Assigned Manager</label>
                  <select value={aForm.assigned_manager_id} onChange={setA('assigned_manager_id')} className={inputCls}>
                    <option value="">Unassigned</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Client Notes</label>
                  <textarea rows={2} value={aForm.client_notes} onChange={setA('client_notes')} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Internal Notes (Admin Only)</label>
                  <textarea rows={2} value={aForm.internal_notes} onChange={setA('internal_notes')} className={`${inputCls} resize-none`} />
                </div>
                <div className="col-span-2 flex gap-2 pt-1">
                  <button onClick={saveAccount} disabled={saving} className="btn-primary text-sm px-4 py-2">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Credential Vault */}
        <div className="admin-card">
          <div className="admin-card-header flex items-center justify-between">
            <span>🔐 Login Credentials</span>
            <button onClick={() => setEditCredMode(m => !m)}
              className="text-xs font-medium text-teal-600 hover:text-teal-700">
              {editCredMode ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>
          <div className="admin-card-body">
            {!editCredMode ? (
              <div className="space-y-4">
                {/* Username */}
                <div className="flex items-center gap-3 rounded-lg bg-slate-950 border border-slate-800 px-4 py-3">
                  <span className="text-xs font-medium text-slate-500 w-24 shrink-0">Username</span>
                  {creds?.username ? (
                    <>
                      <span className="text-sm font-mono text-slate-100 flex-1">{creds.username}</span>
                      <button onClick={() => copyField(creds.username!)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium">Copy</button>
                    </>
                  ) : <span className="text-sm text-slate-500">Not set</span>}
                </div>

                {/* Password */}
                <div className="rounded-lg bg-slate-950 border border-slate-800 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500 w-24 shrink-0">Password</span>
                    {creds?.has_password ? (
                      revealedPw ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-mono bg-amber-950/30 border border-amber-800/40 text-yellow-900 rounded px-3 py-1 flex-1 break-all">
                            {revealedPw}
                          </span>
                          <button onClick={copyPassword}
                            className={`text-xs font-medium px-3 py-1 rounded-lg transition ${revealCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}>
                            {revealCopied ? '✓ Copied' : 'Copy'}
                          </button>
                          <button onClick={() => { setRevealedPw(null); if (revealTimer.current) clearTimeout(revealTimer.current); }}
                            className="text-xs text-red-500 hover:text-rose-300 font-medium">Hide</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-slate-500 font-mono tracking-widest">••••••••••</span>
                          <button onClick={revealPassword} disabled={revealing}
                            className="text-xs font-medium px-3 py-1 rounded-lg bg-violet-900/30 text-violet-300 hover:bg-purple-200 disabled:opacity-60 transition">
                            {revealing ? '…' : '👁 Reveal'}
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-amber-600 font-medium">⚠️ No password stored</span>
                    )}
                  </div>
                  {revealedPw && (
                    <p className="mt-2 text-[11px] text-slate-500">Auto-hides in 30 seconds · Reveal logged to audit trail</p>
                  )}
                </div>

                {/* Recovery */}
                {(creds?.recovery_email || creds?.recovery_phone) && (
                  <div className="rounded-lg bg-blue-950/30 border border-blue-800/40 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-blue-300 mb-1">Recovery Contacts</p>
                    {creds.recovery_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-12">Email</span>
                        <span className="font-mono text-slate-200">{creds.recovery_email}</span>
                        <button onClick={() => copyField(creds.recovery_email!)} className="text-xs text-blue-400 ml-auto">Copy</button>
                      </div>
                    )}
                    {creds?.recovery_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-12">Phone</span>
                        <span className="font-mono text-slate-200">{creds.recovery_phone}</span>
                        <button onClick={() => copyField(creds.recovery_phone!)} className="text-xs text-blue-400 ml-auto">Copy</button>
                      </div>
                    )}
                  </div>
                )}

                {creds?.security_notes && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <span className="font-semibold">Security notes: </span>{creds.security_notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Username</label>
                  <input value={cForm.username} onChange={setC('username')} placeholder="portal_username" className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>New Password (leave blank to keep existing)</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={cForm.password} onChange={setC('password')}
                      placeholder="Enter to replace encrypted password…" className={`${inputCls} pr-10`} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{showPw ? '🙈' : '👁'}</button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Encrypted with AES-256-GCM before storage</p>
                </div>
                <div>
                  <label className={labelCls}>Recovery Email</label>
                  <input type="email" value={cForm.recovery_email} onChange={setC('recovery_email')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Recovery Phone</label>
                  <input value={cForm.recovery_phone} onChange={setC('recovery_phone')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Security Notes</label>
                  <input value={cForm.security_notes} onChange={setC('security_notes')} placeholder='e.g. "2FA via Authenticator"' className={inputCls} />
                </div>
                <div></div>
                <div className="col-span-2 flex gap-2 pt-1">
                  <button onClick={saveCreds} disabled={saving} className="btn-primary text-sm px-4 py-2">
                    {saving ? 'Saving…' : 'Save Credentials'}
                  </button>
                  <button onClick={() => setEditCredMode(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OTP Management */}
        <div className="admin-card">
          <div className="admin-card-header flex items-center justify-between">
            <span>📱 OTP Management</span>
            {!editCredMode && (
              <button onClick={() => setEditCredMode(true)}
                className="text-xs font-medium text-teal-600 hover:text-teal-700">✏️ Edit</button>
            )}
          </div>
          <div className="admin-card-body">
            {creds ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'OTP Email', value: creds.otp_email, copyable: true },
                  { label: 'OTP Mobile', value: creds.otp_mobile, copyable: true },
                  { label: 'OTP Controller', value: creds.otp_owner_type },
                  { label: 'OTP Status', value: null },
                ].map(f => (
                  <div key={f.label}>
                    <p className="admin-field-label">{f.label}</p>
                    {f.label === 'OTP Status' ? (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${OTP_STATUS_COLORS[(creds.otp_status || 'Unknown') as OtpStatus] || 'bg-slate-900 text-slate-500'}`}>
                        {creds.otp_status || 'Unknown'}
                      </span>
                    ) : f.value ? (
                      <div className="flex items-center gap-2">
                        <span className="admin-field-value font-mono">{f.value}</span>
                        {f.copyable && (
                          <button onClick={() => copyField(f.value!)}
                            className="text-xs text-teal-600 hover:text-teal-700 shrink-0">Copy</button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Not set</span>
                    )}
                  </div>
                ))}
                {creds.otp_notes && (
                  <div className="col-span-2 rounded-lg bg-blue-950/30 border border-blue-800/40 px-3 py-2 text-sm text-blue-300">
                    <span className="font-semibold">Note: </span>{creds.otp_notes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No credentials added yet. Click Edit to add OTP details.</p>
            )}

            {editCredMode && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
                <div>
                  <label className={labelCls}>OTP Email</label>
                  <input type="email" value={cForm.otp_email} onChange={setC('otp_email')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>OTP Mobile</label>
                  <input value={cForm.otp_mobile} onChange={setC('otp_mobile')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>OTP Controller</label>
                  <select value={cForm.otp_owner_type} onChange={setC('otp_owner_type')} className={inputCls}>
                    {['Client','Consultant','Director','Admin','Shared','Other'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>OTP Status</label>
                  <select value={cForm.otp_status} onChange={setC('otp_status')} className={inputCls}>
                    {['Active','Inaccessible','Changed','Requires Update','Unknown'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>OTP Notes</label>
                  <input value={cForm.otp_notes} onChange={setC('otp_notes')}
                    placeholder="e.g. 'OTP goes to client director&#39;s phone'" className={inputCls} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="space-y-5">
        {/* Quick links */}
        <div className="admin-card">
          <div className="admin-card-header">Quick Actions</div>
          <div className="admin-card-body space-y-2">
            {account.portal_url ? (
              <a href={account.portal_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-3 text-sm font-medium text-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition">
                🌐 Open Portal
                <span className="ml-auto text-slate-500 text-xs truncate max-w-[120px]">{account.portal_url.replace(/https?:\/\//, '')}</span>
              </a>
            ) : (
              <p className="text-xs text-slate-500">No portal URL set</p>
            )}
            <button onClick={revealPassword} disabled={revealing || !creds?.has_password}
              className="w-full flex items-center gap-2 rounded-lg border border-violet-800/40 px-4 py-3 text-sm font-medium text-violet-300 hover:bg-violet-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition">
              👁 Reveal Password
              <span className="ml-auto text-purple-400 text-xs">Logged</span>
            </button>
          </div>
        </div>

        {/* Account metadata */}
        <div className="admin-card">
          <div className="admin-card-header">Account Details</div>
          <div className="admin-card-body text-xs space-y-2">
            {[
              ['Created', new Date(account.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
              ['Last Updated', new Date(account.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
              ['Account ID', account.id],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">{k}</span>
                <span className="text-slate-400 font-mono text-right ml-auto truncate max-w-[160px]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="admin-card">
          <div className="admin-card-header">Audit Log</div>
          <div className="admin-card-body">
            {!account.compliance_activity_logs?.length ? (
              <p className="text-xs text-slate-500">No activity recorded yet.</p>
            ) : (
              <ol className="relative border-l border-slate-800 space-y-4 ml-2">
                {account.compliance_activity_logs.slice(0, 20).map(log => (
                  <li key={log.id} className="ml-4">
                    <div className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white ${
                      log.action.includes('reveal') ? 'bg-purple-500'
                        : log.action.includes('deleted') ? 'bg-red-500'
                        : log.action.includes('created') ? 'bg-emerald-500'
                        : 'bg-teal-500'
                    }`} />
                    <p className="text-xs font-medium text-slate-100">
                      {ACTION_LABELS[log.action] || log.action}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {log.profiles?.full_name || log.actor_role || 'System'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
