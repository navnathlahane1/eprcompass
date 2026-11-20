import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import UsersClient, { IamUser } from './UsersClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const metadata = { title: 'All Users | Access Manager' };

async function getIamReadClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServerComponentClient();
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

interface PageProps {
  searchParams: Promise<{ role?: string; status?: string; search?: string; page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const roleFilter   = sp.role   || '';
  const statusFilter = sp.status || '';
  const searchFilter = sp.search || '';
  const currentPage  = Math.max(1, parseInt(sp.page || '1'));
  const limit  = 50;
  const offset = (currentPage - 1) * limit;

  const adminClient = await getIamReadClient();

  let query = adminClient
    .from('profiles')
    .select(
      'id, role, full_name, company_name, phone, created_at, is_banned, banned_reason, banned_at, notes',
      { count: 'exact' }
    )
    .not('role', 'eq', 'admin')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (roleFilter)   query = query.eq('role', roleFilter);
  if (statusFilter === 'banned') query = query.eq('is_banned', true);
  if (statusFilter === 'active') query = query.eq('is_banned', false);
  if (searchFilter) query = query.or(
    `full_name.ilike.%${searchFilter}%,company_name.ilike.%${searchFilter}%`
  );

  const { data, count } = await query;

  // Enrich with auth emails + last sign-in via admin API when service-role is configured.
  const authUsers = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? (await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })).data
    : null;
  const emailMap: Record<string, string> = {};
  const lastSignInMap: Record<string, string> = {};
  for (const u of authUsers?.users || []) {
    emailMap[u.id]      = u.email || '';
    lastSignInMap[u.id] = u.last_sign_in_at || '';
  }

  const users: IamUser[] = (data || []).map((p: any) => ({
    ...p,
    email:            emailMap[p.id]      ?? null,
    last_sign_in_at:  lastSignInMap[p.id] ?? null,
  }));

  return (
    <Suspense>
      <UsersClient
        initialUsers={users}
        totalCount={count ?? 0}
        currentRole={roleFilter}
        currentStatus={statusFilter}
        currentSearch={searchFilter}
        currentPage={currentPage}
      />
    </Suspense>
  );
}
