import type { SupabaseClient } from '@supabase/supabase-js';

export type PortalClientContext = {
  userId: string;
  profile: any;
  client: any;
  account: any | null;
  manager: any | null;
};

export async function getPortalClientContext(
  supabase: SupabaseClient<any, any, any>,
  userId: string
): Promise<PortalClientContext | null> {
  const [{ data: profile }, { data: client }] = await Promise.all([
    (supabase as any).from('profiles').select('id, full_name, company_name, gstin').eq('id', userId).maybeSingle(),
    (supabase as any)
      .from('clients')
      .select('id, profile_id, assigned_manager_id')
      .eq('profile_id', userId)
      .maybeSingle()
  ]);

  if (!client) return null;

  let account: any | null = null;

  const byId = await (supabase as any).from('accounts').select('*').eq('id', client.id).maybeSingle();
  if (!byId.error && byId.data) {
    account = byId.data;
  }

  if (!account && profile?.gstin) {
    const byGstin = await (supabase as any)
      .from('accounts')
      .select('*')
      .eq('gstin', profile.gstin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!byGstin.error && byGstin.data) {
      account = byGstin.data;
    }
  }

  if (!account && client.assigned_manager_id) {
    const byManager = await (supabase as any)
      .from('accounts')
      .select('*')
      .eq('assigned_manager', client.assigned_manager_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!byManager.error && byManager.data) {
      account = byManager.data;
    }
  }

  let manager: any | null = null;
  const managerId = account?.assigned_manager || client.assigned_manager_id;
  if (managerId) {
    const managerRes = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', managerId)
      .maybeSingle();

    manager = managerRes.data || null;
  }

  return {
    userId,
    profile,
    client,
    account,
    manager
  };
}
