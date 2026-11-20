/**
 * CEPC portal auth helpers.
 * Resolves a logged-in user to their CEPC identity (owner or team member).
 * CEPC orgs have no separate table — the owner IS their profiles row (role='cepc').
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

export interface CepcActor {
  userId: string;
  /** profile_id of the CEPC org owner */
  cepcProfileId: string;
  name: string;
  /** 'OWNER' for the primary account; otherwise the team member role. */
  memberRole: 'OWNER' | 'COORDINATOR' | 'COMPLIANCE' | 'VIEWER';
}

/**
 * Resolution order:
 *   1. Team member  — cepc_team_members.user_id = auth user (ACTIVE)  [checked first!]
 *   2. Primary owner — profiles.role = 'cepc' AND id = auth user  → memberRole 'OWNER'
 * Sub-users also get role='cepc' in profiles, so team membership must be checked first.
 */
export async function resolveCepcActor(): Promise<CepcActor | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  const { data: profile } = await (db as any)
    .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'cepc') return null;

  // 1. Check team membership FIRST — sub-users also have role='cepc' in profiles,
  //    so we must distinguish them before falling through to the owner path.
  const { data: membership } = await (db as any)
    .from('cepc_team_members')
    .select('member_role, full_name, cepc_profile_id')
    .eq('user_id', user.id).eq('status', 'ACTIVE')
    .maybeSingle()
    .then((r: any) => r, () => ({ data: null }));

  if (membership) {
    return {
      userId: user.id,
      cepcProfileId: membership.cepc_profile_id,
      name: membership.full_name || profile?.full_name || '',
      memberRole: membership.member_role,
    };
  }

  // 2. Primary CEPC owner — not a team member, so their own profile IS the org
  return {
    userId: user.id,
    cepcProfileId: user.id,
    name: profile.full_name || '',
    memberRole: 'OWNER',
  };
}
