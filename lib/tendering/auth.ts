/**
 * lib/tendering/auth.ts
 * Auth helper for the /tendering portal and /api/tendering routes.
 * Validates role is 'tendering_manager', 'tendering_executive', or 'admin'.
 */
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const TENDERING_ROLES = ['tendering_manager', 'tendering_executive', 'admin'] as const;
export type TenderingRole = (typeof TENDERING_ROLES)[number];

export interface TenderingActor {
  id: string;
  email: string | null | undefined;
  role: string;
  fullName: string | null;
  isTenderingManager: boolean;
  forcePasswordChange: boolean;
}

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const p = JSON.parse(raw);
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    if (p?.access_token) return p.access_token;
  } catch {}
  return raw;
}

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function resolveTenderingUser(): Promise<TenderingActor | null> {
  try {
    const cookieStore = await cookies();
    const rawToken =
      cookieStore.get('sb-access-token')?.value ||
      cookieStore.get('supabase-auth-token')?.value;
    const token = tryParseToken(rawToken);
    if (!token) return null;

    const db = getServiceClient();
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return null;

    const { data: profile } = await db
      .from('profiles')
      .select('role, full_name, is_banned, force_password_change')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return null;
    if (profile.is_banned) return null;
    if (!(TENDERING_ROLES as readonly string[]).includes(profile.role)) return null;

    return {
      id:                 user.id,
      email:              user.email,
      role:               profile.role,
      fullName:           profile.full_name ?? null,
      isTenderingManager: profile.role === 'tendering_manager' || profile.role === 'admin',
      forcePasswordChange: profile.force_password_change ?? false,
    };
  } catch {
    return null;
  }
}
