import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '../supabase/createServerComponentClient';

export function workspaceAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function workspaceOwner(workspaceId: string) {
  const db: SupabaseClient = await createServerComponentClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db.rpc('list_my_workspace_accounts');
  if (error || !data?.some((w: { id: string; member_role: string }) => w.id === workspaceId && w.member_role === 'OWNER')) return null;
  return user;
}
