// Direct publishing to social platform APIs.
// Each function takes a decrypted access token + platform metadata and
// returns the platform-assigned post ID on success.

import { decryptValue, encryptValue } from './encryption';
import { refreshAccessToken } from './oauth';
import { getCommsAdminClient } from './auth';

export interface PublishResult {
  success:        boolean;
  platformPostId?: string;
  error?:         string;
}

// ── Token helper ─────────────────────────────────────────────────────────────

async function getToken(
  client:     ReturnType<typeof getCommsAdminClient>,
  connection: Record<string, any>,
): Promise<string> {
  const now       = Date.now();
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;

  if (expiresAt > 0 && expiresAt - now < 5 * 60 * 1000 && connection.encrypted_refresh_token) {
    const refreshToken = decryptValue(connection.encrypted_refresh_token);
    const newTokens    = await refreshAccessToken(connection.platform, refreshToken);
    await client.from('comms_platform_connections').update({
      encrypted_access_token:  encryptValue(newTokens.access_token),
      encrypted_refresh_token: newTokens.refresh_token
        ? encryptValue(newTokens.refresh_token)
        : connection.encrypted_refresh_token,
      token_expires_at: newTokens.expires_in
        ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }).eq('id', connection.id);
    return newTokens.access_token;
  }

  return decryptValue(connection.encrypted_access_token);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPostText(item: Record<string, any>): string {
  const parts: string[] = [];
  if (item.hook)  parts.push(item.hook);
  if (item.body)  parts.push(item.body);
  if (item.cta)   parts.push(item.cta);
  if (item.hashtags?.length) parts.push(item.hashtags.join(' '));
  return parts.join('\n\n');
}

// ── LinkedIn ──────────────────────────────────────────────────────────────────

async function publishLinkedIn(
  token:      string,
  connection: Record<string, any>,
  item:       Record<string, any>,
): Promise<PublishResult> {
  const orgId  = connection.platform_account_id;
  const author = `urn:li:organization:${orgId}`;
  const text   = buildPostText(item);

  const body = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: `LinkedIn API ${res.status}: ${err.slice(0, 200)}` };
  }

  const postId = res.headers.get('x-restli-id') ?? (await res.json().catch(() => ({}))).id ?? null;
  return { success: true, platformPostId: postId ?? undefined };
}

// ── Twitter / X ───────────────────────────────────────────────────────────────

async function publishTwitter(
  token:      string,
  _connection: Record<string, any>,
  item:       Record<string, any>,
): Promise<PublishResult> {
  const text = buildPostText(item).slice(0, 280);

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: `Twitter API ${res.status}: ${err.slice(0, 200)}` };
  }

  const data = await res.json();
  return { success: true, platformPostId: data?.data?.id };
}

// ── Facebook page ─────────────────────────────────────────────────────────────

async function publishFacebook(
  token:      string,
  connection: Record<string, any>,
  item:       Record<string, any>,
): Promise<PublishResult> {
  const pageId  = connection.platform_account_id;
  const message = buildPostText(item);
  const version = 'v19.0';

  const res = await fetch(
    `https://graph.facebook.com/${version}/${pageId}/feed`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, access_token: token }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: `Facebook API ${res.status}: ${err.slice(0, 200)}` };
  }

  const data = await res.json();
  return { success: true, platformPostId: data?.id };
}

// ── Instagram (two-step: create container → publish) ──────────────────────────

async function publishInstagram(
  token:      string,
  connection: Record<string, any>,
  item:       Record<string, any>,
): Promise<PublishResult> {
  const igUserId = connection.platform_account_id;
  const caption  = buildPostText(item);
  const version  = 'v19.0';

  // Step 1 — create media container (text-only carousel not supported;
  // we use image_url if available, otherwise skip to reels/text-only path).
  // For now we create a simple caption-only container (requires an image_url in production).
  const containerRes = await fetch(
    `https://graph.facebook.com/${version}/${igUserId}/media`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ caption, media_type: 'IMAGE', image_url: item.image_url ?? '', access_token: token }),
    },
  );

  if (!containerRes.ok) {
    const err = await containerRes.text();
    return { success: false, error: `Instagram container API ${containerRes.status}: ${err.slice(0, 200)}` };
  }

  const { id: containerId } = await containerRes.json();

  // Step 2 — publish
  const publishRes = await fetch(
    `https://graph.facebook.com/${version}/${igUserId}/media_publish`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ creation_id: containerId, access_token: token }),
    },
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    return { success: false, error: `Instagram publish API ${publishRes.status}: ${err.slice(0, 200)}` };
  }

  const data = await publishRes.json();
  return { success: true, platformPostId: data?.id };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const PUBLISHERS: Record<string, (token: string, conn: Record<string, any>, item: Record<string, any>) => Promise<PublishResult>> = {
  linkedin:  publishLinkedIn,
  twitter:   publishTwitter,
  facebook:  publishFacebook,
  instagram: publishInstagram,
};

export async function publishContent(
  connectionId: string,
  item:         Record<string, any>,
): Promise<PublishResult> {
  const client = getCommsAdminClient();

  const { data: conn } = await client
    .from('comms_platform_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('status', 'connected')
    .maybeSingle();

  if (!conn) return { success: false, error: 'Platform connection not found or not connected' };

  const fn = PUBLISHERS[conn.platform];
  if (!fn) return { success: false, error: `Direct publishing not yet supported for ${conn.platform}` };

  try {
    const token  = await getToken(client, conn);
    return await fn(token, conn, item);
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}
