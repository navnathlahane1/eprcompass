import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

export interface CommsActor {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  commsRegion: string | null;
  forcePasswordChange: boolean;
}

export const COMMS_ROLES = [
  'admin', 'manager',
  'comms_cmo', 'comms_brand_manager', 'comms_regional_manager',
  'comms_campaign_manager', 'comms_social_media_manager', 'comms_content_strategist',
  'comms_content_creator', 'comms_graphic_designer', 'comms_community_manager',
  'comms_performance_specialist', 'comms_pr_manager', 'comms_influencer_manager',
  'comms_marketing_analyst', 'comms_marketing_ops', 'comms_marketing_intern',
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

export function getCommsAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function resolveCommsActor(): Promise<CommsActor | null> {
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

  const client = getCommsAdminClient();
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return null;

  const isSuperAdmin = emailIsSuperAdmin(user.email);

  const { data: profile } = await client
    .from('profiles')
    .select('role, full_name, is_banned, comms_region, force_password_change')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_banned && !isSuperAdmin) return null;

  const role: string = profile?.role ?? (isSuperAdmin ? 'admin' : '');
  if (!COMMS_ROLES.includes(role as typeof COMMS_ROLES[number])) return null;

  return {
    id:                  user.id,
    email:               user.email!,
    role,
    fullName:            profile?.full_name ?? null,
    commsRegion:         profile?.comms_region ?? null,
    forcePasswordChange: profile?.force_password_change ?? false,
  };
}
