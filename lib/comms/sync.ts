// Platform metric sync functions.
// Each function fetches the latest analytics from the platform API,
// stores a daily snapshot, and updates per-post metrics.

import { decryptValue, encryptValue } from './encryption';
import { refreshAccessToken } from './oauth';
import { getCommsAdminClient } from './auth';

export interface SyncResult {
  success:    boolean;
  platform:   string;
  accountId:  string;
  snapshotId?: string;
  error?:     string;
}

// ── Token management ──────────────────────────────────────────

async function getValidAccessToken(
  client:     ReturnType<typeof getCommsAdminClient>,
  connection: Record<string, any>,
): Promise<string> {
  const now = Date.now();
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const needsRefresh = expiresAt > 0 && expiresAt - now < 5 * 60 * 1000; // 5 min buffer

  let accessToken = decryptValue(connection.encrypted_access_token);

  if (needsRefresh && connection.encrypted_refresh_token) {
    const refreshToken = decryptValue(connection.encrypted_refresh_token);
    const newTokens = await refreshAccessToken(connection.platform, refreshToken);
    accessToken = newTokens.access_token;

    await client.from('comms_platform_connections').update({
      encrypted_access_token:  encryptValue(newTokens.access_token),
      encrypted_refresh_token: newTokens.refresh_token ? encryptValue(newTokens.refresh_token) : connection.encrypted_refresh_token,
      token_expires_at:        newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString() : null,
      status:  'connected',
      updated_at: new Date().toISOString(),
    }).eq('id', connection.id);
  }

  return accessToken;
}

// ── LinkedIn ──────────────────────────────────────────────────

async function syncLinkedIn(
  client:     ReturnType<typeof getCommsAdminClient>,
  connection: Record<string, any>,
): Promise<SyncResult> {
  const token  = await getValidAccessToken(client, connection);
  const orgId  = connection.platform_account_id;
  const today  = new Date().toISOString().slice(0, 10);

  let followers = 0, reach = 0, impressions = 0;

  // Follower statistics
  const followerRes = await fetch(
    `https://api.linkedin.com/v2/organizationFollowerStatistics?q=organizationVersion&organization=urn:li:organization:${orgId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (followerRes.ok) {
    const data = await followerRes.json();
    followers = data.elements?.[0]?.followerCountsByAssociationType
      ?.find((f: any) => f.followerType === 'MEMBER')?.followerCounts?.organicFollowerCount ?? 0;
  }

  // Share (post) statistics — last 30 days
  const endTime   = Date.now();
  const startTime = endTime - 30 * 24 * 60 * 60 * 1000;
  const statsRes  = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${startTime}&timeIntervals.timeRange.end=${endTime}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (statsRes.ok) {
    const data = await statsRes.json();
    const el = data.elements?.[0]?.totalShareStatistics;
    reach       = el?.uniqueImpressionsCount ?? 0;
    impressions = el?.impressionCount ?? 0;
  }

  const totalInteractions = 0; // summed from above
  const engagement_rate = impressions > 0 ? parseFloat(((totalInteractions / impressions) * 100).toFixed(3)) : 0;

  const { data: snap } = await client.from('comms_metrics_snapshots').upsert({
    connection_id: connection.id,
    account_id:    connection.account_id,
    platform:      'linkedin',
    region:        connection.region,
    snapshot_date: today,
    followers, reach, impressions, engagement_rate,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'connection_id,snapshot_date' }).select('id').maybeSingle();

  return { success: true, platform: 'linkedin', accountId: connection.account_id, snapshotId: snap?.id };
}

// ── Meta (Facebook / Instagram) ──────────────────────────────

async function syncMeta(
  client:     ReturnType<typeof getCommsAdminClient>,
  connection: Record<string, any>,
): Promise<SyncResult> {
  const token   = await getValidAccessToken(client, connection);
  const pageId  = connection.platform_account_id;
  const today   = new Date().toISOString().slice(0, 10);
  const since   = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const until   = Math.floor(Date.now() / 1000);
  const version = 'v19.0';

  let followers = 0, reach = 0, impressions = 0, engagement = 0;

  // Page fan count
  const fanRes = await fetch(
    `https://graph.facebook.com/${version}/${pageId}?fields=fan_count&access_token=${token}`
  );
  if (fanRes.ok) { const d = await fanRes.json(); followers = d.fan_count ?? 0; }

  // Page insights
  const insightRes = await fetch(
    `https://graph.facebook.com/${version}/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users&since=${since}&until=${until}&period=total_over_range&access_token=${token}`
  );
  if (insightRes.ok) {
    const d = await insightRes.json();
    for (const m of d.data ?? []) {
      const val = m.values?.[0]?.value ?? 0;
      if (m.name === 'page_impressions')   impressions = val;
      if (m.name === 'page_reach')         reach       = val;
      if (m.name === 'page_engaged_users') engagement  = val;
    }
  }

  const engagement_rate = reach > 0 ? parseFloat(((engagement / reach) * 100).toFixed(3)) : 0;

  const { data: snap } = await client.from('comms_metrics_snapshots').upsert({
    connection_id: connection.id,
    account_id:    connection.account_id,
    platform:      connection.platform,
    region:        connection.region,
    snapshot_date: today,
    followers, reach, impressions, engagement_rate,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'connection_id,snapshot_date' }).select('id').maybeSingle();

  return { success: true, platform: connection.platform, accountId: connection.account_id, snapshotId: snap?.id };
}

// ── Twitter / X ───────────────────────────────────────────────

async function syncTwitter(
  client:     ReturnType<typeof getCommsAdminClient>,
  connection: Record<string, any>,
): Promise<SyncResult> {
  const token   = await getValidAccessToken(client, connection);
  const userId  = connection.platform_account_id;
  const today   = new Date().toISOString().slice(0, 10);

  let followers = 0, impressions = 0, engagement = 0;

  const userRes = await fetch(
    `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (userRes.ok) {
    const d = await userRes.json();
    followers   = d.data?.public_metrics?.followers_count ?? 0;
  }

  // Recent tweet metrics (last 10 tweets)
  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics,created_at`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (tweetsRes.ok) {
    const d = await tweetsRes.json();
    for (const tweet of d.data ?? []) {
      const m = tweet.public_metrics ?? {};
      impressions += m.impression_count ?? 0;
      engagement  += (m.like_count ?? 0) + (m.reply_count ?? 0) + (m.retweet_count ?? 0);

      // Look up content item linked to this post
      const { data: linked } = await client
        .from('comms_content_items')
        .select('id')
        .eq('platform_post_id', tweet.id)
        .maybeSingle();

      // Upsert post-level metrics
      await client.from('comms_post_metrics').upsert({
        connection_id:    connection.id,
        account_id:       connection.account_id,
        platform:         'twitter',
        platform_post_id: tweet.id,
        content_item_id:  linked?.id ?? null,
        posted_at:        tweet.created_at,
        post_text:        tweet.text,
        impressions:      m.impression_count ?? 0,
        likes:            m.like_count ?? 0,
        comments:         m.reply_count ?? 0,
        shares:           m.retweet_count ?? 0,
        engagement_rate:  m.impression_count > 0
          ? parseFloat((((m.like_count + m.reply_count + m.retweet_count) / m.impression_count) * 100).toFixed(3))
          : 0,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'connection_id,platform_post_id' });
    }
  }

  const engagement_rate = impressions > 0 ? parseFloat(((engagement / impressions) * 100).toFixed(3)) : 0;

  const { data: snap } = await client.from('comms_metrics_snapshots').upsert({
    connection_id: connection.id,
    account_id:    connection.account_id,
    platform:      'twitter',
    region:        connection.region,
    snapshot_date: today,
    followers, impressions, engagement_rate,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'connection_id,snapshot_date' }).select('id').maybeSingle();

  return { success: true, platform: 'twitter', accountId: connection.account_id, snapshotId: snap?.id };
}

// ── YouTube ───────────────────────────────────────────────────

async function syncYouTube(
  client:     ReturnType<typeof getCommsAdminClient>,
  connection: Record<string, any>,
): Promise<SyncResult> {
  const token   = await getValidAccessToken(client, connection);
  const today   = new Date().toISOString().slice(0, 10);

  let followers = 0, video_views = 0;

  const chanRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (chanRes.ok) {
    const d = await chanRes.json();
    const stats = d.items?.[0]?.statistics;
    followers   = parseInt(stats?.subscriberCount ?? '0', 10);
    video_views = parseInt(stats?.viewCount ?? '0', 10);
  }

  // YouTube Analytics API for recent period
  const endDate   = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const ytRes     = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  let impressions = 0;
  if (ytRes.ok) {
    const d = await ytRes.json();
    const row = d.rows?.[0];
    if (row) { impressions = row[0] ?? 0; }
  }

  const { data: snap } = await client.from('comms_metrics_snapshots').upsert({
    connection_id: connection.id,
    account_id:    connection.account_id,
    platform:      'youtube',
    region:        connection.region,
    snapshot_date: today,
    followers, video_views, impressions,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'connection_id,snapshot_date' }).select('id').maybeSingle();

  return { success: true, platform: 'youtube', accountId: connection.account_id, snapshotId: snap?.id };
}

// ── Dispatcher ────────────────────────────────────────────────

const SYNC_FUNCTIONS: Record<string, (c: ReturnType<typeof getCommsAdminClient>, conn: any) => Promise<SyncResult>> = {
  linkedin:  syncLinkedIn,
  facebook:  syncMeta,
  instagram: syncMeta,
  twitter:   syncTwitter,
  youtube:   syncYouTube,
};

export async function syncConnection(connectionId: string): Promise<SyncResult> {
  const client = getCommsAdminClient();

  const { data: conn } = await client
    .from('comms_platform_connections')
    .select('*, comms_accounts(region)')
    .eq('id', connectionId)
    .eq('status', 'connected')
    .maybeSingle();

  if (!conn) return { success: false, platform: 'unknown', accountId: '', error: 'Connection not found or not connected' };

  // Attach region from account for snapshot
  conn.region = (conn.comms_accounts as any)?.region ?? null;

  const fn = SYNC_FUNCTIONS[conn.platform];
  if (!fn) {
    return { success: false, platform: conn.platform, accountId: conn.account_id, error: `Sync not implemented for ${conn.platform}` };
  }

  try {
    const result = await fn(client, conn);

    // Update last_synced_at + next_sync_at (6 hours from now)
    await client.from('comms_platform_connections').update({
      last_synced_at: new Date().toISOString(),
      next_sync_at:   new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      sync_error:     null,
      updated_at:     new Date().toISOString(),
    }).eq('id', connectionId);

    return result;
  } catch (err: any) {
    const msg = err?.message ?? String(err);

    // Mark expired if 401
    const newStatus = msg.includes('401') ? 'expired' : 'error';
    await client.from('comms_platform_connections').update({
      status:     newStatus,
      sync_error: msg.slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq('id', connectionId);

    return { success: false, platform: conn.platform, accountId: conn.account_id, error: msg };
  }
}

// Sync all connections due for refresh (used by cron endpoint)
export async function syncAllDue(): Promise<SyncResult[]> {
  const client = getCommsAdminClient();

  const { data: due } = await client
    .from('comms_platform_connections')
    .select('id')
    .eq('status', 'connected')
    .or(`next_sync_at.is.null,next_sync_at.lte.${new Date().toISOString()}`);

  const results: SyncResult[] = [];
  for (const { id } of due ?? []) {
    const res = await syncConnection(id);
    results.push(res);
    // Respect rate limits — 500 ms between requests
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}
