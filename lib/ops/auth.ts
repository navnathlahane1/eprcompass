import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { getSessionToken } from '../supabase/sessionToken';

export interface OpsActor {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  forcePasswordChange: boolean;
}

export const OPS_ROLES = [
  'admin', 'manager',
  // Operations department
  'virtual_assistant', 'proposal_executive', 'compliance_doc_executive',
  'market_research_executive', 'mis_reporting_executive',
  // Business & Sales department (also access ops portal)
  'lead_gen_executive', 'appointment_setter', 'crm_data_executive',
  'customer_support_executive',
] as const;

export function getOpsAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function resolveOpsActor(): Promise<OpsActor | null> {
  const cookieStore = await cookies();
  const token = getSessionToken(cookieStore.getAll(), process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!token) return null;

  const client = getOpsAdminClient();
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
  if (!(OPS_ROLES as readonly string[]).includes(role)) return null;

  return {
    id:                  user.id,
    email:               user.email!,
    role,
    fullName:            profile?.full_name ?? null,
    forcePasswordChange: profile?.force_password_change ?? false,
  };
}
