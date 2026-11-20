/**
 * Partner portal auth helpers.
 * Resolves a logged-in user to their partner record (owner or team member).
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

export interface PartnerActor {
  userId: string;
  partnerId: string;
  name: string;
  /** 'OWNER' for the primary account; otherwise the team member role. */
  memberRole: 'OWNER' | 'SALES' | 'COMPLIANCE' | 'FINANCE' | 'VIEWER';
}

/**
 * Resolution order:
 *   1. Primary owner — partners.profile_id = auth user  → memberRole 'OWNER'
 *   2. Team member  — partner_team_members.user_id = auth user (ACTIVE)
 */
export async function resolvePartnerActor(): Promise<PartnerActor | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  const { data: profile } = await (db as any)
    .from('profiles').select('role, full_name, is_banned, force_password_change').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'partner' || profile.is_banned || profile.force_password_change) return null;

  // 1. Owner
  const { data: partner } = await (db as any)
    .from('partners').select('id, company_name, contact_person')
    .eq('profile_id', user.id).maybeSingle();

  if (partner) {
    return {
      userId: user.id,
      partnerId: partner.id,
      name: partner.contact_person || partner.company_name || profile?.full_name || '',
      memberRole: 'OWNER',
    };
  }

  // 2. Team member
  const { data: membership } = await (db as any)
    .from('partner_team_members')
    .select('member_role, full_name, partner:partner_id(id, company_name, contact_person)')
    .eq('user_id', user.id).eq('status', 'ACTIVE')
    .maybeSingle()
    .then((r: any) => r, () => ({ data: null }));

  if (membership?.partner) {
    const p = membership.partner;
    return {
      userId: user.id,
      partnerId: p.id,
      name: membership.full_name || p.contact_person || p.company_name || '',
      memberRole: membership.member_role,
    };
  }

  return null;
}
