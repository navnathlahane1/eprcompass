/**
 * /iam/managers
 * Lists all compliance managers and provides an inline form to create new ones.
 */
import { createClient } from '@supabase/supabase-js';
import ManagersClient from './ManagersClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const metadata = { title: 'Compliance Managers | Access Manager' };
export const dynamic = 'force-dynamic';

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

export interface ManagerRow {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  is_banned: boolean;
  assigned_client_count: number;
}

export default async function ManagersPage() {
  const db = await getIamReadClient();

  // 1. All profiles with role='manager'
  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, company_name, phone, created_at, is_banned')
    .eq('role', 'manager')
    .order('full_name', { ascending: true });

  // 2. Auth emails + last_sign_in, available only with service-role access.
  const authList = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? (await db.auth.admin.listUsers({ page: 1, perPage: 200 })).data
    : null;
  const emailMap: Record<string, string> = {};
  const lastSignInMap: Record<string, string> = {};
  for (const u of authList?.users ?? []) {
    emailMap[u.id] = u.email ?? '';
    lastSignInMap[u.id] = u.last_sign_in_at ?? '';
  }

  // 3. Client assignment counts (how many clients each manager handles)
  const { data: clientRows } = await db
    .from('clients')
    .select('assigned_manager_id')
    .not('assigned_manager_id', 'is', null);

  const countMap: Record<string, number> = {};
  for (const row of clientRows ?? []) {
    if (row.assigned_manager_id) {
      countMap[row.assigned_manager_id] = (countMap[row.assigned_manager_id] ?? 0) + 1;
    }
  }

  // 4. Combine
  const managers: ManagerRow[] = (profiles ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name ?? null,
    company_name: p.company_name ?? null,
    phone: p.phone ?? null,
    email: emailMap[p.id] ?? null,
    last_sign_in_at: lastSignInMap[p.id] ?? null,
    created_at: p.created_at,
    is_banned: p.is_banned ?? false,
    assigned_client_count: countMap[p.id] ?? 0,
  }));

  return <ManagersClient initialManagers={managers} />;
}
