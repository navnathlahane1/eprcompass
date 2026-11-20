'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CredentialField from '@/components/comms/CredentialField';
import HandoverExport from '@/components/comms/HandoverExport';
import ConnectionStatus, { type ConnectionData } from '@/components/comms/ConnectionStatus';

const SUPPORTED_CONNECT_PLATFORMS = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube'];

const PLATFORM_LABELS: Record<string, string> = {
  linkedin:'LinkedIn', twitter:'X / Twitter', facebook:'Facebook', instagram:'Instagram',
  youtube:'YouTube', tiktok:'TikTok', pinterest:'Pinterest', threads:'Threads',
  google_business:'Google Business', other:'Other',
};
const ENTITY_LABELS: Record<string, string> = {
  neubrain:'Neubrain', ecovijay_growth:'EPR Compass', eco_vijay_global:'EPR Compass',
  eco_vijay_events:'EPR Compass Events', eco_vijay_academy:'EPR Compass Academy',
};
const CRED_FIELD_OPTIONS = [
  { value: 'login_email', label: 'Login Email' }, { value: 'password', label: 'Password' },
  { value: 'twofa_method', label: '2FA Method' }, { value: 'backup_codes', label: '2FA Backup Codes' },
  { value: 'recovery_email', label: 'Recovery Email' }, { value: 'recovery_phone', label: 'Recovery Phone' },
  { value: 'ad_account_ids', label: 'Ad Account IDs' }, { value: 'api_keys', label: 'API Keys' },
  { value: 'other', label: 'Other' },
];

type Tab = 'overview' | 'credentials' | 'owners' | 'handover' | 'connections';

interface Permissions { canEdit: boolean; canDelete: boolean; canViewMasked: boolean; canReveal: boolean; canCreate: boolean; canManageConnections?: boolean; }

export default function AccountDetailClient({ account, owners, checklist, credentialFields, connections, currentUserId, permissions }: {
  account: any; owners: any[]; checklist: any[]; credentialFields: any[]; connections?: ConnectionData[]; currentUserId: string; permissions: Permissions;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [localChecklist, setLocalChecklist] = useState<any[]>(checklist);
  const [localCreds, setLocalCreds] = useState<any[]>(credentialFields);
  const [showAddCred, setShowAddCred] = useState(false);
  const [credForm, setCredForm] = useState({ field_name: 'password', field_label: '', value: '' });
  const [savingCred, setSavingCred] = useState(false);
  const [credError, setCredError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const connCount = connections?.filter(c => c.status === 'connected').length ?? 0;
  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'credentials',  label: `Credentials (${localCreds.length})` },
    { id: 'owners',       label: 'Owners' },
    { id: 'handover',     label: 'Handover' },
    { id: 'connections',  label: `Connections${connCount > 0 ? ` (${connCount})` : ''}` },
  ];

  const STATUS_STYLES: Record<string, string> = {
    active:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dormant:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    archived: 'bg-slate-700/60 text-slate-500 border border-slate-700',
  };

  async function toggleChecklist(itemId: string, isDone: boolean) {
    setLocalChecklist(prev => prev.map(i => i.id === itemId ? { ...i, is_done: !isDone } : i));
    await fetch(`/api/comms/accounts/${account.id}/checklist`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, is_done: !isDone }),
    });
  }

  async function addCredential() {
    if (!credForm.value) { setCredError('Value is required'); return; }
    setSavingCred(true); setCredError('');
    const res = await fetch(`/api/comms/accounts/${account.id}/credentials`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(credForm),
    });
    const data = await res.json();
    setSavingCred(false);
    if (!res.ok) { setCredError(data.error || 'Failed'); return; }
    setLocalCreds(prev => [...prev, { id: data.credId, field_name: credForm.field_name, field_label: credForm.field_label || null, created_at: new Date().toISOString() }]);
    setShowAddCred(false);
    setCredForm({ field_name: 'password', field_label: '', value: '' });
  }

  async function deleteAccount() {
    if (!confirm(`Soft-delete "${account.display_name}"? This action can only be reversed by an admin.`)) return;
    setDeletingId(account.id);
    await fetch(`/api/comms/accounts/${account.id}`, { method: 'DELETE' });
    router.push('/comms/vault');
  }

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30';

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/comms/vault" className="text-slate-500 hover:text-slate-200 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{account.display_name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[account.status] ?? ''}`}>
                {account.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {PLATFORM_LABELS[account.platform]} · {ENTITY_LABELS[account.brand_entity]}
              {account.region && ` · ${account.region}`}
            </p>
          </div>
        </div>
        {permissions.canDelete && (
          <button onClick={deleteAccount} disabled={!!deletingId}
            className="text-xs text-slate-600 hover:text-rose-400 transition px-2 py-1 rounded">
            Delete
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800/60">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Platform',     value: PLATFORM_LABELS[account.platform] },
              { label: 'Account Type', value: account.account_type.replace(/_/g,' ') },
              { label: 'Brand Entity', value: ENTITY_LABELS[account.brand_entity] },
              { label: 'Region',       value: account.region || 'Global' },
              account.handle && { label: 'Handle', value: `@${account.handle.replace(/^@/,'')}` },
            ].filter(Boolean).map((f: any) => (
              <div key={f.label}>
                <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">{f.label}</p>
                <p className="text-sm text-slate-300 mt-0.5 capitalize">{f.value}</p>
              </div>
            ))}
          </div>
          {(account.profile_url || account.login_url) && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-800/60">
              {account.profile_url && (
                <a href={account.profile_url} target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline">
                  Profile <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              )}
              {account.login_url && (
                <a href={account.login_url} target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline">
                  Login <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              )}
            </div>
          )}
          {account.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/60">
              {account.tags.map((t: string) => (
                <span key={t} className="rounded px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400">{t}</span>
              ))}
            </div>
          )}
          {account.notes && (
            <div className="pt-3 border-t border-slate-800/60">
              <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">Notes / SOP</p>
              <p className="text-sm text-slate-400 whitespace-pre-wrap">{account.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Credentials */}
      {tab === 'credentials' && (
        <div className="space-y-3">
          {!permissions.canViewMasked && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
              You don't have permission to view credentials for this account.
            </div>
          )}
          {permissions.canViewMasked && localCreds.length === 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-8 text-center">
              <p className="text-sm text-slate-500">No credentials stored yet.</p>
            </div>
          )}
          {permissions.canViewMasked && localCreds.map(cred => (
            <CredentialField
              key={cred.id}
              credId={cred.id}
              accountId={account.id}
              fieldName={cred.field_name}
              fieldLabel={cred.field_label}
              canReveal={permissions.canReveal}
              canViewMasked={permissions.canViewMasked}
            />
          ))}

          {permissions.canCreate && (
            <div className="pt-2">
              {!showAddCred ? (
                <button onClick={() => setShowAddCred(true)}
                  className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 transition">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Add credential
                </button>
              ) : (
                <div className="rounded-xl border border-slate-700/60 bg-[#0c1022] p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-300">Add Credential</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={credForm.field_name} onChange={e => setCredForm(f => ({ ...f, field_name: e.target.value }))} className={inputCls}>
                      {CRED_FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input type="text" placeholder="Custom label (optional)" value={credForm.field_label}
                      onChange={e => setCredForm(f => ({ ...f, field_label: e.target.value }))} className={inputCls} />
                  </div>
                  <input type="password" placeholder="Value (will be encrypted)" value={credForm.value}
                    onChange={e => setCredForm(f => ({ ...f, value: e.target.value }))} className={inputCls} />
                  {credError && <p className="text-xs text-rose-400">{credError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowAddCred(false); setCredError(''); }}
                      className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
                      Cancel
                    </button>
                    <button onClick={addCredential} disabled={savingCred}
                      className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                      {savingCred ? 'Encrypting & saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Owners */}
      {tab === 'owners' && (
        <div className="space-y-3">
          {owners.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No owners assigned.</p>
          ) : (
            owners.map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-[#0c1022] px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  {(o.profiles?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{o.profiles?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-500 capitalize">{o.owner_role} owner</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  o.owner_role === 'primary' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/60 text-slate-400 border border-slate-700'
                }`}>
                  {o.owner_role}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Connections */}
      {tab === 'connections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Platform API connections for live analytics</p>
            <Link href="/comms/analytics" className="text-xs text-emerald-500 hover:text-emerald-400 transition">
              View Analytics →
            </Link>
          </div>

          {/* Existing connections */}
          {(connections ?? []).length > 0 && (
            <div className="space-y-2">
              {(connections ?? []).map(c => (
                <ConnectionStatus
                  key={c.id}
                  connection={c}
                  accountId={account.id}
                  canManage={permissions.canManageConnections ?? false}
                />
              ))}
            </div>
          )}

          {/* Connect buttons for supported platforms */}
          {permissions.canManageConnections && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Connect a platform
              </p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_CONNECT_PLATFORMS
                  .filter(p => !(connections ?? []).find(c => c.platform === p && c.status === 'connected'))
                  .map(platform => (
                    <a
                      key={platform}
                      href={`/api/comms/connect/${platform}?account_id=${account.id}`}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition capitalize"
                    >
                      + {platform === 'google_business' ? 'Google Business' : platform}
                    </a>
                  ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-700">
                Requires platform API credentials in .env.local. Tokens are stored encrypted.
              </p>
            </div>
          )}

          {(connections ?? []).length === 0 && !permissions.canManageConnections && (
            <p className="text-sm text-slate-600 py-4">No platform connections. Requires connections:manage permission.</p>
          )}
        </div>
      )}

      {/* Handover */}
      {tab === 'handover' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {localChecklist.filter(i => i.is_done).length} / {localChecklist.length} items complete
            </p>
            <HandoverExport accountId={account.id} accountName={account.display_name} />
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] divide-y divide-slate-800/60">
            {localChecklist.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No checklist items.</p>
            ) : (
              localChecklist.map(item => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleChecklist(item.id, item.is_done)}
                    disabled={!permissions.canEdit}
                    className={`mt-0.5 h-4.5 w-4.5 shrink-0 rounded border transition ${
                      item.is_done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-600 bg-transparent hover:border-emerald-500'
                    } ${!permissions.canEdit ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {item.is_done && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${item.is_done ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                      {item.item}
                    </p>
                    {item.is_done && item.profiles?.full_name && (
                      <p className="text-[10px] text-slate-700 mt-0.5">Done by {item.profiles.full_name}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
