import { redirect } from 'next/navigation';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { createClient } from '@supabase/supabase-js';
import TeamFollowupsClient from './TeamFollowupsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team Follow-ups | Telecalling' };

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export default async function TeamFollowupsPage() {
  const actor = await resolveActor();
  if (!actor) redirect('/telecalling/login');
  if (!['tc_team_lead', 'admin', 'manager'].includes(actor.role)) redirect('/telecalling/dashboard');

  const supabase = db();

  const [{ data: followups }, { data: agents }] = await Promise.all([
    supabase
      .from('tc_followups')
      .select('id, lead_id, assigned_to, scheduled_for, status, notes, leads(name, phone, company)')
      .eq('status', 'Pending')
      .order('scheduled_for', { ascending: true })
      .limit(300),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['telecaller', 'tc_team_lead', 'tc_senior_agent']),
  ]);

  const normalizedFollowups = (followups || []).map((f: any) => ({
    ...f,
    leads: Array.isArray(f.leads) ? (f.leads[0] ?? null) : f.leads,
  }));

  return <TeamFollowupsClient followups={normalizedFollowups} agents={agents || []} />;
}
