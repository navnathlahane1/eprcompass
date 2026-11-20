// GET /api/comms/connect/[platform]?account_id=<uuid>
// Stores state → redirects to platform OAuth authorization URL
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import {
  buildAuthUrl, callbackUri, generateCodeVerifier,
  OAUTH_CONFIGS, SUPPORTED_PLATFORMS,
} from '@/lib/comms/oauth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canManage = await checkCommsPermission(actor.role, 'connections:manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden: connections:manage permission required' }, { status: 403 });

  const { platform }  = await params;
  const { searchParams } = new URL(req.url);
  const accountId     = searchParams.get('account_id');
  const redirectTo    = searchParams.get('redirect_to') ?? `/comms/vault/${accountId}`;

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
  }
  if (!accountId) {
    return NextResponse.json({ error: 'account_id is required' }, { status: 400 });
  }

  const cfg = OAUTH_CONFIGS[platform];
  if (!cfg?.clientId) {
    return NextResponse.json({
      error: `${platform.toUpperCase()}_CLIENT_ID is not configured. Add it to .env.local.`,
    }, { status: 503 });
  }

  const state        = randomBytes(24).toString('hex');
  const codeVerifier = cfg.usePKCE ? generateCodeVerifier() : undefined;
  const baseUrl      = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const redirectUri  = callbackUri(platform, baseUrl);

  // Store state in DB (expires 10 min)
  const client = getCommsAdminClient();
  await client.from('comms_oauth_states').insert({
    state,
    account_id:    accountId,
    platform,
    actor_id:      actor.id,
    code_verifier: codeVerifier ?? null,
    redirect_to:   redirectTo,
  });

  const authUrl = buildAuthUrl(platform, state, redirectUri, codeVerifier);
  return NextResponse.redirect(authUrl);
}
