/**
 * Client portal auth helpers.
 * Resolves a logged-in user to their client record (owner or team member).
 */
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export interface ClientActor {
  userId: string;
  clientId: string;
  name: string;
  /** 'OWNER' for the primary account; otherwise the team member role. */
  memberRole: 'OWNER' | 'MANAGER' | 'COMPLIANCE' | 'FINANCE' | 'VIEWER';
}

/**
 * Resolution order:
 *   1. Primary owner — clients.profile_id = auth user  → memberRole 'OWNER'
 *   2. Team member  — client_team_members.user_id = auth user (ACTIVE)
 */
export async function resolveClientActor(): Promise<ClientActor | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  const { data: profile } = await (db as any)
    .from('profiles').select('role, full_name, company_name, is_banned, force_password_change').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'client' || profile.is_banned || profile.force_password_change) return null;

  // 1. Owner
  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', user.id).maybeSingle();

  if (client) {
    return {
      userId: user.id,
      clientId: client.id,
      name: profile?.company_name || profile?.full_name || '',
      memberRole: 'OWNER',
    };
  }

  // 2. Team member
  const { data: membership } = await (db as any)
    .from('client_team_members')
    .select('member_role, full_name, client:client_id(id)')
    .eq('user_id', user.id).eq('status', 'ACTIVE')
    .maybeSingle()
    .then((r: any) => r, () => ({ data: null }));

  if (membership?.client) {
    return {
      userId: user.id,
      clientId: membership.client.id,
      name: membership.full_name || profile?.company_name || profile?.full_name || '',
      memberRole: membership.member_role,
    };
  }

  return null;
}
