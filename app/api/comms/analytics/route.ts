import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';

// GET /api/comms/analytics
// Query params: days=30, region=India, account_id=<uuid>
export async function GET(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days      = parseInt(searchParams.get('days') ?? '30');
  const region    = searchParams.get('region') ?? '';
  const accountId = searchParams.get('account_id') ?? '';

  const client    = getCommsAdminClient();
  const since     = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Regional scoping for Regional Manager
  const regionFilter = actor.role === 'comms_regional_manager' && actor.commsRegion
    ? actor.commsRegion
    : region;

  // ── Fetch snapshots ───────────────────────────────────────
  let snapQuery = client
    .from('comms_metrics_snapshots')
    .select('*')
    .gte('snapshot_date', since)
    .order('snapshot_date', { ascending: true });

  if (accountId) snapQuery = snapQuery.eq('account_id', accountId);
  if (regionFilter) snapQuery = snapQuery.eq('region', regionFilter);

  const { data: snapshots } = await snapQuery;

  // ── Latest follower count per platform (most recent snapshot per connection) ──
  const latestByPlatform: Record<string, { followers: number; reach: number; impressions: number; engagement_rate: number }> = {};
  const snapshotsByDate:  Record<string, Record<string, number>> = {};

  for (const s of snapshots ?? []) {
    // Accumulate by platform
    if (!latestByPlatform[s.platform]) {
      latestByPlatform[s.platform] = { followers: 0, reach: 0, impressions: 0, engagement_rate: 0 };
    }
    // Keep latest per connection (snapshots are sorted by date asc, so later rows overwrite)
    latestByPlatform[s.platform].followers  = Math.max(latestByPlatform[s.platform].followers, s.followers ?? 0);
    latestByPlatform[s.platform].reach      += s.reach ?? 0;
    latestByPlatform[s.platform].impressions += s.impressions ?? 0;

    // Build time series: { date: { platform: followers } }
    if (!snapshotsByDate[s.snapshot_date]) snapshotsByDate[s.snapshot_date] = {};
    snapshotsByDate[s.snapshot_date][s.platform] =
      (snapshotsByDate[s.snapshot_date][s.platform] ?? 0) + (s.followers ?? 0);
  }

  const byPlatform = Object.entries(latestByPlatform).map(([platform, m]) => ({
    platform,
    followers:       m.followers,
    reach:           m.reach,
    impressions:     m.impressions,
    engagement_rate: m.reach > 0 ? parseFloat(((m.engagement_rate) * 100 / m.reach).toFixed(2)) : 0,
  }));

  const totalFollowers    = byPlatform.reduce((s, p) => s + p.followers, 0);
  const totalReach        = byPlatform.reduce((s, p) => s + p.reach, 0);
  const totalImpressions  = byPlatform.reduce((s, p) => s + p.impressions, 0);
  const avgEngagement     = byPlatform.length > 0
    ? parseFloat((byPlatform.reduce((s, p) => s + p.engagement_rate, 0) / byPlatform.length).toFixed(2))
    : 0;

  const growthSeries = Object.entries(snapshotsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, platforms]) => ({ date, ...platforms }));

  // ── Top posts ─────────────────────────────────────────────
  let postQuery = client
    .from('comms_post_metrics')
    .select('id, platform, account_id, post_text, reach, impressions, likes, comments, shares, engagement_rate, posted_at')
    .gte('posted_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('engagement_rate', { ascending: false })
    .limit(10);

  if (accountId) postQuery = postQuery.eq('account_id', accountId);

  const { data: topPosts } = await postQuery;

  // ── Connected accounts summary ─────────────────────────────
  let connQuery = client
    .from('comms_platform_connections')
    .select('id, platform, platform_account_name, status, last_synced_at, account_id, comms_accounts(display_name, region)');

  if (accountId) connQuery = connQuery.eq('account_id', accountId);
  if (regionFilter) connQuery = (connQuery as any).eq('comms_accounts.region', regionFilter);

  const { data: connections } = await connQuery;

  return NextResponse.json({
    overview: { totalFollowers, totalReach, totalImpressions, avgEngagement },
    byPlatform,
    growthSeries,
    topPosts:    topPosts ?? [],
    connections: connections ?? [],
    meta:        { days, region: regionFilter, accountId, since },
  });
}
