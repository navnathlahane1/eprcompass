import type { SupabaseClient } from '@supabase/supabase-js';

/** Exact-email lookup: never reset or recreate an existing account. */
export async function findClientIdentity(db: SupabaseClient, email: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error('Unable to check existing accounts');
    const users = data?.users || [];
    const user = users.find(row => row.email?.toLowerCase() === email);
    if (user) {
      const profile = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile.error) throw new Error('Unable to check the existing profile');
      const client = await db.from('clients').select('id').eq('profile_id', user.id).maybeSingle();
      if (client.error) throw new Error('Unable to check the existing company');
      return { id: user.id, email: user.email, canLink: profile.data?.role === 'client' && !client.data, clientId: client.data?.id || null };
    }
    if (users.length < 1000) return null;
  }
}
