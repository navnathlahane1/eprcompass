/**
 * /api/portal/extension-token
 *
 * Lets a logged-in client generate/list/revoke Bearer tokens for the
 * Chrome Extension (extension_api_tokens). Session-cookie authenticated
 * (resolveActor), unlike /api/autofill/* which is Bearer-token authenticated —
 * this is the one route that has to exist before the extension has anything
 * to log in with.
 *
 * GET    → list this client's tokens (never returns the raw token or its hash)
 * POST   → generate a new token. Body: { name?, scopes?: string[], expires_in_days? }
 *          Returns the raw token exactly once — it is not recoverable after this response.
 * DELETE ?id=<token_id> → revoke (soft-deactivate) one of this client's own tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

const ALLOWED_SCOPES = ['read_profile', 'autofill'];
const DEFAULT_SCOPES = ['read_profile', 'autofill'];
const DEFAULT_EXPIRY_DAYS = 90;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 365;

async function resolveClientId(profileId: string): Promise<string | null> {
  const db = adminClient();
  const { data } = await (db as any)
    .from('clients')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await resolveClientId(actor.userId);
  if (!clientId) return NextResponse.json({ error: 'No client profile linked to this account' }, { status: 404 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('extension_api_tokens')
    .select('id, name, scopes, last_used_at, expires_at, is_active, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tokens: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await resolveClientId(actor.userId);
  if (!clientId) return NextResponse.json({ error: 'No client profile linked to this account' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name: string = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : 'Chrome Extension';

  let scopes: string[] = Array.isArray(body.scopes) ? body.scopes.filter((s: unknown) => typeof s === 'string') : DEFAULT_SCOPES;
  scopes = scopes.filter((s) => ALLOWED_SCOPES.includes(s));
  if (!scopes.length) scopes = DEFAULT_SCOPES;

  let expiresInDays = Number(body.expires_in_days) || DEFAULT_EXPIRY_DAYS;
  expiresInDays = Math.min(MAX_EXPIRY_DAYS, Math.max(MIN_EXPIRY_DAYS, expiresInDays));
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const raw = 'epr_ext_' + randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(raw).digest('hex');

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('extension_api_tokens')
    .insert({
      token_hash: tokenHash,
      profile_id: actor.userId,
      client_id: clientId,
      name,
      scopes,
      expires_at: expiresAt,
      is_active: true,
    })
    .select('id, name, scopes, expires_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      token: raw, // shown once — the extension popup asks the user to paste this in now
      ...data,
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = await resolveClientId(actor.userId);
  if (!clientId) return NextResponse.json({ error: 'No client profile linked to this account' }, { status: 404 });

  const tokenId = new URL(req.url).searchParams.get('id');
  if (!tokenId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('extension_api_tokens')
    .update({ is_active: false })
    .eq('id', tokenId)
    .eq('client_id', clientId) // scope the update to this client's own tokens only
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

  return NextResponse.json({ revoked: true });
}
