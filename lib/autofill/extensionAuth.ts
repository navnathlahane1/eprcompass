import { createHash } from 'crypto';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';

export interface ExtensionActor {
  profileId: string;
  clientId: string | null;
  scopes: string[];
}

/**
 * Validates a Bearer token from the Chrome Extension.
 * Tokens are SHA-256 hashed before storage; we hash the incoming value and compare.
 */
export async function resolveExtensionActor(authHeader: string | null): Promise<ExtensionActor | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const raw = authHeader.slice(7).trim();
  if (!raw) return null;

  const hash = createHash('sha256').update(raw).digest('hex');

  const db = adminClient();
  const { data: token } = await (db as any)
    .from('extension_api_tokens')
    .select('profile_id, client_id, scopes, expires_at, is_active')
    .eq('token_hash', hash)
    .eq('is_active', true)
    .maybeSingle();

  if (!token) return null;
  if (token.expires_at && new Date(token.expires_at) < new Date()) return null;

  // Update last_used_at (fire and forget)
  (db as any)
    .from('extension_api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', hash)
    .then(() => {});

  return {
    profileId: token.profile_id,
    clientId: token.client_id,
    scopes: token.scopes ?? [],
  };
}

export function requireScope(actor: ExtensionActor, scope: string): boolean {
  return actor.scopes.includes(scope) || actor.scopes.includes('*');
}
