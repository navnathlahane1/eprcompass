import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import TelecallingAppShell from '@/components/telecalling/TelecallingAppShell';
import IdentifyUser from '@/components/IdentifyUser';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const ALLOWED_ROLES = [
  'telecaller',
  'tc_team_lead',
  'tc_senior_agent',
  'tc_quality_analyst',
  'tc_campaign_manager',
  'tc_trainer',
  // Business & Sales WFH roles
  'lead_gen_executive',
  'appointment_setter',
  'crm_data_executive',
  'customer_support_executive',
  'admin',
  'manager',
];

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
    if (parsed?.access_token) return parsed.access_token;
  } catch {}
  return raw;
}

export default async function TelecallingAppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) redirect('/telecalling/login');

  const accessCookie = cookieStore.getAll().find(
    c => c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.endsWith('-auth-token')
  );
  const accessToken = tryParseToken(accessCookie?.value);
  if (!accessToken) redirect('/telecalling/login');

  const client = createClient(supabaseUrl!, serviceRoleKey ?? anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let user: { id: string; email?: string | null } | null = null;
  try {
    const { data: { user: authUser }, error } = await client.auth.getUser(accessToken);
    if (error || !authUser) redirect('/telecalling/login');
    user = authUser;
  } catch { redirect('/telecalling/login'); }

  if (!user) redirect('/telecalling/login');

  let role = '';
  let fullName = '';
  let forcePasswordChange = false;
  try {
    const { data } = await client.from('profiles').select('role, full_name, force_password_change').eq('id', user!.id).maybeSingle();
    role = data?.role || (isSuperAdmin(user!.email) ? 'admin' : '');
    fullName = data?.full_name || '';
    forcePasswordChange = !!data?.force_password_change;
  } catch {}

  if (!ALLOWED_ROLES.includes(role) && !isSuperAdmin(user!.email)) {
    redirect('/telecalling/login');
  }

  if (forcePasswordChange && !isSuperAdmin(user!.email)) {
    redirect('/telecalling/change-password');
  }

  return (
    <>
      <TelecallingAppShell userName={fullName || user!.email || 'User'} userRole={role}>
        {children}
      </TelecallingAppShell>
      <IdentifyUser userId={user!.id} email={user!.email} role={role} portal="telecalling" />
    </>
  );
}
