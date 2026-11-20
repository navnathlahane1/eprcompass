'use client';

import { useState } from 'react';

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  expired:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  revoked:   'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  error:     'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  pending:   'bg-slate-700/60 text-slate-400 border border-slate-700',
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin:'LinkedIn', twitter:'X/Twitter', facebook:'Facebook', instagram:'Instagram',
  youtube:'YouTube', tiktok:'TikTok', pinterest:'Pinterest', threads:'Threads',
  google_business:'Google Business', other:'Other',
};

export interface ConnectionData {
  id:                    string;
  platform:              string;
  platform_account_name: string | null;
  platform_account_url:  string | null;
  status:                string;
  last_synced_at:        string | null;
  sync_error:            string | null;
  scopes:                string[];
}

interface Props {
  connection: ConnectionData;
  accountId:  string;
  canManage:  boolean;
  onSynced?:  () => void;
}

export default function ConnectionStatus({ connection, accountId, canManage, onSynced }: Props) {
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState('');
  const [disconnecting, setDis]     = useState(false);

  async function handleSync() {
    setSyncing(true); setSyncMsg('');
    const res = await fetch('/api/comms/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ connection_id: connection.id }),
    });
    const d = await res.json();
    setSyncing(false);
    setSyncMsg(d.success ? 'Synced ✓' : d.error ?? 'Sync failed');
    if (d.success) onSynced?.();
    setTimeout(() => setSyncMsg(''), 4000);
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${PLATFORM_LABELS[connection.platform]}? Stored tokens will be deleted.`)) return;
    setDis(true);
    await fetch(`/api/comms/connect/${connection.platform}/disconnect`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ account_id: accountId }),
    });
    setDis(false);
    window.location.reload();
  }

  const lastSynced = connection.last_synced_at
    ? `Synced ${new Date(connection.last_synced_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`
    : 'Never synced';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-[#0c1022] px-4 py-3">
      {/* Platform icon placeholder */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
        {connection.platform.slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200">{PLATFORM_LABELS[connection.platform]}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[connection.status] ?? ''}`}>
            {connection.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {connection.platform_account_name && (
            <>
              {connection.platform_account_url
                ? <a href={connection.platform_account_url} target="_blank" rel="noopener" className="hover:text-slate-300 transition">{connection.platform_account_name}</a>
                : connection.platform_account_name
              }
              {' · '}
            </>
          )}
          {lastSynced}
        </p>
        {connection.sync_error && (
          <p className="text-[10px] text-rose-400 mt-0.5 truncate">{connection.sync_error}</p>
        )}
        {syncMsg && (
          <p className={`text-[10px] mt-0.5 ${syncMsg.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{syncMsg}</p>
        )}
      </div>

      {canManage && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleSync} disabled={syncing}
            title="Sync now"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-700 hover:text-emerald-400 transition disabled:opacity-50">
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={handleDisconnect} disabled={disconnecting}
            title="Disconnect"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-700 hover:text-rose-400 transition disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
