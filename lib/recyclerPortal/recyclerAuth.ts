/**
 * Recycler portal auth helpers.
 *
 * Recyclers authenticate with the same Supabase auth as other users,
 * but their profile has role='recycler'. After login they must verify
 * their recycler code (linking their auth user to the recyclers table).
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

export interface RecyclerActor {
  userId: string;
  recyclerId: string;
  recyclerCode: string;
  verificationStatus: string;
  name: string;
  eprCategories: string[];
  authorizedStates: string[];
  /** 'OWNER' for the primary account holder, otherwise the team member role. */
  memberRole: 'OWNER' | 'PLANT_MANAGER' | 'COMPLIANCE' | 'FINANCE' | 'VIEWER';
}

/**
 * Resolves the current user to their recycler record.
 *
 * Resolution order:
 *   1. Primary owner — recyclers.user_id = auth user  → memberRole 'OWNER'
 *   2. Team member   — recycler_team_members.user_id = auth user (ACTIVE)
 *
 * Returns null if not authenticated or not linked to any recycler.
 */
export async function resolveRecyclerActor(): Promise<RecyclerActor | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  // Verify role
  const { data: profile } = await (db as any)
    .from('profiles')
    .select('role, is_banned, force_password_change')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'recycler' || profile.is_banned || profile.force_password_change) return null;

  // 1. Primary owner lookup
  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('id, recycler_code, verification_status, name, epr_categories, authorized_states')
    .eq('user_id', user.id)
    .maybeSingle();

  if (recycler) {
    return {
      userId: user.id,
      recyclerId: recycler.id,
      recyclerCode: recycler.recycler_code,
      verificationStatus: recycler.verification_status,
      name: recycler.name,
      eprCategories: recycler.epr_categories ?? [],
      authorizedStates: recycler.authorized_states ?? [],
      memberRole: 'OWNER',
    };
  }

  // 2. Team-member lookup (sub-user of a recycler org)
  const { data: membership } = await (db as any)
    .from('recycler_team_members')
    .select('member_role, recycler:recycler_id(id, recycler_code, verification_status, name, epr_categories, authorized_states)')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle()
    .then((r: any) => r, () => ({ data: null }));

  if (membership?.recycler) {
    const r = membership.recycler;
    return {
      userId: user.id,
      recyclerId: r.id,
      recyclerCode: r.recycler_code,
      verificationStatus: r.verification_status,
      name: r.name,
      eprCategories: r.epr_categories ?? [],
      authorizedStates: r.authorized_states ?? [],
      memberRole: membership.member_role,
    };
  }

  return null;
}

/**
 * Standardized 401 for recycler portal endpoints.
 */
export const RECYCLER_UNAUTHORIZED = {
  json: { error: 'Recycler authentication required.' },
  status: 401,
} as const;

/**
 * Standardized 403 when recycler is not VERIFIED.
 */
export const RECYCLER_UNVERIFIED = {
  json: { error: 'Your recycler account is not yet verified. Contact support.' },
  status: 403,
} as const;
