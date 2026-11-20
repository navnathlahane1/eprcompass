/**
 * Shared auth helper for the /manager portal and /api/manager routes.
 * Reads sb-access-token from cookies and validates the user has
 * role='manager' or role='admin'.
 */
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

export interface ManagerActor {
  id: string;
  email: string | null | undefined;
  role: string;
  fullName: string | null;
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

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function resolveManager(): Promise<ManagerActor | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.getAll().find(
    c =>
      c.name.endsWith('-access-token') ||
      c.name === 'sb-access-token' ||
      c.name.endsWith('-auth-token')   // Supabase v2 native: sb-{project-ref}-auth-token
  );
  const token = tryParseToken(raw?.value);
  if (!token) return null;

  const db = getAdminClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, force_password_change')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin = emailIsSuperAdmin(user.email);

  const role = profile?.role || (isSuperAdmin ? 'admin' : '');
  if (!['manager', 'admin'].includes(role)) return null;

  return {
    id: user.id,
    email: user.email,
    role,
    fullName: profile?.full_name ?? null,
    forcePasswordChange: !isSuperAdmin && !!(profile as any)?.force_password_change,
  };
}
