'use client';

import { useState } from 'react';
import Link from 'next/link';
import MetricCard from '@/components/comms/MetricCard';
import FollowerChart from '@/components/comms/FollowerChart';
import EngagementChart from '@/components/comms/EngagementChart';
import ConnectionStatus, { type ConnectionData } from '@/components/comms/ConnectionStatus';

type ChartMetric = 'followers' | 'reach' | 'impressions' | 'engagement_rate';

interface FailedConnection {
  id: string; platform: string; status: string; error: string | null; account: string | null;
}

interface Props {
  connections:       any[];
  byPlatform:        Array<{ platform: string; followers: number; reach: number; impressions: number; engagement_rate: number }>;
  growthSeries:      Array<{ date: string; [k: string]: string | number }>;
  activePlatforms:   string[];
  overview:          { totalFollowers: number; totalReach: number; totalImpressions: number };
  canManage:         boolean;
  userRole:          string;
  failedConnections?: FailedConnection[];
}

export default function AnalyticsClient({ connections, byPlatform, growthSeries, activePlatforms, overview, canManage, failedConnections = [] }: Props) {
  const [chartMetric, setChartMetric] = useState<ChartMetric>('followers');
  const [syncing, setSyncing]         = useState(false);
  const [syncMsg, setSyncMsg]         = useState('');

  async function syncAll() {
    setSyncing(true); setSyncMsg('');
    const res = await fetch('/api/comms/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const d = await res.json();
    setSyncing(false);
    setSyncMsg(`Synced ${d.synced ?? 0} connections${d.failed ? `, ${d.failed} failed` : ''}`);
    setTimeout(() => setSyncMsg(''), 5000);
  }

  const METRIC_OPTIONS: { value: ChartMetric; label: string }[] = [
    { value: 'followers',       label: 'Followers' },
    { value: 'reach',           label: 'Reach' },
    { value: 'impressions',     label: 'Impressions' },
    { value: 'engagement_rate', label: 'Engagement %' },
  ];

  const connectedCount = connections.filter(c => c.status === 'connected').length;

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const visibleFailed = failedConnections.filter(c => !dismissedAlerts.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Sync failure alerts */}
      {visibleFailed.length > 0 && (
        <div className="space-y-2">
          {visibleFailed.map(fc => (
            <div key={fc.id} className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-rose-300 capitalize">
                  {fc.platform} {fc.status === 'expired' ? 'token expired' : 'sync error'}
                  {fc.account && <span className="font-normal text-rose-400"> — {fc.account}</span>}
                </p>
                {fc.error && (
                  <p className="text-[10px] text-rose-500 mt-0.5 font-mono truncate">{fc.error}</p>
                )}
                <p className="text-[10px] text-rose-600 mt-0.5">
                  Go to the{' '}
                  <Link href="/comms/vault" className="text-rose-400 hover:underline">Account Vault</Link>
                  {' '}→ Connections tab to reconnect.
                </p>
              </div>
              <button onClick={() => setDismissedAlerts(d => [...d, fc.id])}
                className="text-rose-700 hover:text-rose-400 transition shrink-0" title="Dismiss">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {connectedCount} platform{connectedCount !== 1 ? 's' : ''} connected · last 30 days
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            {syncMsg && <p className="text-xs text-emerald-400">{syncMsg}</p>}
            <button onClick={syncAll} disabled={syncing}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition">
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync All'}
            </button>
          </div>
        )}
      </div>

      {/* No connections CTA */}
      {connectedCount === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#0c1022]/60 p-10 text-center space-y-3">
          <p className="text-sm font-medium text-slate-400">No platforms connected yet</p>
          <p className="text-xs text-slate-600">Go to an account in the Vault, open the Connections tab, and connect a platform.</p>
          <Link href="/comms/vault" className="inline-block text-xs text-emerald-500 hover:text-emerald-400 transition">
            Open Account Vault →
          </Link>
        </div>
      )}

      {connectedCount > 0 && (
        <>
          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Followers"   value={overview.totalFollowers}   icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" color="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" />
            <MetricCard label="Total Reach (30d)" value={overview.totalReach}       icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" color="text-sky-400 bg-sky-500/10 border-sky-500/20" />
            <MetricCard label="Impressions (30d)" value={overview.totalImpressions} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" color="text-violet-400 bg-violet-500/10 border-violet-500/20" />
            <MetricCard label="Active Connections" value={connectedCount}           icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" color="text-amber-400 bg-amber-500/10 border-amber-500/20" mono={false} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Follower growth — 2/3 width */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
              <p className="text-sm font-semibold text-slate-200 mb-4">Follower Growth</p>
              {growthSeries.length > 0
                ? <FollowerChart data={growthSeries} platforms={activePlatforms} />
                : <p className="text-xs text-slate-600 text-center py-10">No historical data yet. Run a sync to populate.</p>
              }
            </div>

            {/* Platform comparison — 1/3 */}
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-200">By Platform</p>
                <select value={chartMetric} onChange={e => setChartMetric(e.target.value as ChartMetric)}
                  className="text-xs rounded border border-slate-700 bg-slate-900 text-slate-400 px-2 py-1 outline-none">
                  {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <EngagementChart data={byPlatform} metric={chartMetric} />
            </div>
          </div>

          {/* Platform table */}
          {byPlatform.length > 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800/60">
                <p className="text-sm font-semibold text-slate-200">Platform Summary</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800/40 bg-[#050c14]">
                    {['Platform','Followers','Reach','Impressions','Eng. Rate'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byPlatform.map(p => (
                    <tr key={p.platform} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition">
                      <td className="px-4 py-2.5 font-medium text-slate-300 capitalize">{p.platform.replace('_',' ')}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{p.followers.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{p.reach.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{p.impressions.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{p.engagement_rate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Connected accounts list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-300">Platform Connections</p>
          <Link href="/comms/vault" className="text-xs text-emerald-500 hover:text-emerald-400 transition">
            Manage in Vault →
          </Link>
        </div>
        {connections.length === 0 ? (
          <p className="text-xs text-slate-600">No connections yet.</p>
        ) : (
          <div className="space-y-2">
            {connections.map(c => (
              <ConnectionStatus
                key={c.id}
                connection={c as ConnectionData}
                accountId={c.account_id}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
