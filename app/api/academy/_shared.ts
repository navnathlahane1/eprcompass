/**
 * Shared helpers for /api/academy/* routes.
 */
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

export const ACADEMY_ROLES = [
  'academy_director', 'academy_manager',
  'training_program_manager', 'trainer', 'guest_trainer', 'admin',
] as const;

export type AcademyRole = (typeof ACADEMY_ROLES)[number];

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
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

export interface AcademyActor {
  id: string;
  email: string | null | undefined;
  role: AcademyRole;
  fullName: string | null;
}

export async function resolveAcademyActor(
  allowedRoles?: AcademyRole[]
): Promise<AcademyActor | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.getAll().find(
      c => c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.endsWith('-auth-token')
    );
    const token = tryParseToken(raw?.value);
    if (!token) return null;

    const db = getServiceClient();
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return null;

    const isSuperAdmin = emailIsSuperAdmin(user.email);

    const { data: profile } = await db
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role || (isSuperAdmin ? 'admin' : '')) as AcademyRole;

    const allowed = allowedRoles ?? [...ACADEMY_ROLES];
    if (!allowed.includes(role)) return null;

    return { id: user.id, email: user.email, role, fullName: profile?.full_name ?? null };
  } catch {
    return null;
  }
}
