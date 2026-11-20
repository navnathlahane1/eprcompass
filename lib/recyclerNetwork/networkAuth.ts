/**
 * Shared actor resolution + feature-flag check for Recycler Network API routes.
 */
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { NextResponse } from 'next/server';

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export interface Actor {
  userId: string;
  isAdmin: boolean;
  isSuperAdminUser: boolean;
  role: string;
}

export async function resolveActor(): Promise<Actor | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Service-role client: profiles' own RLS policy recurses into itself for
  // admin/manager checks, so querying it through the RLS-scoped client above
  // throws "infinite recursion detected in policy for relation profiles" —
  // silently swallowed by supabase-js as profile:null, which misauthorized
  // every non-superAdmin admin/manager as role 'client'.
  const { data: profile, error } = await adminClient()
    .from('profiles')
    .select('role, is_banned, force_password_change')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile?.role || profile.is_banned || profile.force_password_change) return null;
  const role: string = profile.role;
  const superAdmin = isSuperAdmin(user.email);
  const isAdmin = ['admin', 'manager'].includes(role) || superAdmin;

  return { userId: user.id, isAdmin, isSuperAdminUser: superAdmin, role };
}

/**
 * Checks global feature flag + per-client opt-in.
 * Admins bypass per-client gating.
 */
export async function checkRecyclerNetworkAccess(actor: Actor): Promise<boolean> {
  // Global flag off → deny everyone
  if (!FEATURE_FLAGS.RECYCLER_NETWORK_ENABLED) return false;

  // Admins always have access
  if (actor.isAdmin) return true;

  // Clients need the feature enabled in client_feature_flags
  const db = adminClient();
  const { data } = await (db as any)
    .from('client_feature_flags')
    .select('enabled')
    .eq('client_id', actor.userId)
    .eq('feature', 'recyclerNetwork')
    .maybeSingle();

  return data?.enabled === true;
}

/** Standardized 403 for feature-gated resources. */
export const FORBIDDEN_RESPONSE = NextResponse.json(
  { error: 'Recycler Network module not enabled for your account. Contact your EPR manager.' },
  { status: 403 }
);
