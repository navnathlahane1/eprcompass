// GET /api/comms/connect/[platform]/callback?code=...&state=...
// Exchanges auth code for tokens, encrypts and stores them.
import { NextRequest, NextResponse } from 'next/server';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { encryptValue } from '@/lib/comms/encryption';
import { exchangeCode, callbackUri } from '@/lib/comms/oauth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform }    = await params;
  const { searchParams, origin } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  const client  = getCommsAdminClient();

  // Helper: redirect with error message
  const errRedirect = (msg: string, accountId?: string) => {
    const target = accountId ? `/comms/vault/${accountId}` : '/comms/vault';
    return NextResponse.redirect(`${baseUrl}${target}?connect_error=${encodeURIComponent(msg)}`);
  };

  if (error) return errRedirect(`Platform denied access: ${error}`);
  if (!code || !state) return errRedirect('Missing code or state parameter');

  // Validate state
  const { data: stateRow, error: stateErr } = await client
    .from('comms_oauth_states')
    .select('*')
    .eq('state', state)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (stateErr || !stateRow) {
    return errRedirect('Invalid or expired OAuth state. Please try again.');
  }

  const { account_id, actor_id, code_verifier, redirect_to } = stateRow;

  // Delete state row (single-use)
  await client.from('comms_oauth_states').delete().eq('state', state);

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCode(platform, code, callbackUri(platform, baseUrl), code_verifier ?? undefined);
  } catch (err: any) {
    return errRedirect(err.message ?? 'Token exchange failed', account_id);
  }

  // Fetch platform account info for display
  let platformAccountId   = '';
  let platformAccountName = '';
  let platformAccountUrl  = '';

  try {
    if (platform === 'linkedin') {
      const me = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (me.ok) {
        const d = await me.json();
        platformAccountId   = d.id ?? '';
        platformAccountName = `${d.localizedFirstName ?? ''} ${d.localizedLastName ?? ''}`.trim();
      }
    } else if (platform === 'facebook' || platform === 'instagram') {
      const me = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokens.access_token}`
      );
      if (me.ok) {
        const d = await me.json();
        platformAccountId   = d.id ?? '';
        platformAccountName = d.name ?? '';
      }
    } else if (platform === 'twitter') {
      const me = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (me.ok) {
        const d = await me.json();
        platformAccountId   = d.data?.id ?? '';
        platformAccountName = d.data?.name ?? '';
        platformAccountUrl  = `https://twitter.com/${d.data?.username ?? ''}`;
      }
    } else if (platform === 'youtube') {
      const ch = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      if (ch.ok) {
        const d = await ch.json();
        const item = d.items?.[0];
        platformAccountId   = item?.id ?? '';
        platformAccountName = item?.snippet?.title ?? '';
        platformAccountUrl  = `https://youtube.com/channel/${item?.id ?? ''}`;
      }
    }
  } catch {
    // Non-fatal — we still store the tokens
  }

  // Upsert connection with encrypted tokens
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error: upsertErr } = await client.from('comms_platform_connections').upsert({
    account_id,
    platform,
    platform_account_id:    platformAccountId || null,
    platform_account_name:  platformAccountName || null,
    platform_account_url:   platformAccountUrl || null,
    encrypted_access_token:  encryptValue(tokens.access_token),
    encrypted_refresh_token: tokens.refresh_token ? encryptValue(tokens.refresh_token) : null,
    token_expires_at:        expiresAt,
    scopes:                  tokens.scope ? tokens.scope.split(/[\s,]+/) : [],
    status:                  'connected',
    connected_by:            actor_id,
    connected_at:            new Date().toISOString(),
    updated_at:              new Date().toISOString(),
    sync_error:              null,
  }, { onConflict: 'account_id,platform' });

  if (upsertErr) {
    return errRedirect(upsertErr.message, account_id);
  }

  // Audit the connection
  await client.from('comms_credential_audit').insert({
    account_id,
    actor_id,
    action:     'create',
    field_name: `${platform}_connection`,
    metadata:   { platform, platform_account_name: platformAccountName },
  });

  return NextResponse.redirect(`${baseUrl}${redirect_to}?connected=${platform}`);
}
