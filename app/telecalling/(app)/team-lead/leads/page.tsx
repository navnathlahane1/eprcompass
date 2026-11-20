import { redirect } from 'next/navigation';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { createClient } from '@supabase/supabase-js';
import TeamLeadsClient from './TeamLeadsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team Leads | Telecalling' };

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export default async function TeamLeadsPage() {
  const actor = await resolveActor();
  if (!actor) redirect('/telecalling/login');
  if (!['tc_team_lead', 'admin', 'manager'].includes(actor.role)) redirect('/telecalling/dashboard');

  const supabase = db();

  const [{ data: leads }, { data: agents }] = await Promise.all([
    supabase
      .from('leads')
      .select('id, name, phone, company, source, tc_status, assigned_to, created_at, city, state')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['telecaller', 'tc_team_lead', 'tc_senior_agent']),
  ]);

  return <TeamLeadsClient leads={leads || []} agents={agents || []} />;
}
