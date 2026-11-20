import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const client = getCommsAdminClient();

  // Get connections and latest snapshots server-side for initial render
  const [connectionsRes, snapshotsRes] = await Promise.all([
    client.from('comms_platform_connections')
      .select('id, platform, platform_account_name, platform_account_url, status, last_synced_at, sync_error, scopes, account_id, comms_accounts(display_name, region)')
      .order('platform'),
    client.from('comms_metrics_snapshots')
      .select('platform, snapshot_date, followers, reach, impressions, engagement_rate, account_id')
      .gte('snapshot_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order('snapshot_date', { ascending: true })
      .limit(500),
  ]);

  const canManage = await checkCommsPermission(user.role, 'connections:manage');

  // Derive platforms from connections
  const activePlatforms = [...new Set((connectionsRes.data ?? [])
    .filter(c => c.status === 'connected')
    .map(c => c.platform))];

  // Build growth series from snapshots
  const seriesMap: Record<string, Record<string, number>> = {};
  for (const s of snapshotsRes.data ?? []) {
    if (!seriesMap[s.snapshot_date]) seriesMap[s.snapshot_date] = {};
    seriesMap[s.snapshot_date][s.platform] =
      (seriesMap[s.snapshot_date][s.platform] ?? 0) + (s.followers ?? 0);
  }
  const growthSeries = Object.entries(seriesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, platforms]) => ({ date, ...platforms }));

  // Platform summary (latest snapshot per platform)
  const latestByPlatform: Record<string, any> = {};
  for (const s of snapshotsRes.data ?? []) {
    if (!latestByPlatform[s.platform] || s.snapshot_date > latestByPlatform[s.platform].snapshot_date) {
      latestByPlatform[s.platform] = s;
    }
  }
  const byPlatform = Object.values(latestByPlatform).map((s: any) => ({
    platform:        s.platform,
    followers:       s.followers ?? 0,
    reach:           s.reach ?? 0,
    impressions:     s.impressions ?? 0,
    engagement_rate: s.engagement_rate ?? 0,
  }));

  const totalFollowers   = byPlatform.reduce((acc, p) => acc + p.followers, 0);
  const totalReach       = byPlatform.reduce((acc, p) => acc + p.reach, 0);
  const totalImpressions = byPlatform.reduce((acc, p) => acc + p.impressions, 0);

  const failedConnections = (connectionsRes.data ?? [])
    .filter(c => c.status === 'error' || c.status === 'expired')
    .map(c => ({
      id:       c.id,
      platform: c.platform,
      status:   c.status,
      error:    (c as any).sync_error ?? null,
      account:  (c.comms_accounts as any)?.display_name ?? null,
    }));

  return (
    <AnalyticsClient
      connections={connectionsRes.data ?? []}
      byPlatform={byPlatform}
      growthSeries={growthSeries}
      activePlatforms={activePlatforms}
      overview={{ totalFollowers, totalReach, totalImpressions }}
      canManage={canManage}
      userRole={user.role}
      failedConnections={failedConnections}
    />
  );
}
