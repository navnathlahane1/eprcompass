import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

export interface KnowledgeActor {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  forcePasswordChange: boolean;
}

// Dedicated Knowledge Hub roles. admin/manager always have full access too.
export const KNOWLEDGE_ROLES = [
  'admin', 'manager',
  'knowledge_admin', 'knowledge_manager', 'knowledge_contributor', 'knowledge_viewer',
] as const;

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

export function getKnowledgeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function resolveKnowledgeActor(): Promise<KnowledgeActor | null> {
  const cookieStore = await cookies();
  const raw = cookieStore
    .getAll()
    .find(c =>
      c.name.endsWith('-access-token') ||
      c.name === 'sb-access-token' ||
      c.name.endsWith('-auth-token')
    );
  const token = tryParseToken(raw?.value);
  if (!token) return null;

  const client = getKnowledgeAdminClient();
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return null;

  const isSuperAdmin = emailIsSuperAdmin(user.email);

  const { data: profile } = await client
    .from('profiles')
    .select('role, full_name, is_banned, force_password_change')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_banned && !isSuperAdmin) return null;

  const role: string = profile?.role ?? (isSuperAdmin ? 'admin' : '');
  if (!KNOWLEDGE_ROLES.includes(role as typeof KNOWLEDGE_ROLES[number])) return null;

  return {
    id:                  user.id,
    email:               user.email!,
    role,
    fullName:            profile?.full_name ?? null,
    forcePasswordChange: !isSuperAdmin && !!profile?.force_password_change,
  };
}
