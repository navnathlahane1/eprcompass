import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildTelecallerSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export const metadata = { title: 'My Dashboard | Telecalling' };

export default async function TelecallerDashboardPage() {
  const actor = await resolveActor();
  if (!actor) redirect('/telecalling/login');

  const db = makeServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const streakSince = new Date(Date.now() - 14 * 86400000).toISOString();

  const [callsRes, followupsRes, overdueRes, streakCallsRes, assignedLeadsRes] = await Promise.all([
    db.from('tc_calls')
      .select('id, disposition, duration_seconds, created_at, lead:leads(company_name, name)', { count: 'exact' })
      .eq('agent_id', actor.userId)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('tc_followups')
      .select('id, scheduled_for, notes, type, lead:leads(id, company_name, name)', { count: 'exact' })
      .eq('assigned_to', actor.userId)
      .eq('status', 'Pending')
      .order('scheduled_for', { ascending: true })
      .limit(10),
    db.from('tc_followups')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', actor.userId)
      .eq('status', 'Pending')
      .lt('scheduled_for', new Date().toISOString()),
    db.from('tc_calls')
      .select('created_at')
      .eq('agent_id', actor.userId)
      .gte('created_at', streakSince),
    db.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('tc_assigned_agent', actor.userId)
      .not('tc_status', 'in', '("Converted","Lost","Rejected")'),
  ]);

  const NOT_RESPONDED = ['No Answer', 'Busy', 'Voicemail'];
  const CONNECTED_EXCLUDES = ['No Answer', 'Busy', 'Voicemail', 'Wrong Number', 'Failed'];

  const todayCalls = callsRes.data || [];
  const todayCallCount = callsRes.count || 0;
  const connectedCalls = todayCalls.filter((c: any) => c.disposition && !CONNECTED_EXCLUDES.includes(c.disposition)).length;
  const notRespondedCalls = todayCalls.filter((c: any) => c.disposition && NOT_RESPONDED.includes(c.disposition)).length;
  const contactRate = todayCallCount > 0 ? Math.round((connectedCalls / todayCallCount) * 100) : 0;

  // Compute streak: consecutive days (including today) with ≥1 call
  const callDaySet = new Set(
    (streakCallsRes.data || []).map((c: any) => new Date(c.created_at).toISOString().slice(0, 10))
  );
  let streak = todayCallCount > 0 ? 1 : 0;
  for (let i = 1; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (callDaySet.has(d.toISOString().slice(0, 10))) streak++;
    else break;
  }

  // Fetch agent profile for setup guide
  const { data: agentProfile } = await db.from('profiles').select('full_name, phone').eq('id', actor.userId).maybeSingle();
  const assignedCallsCount = assignedLeadsRes.count || 0;
  const dailyTarget = assignedCallsCount > 0 ? assignedCallsCount : 40;

  const telecallerSetupSteps = buildTelecallerSetupSteps({
    hasProfile: !!(agentProfile?.full_name && agentProfile?.phone),
    hasLeads: assignedCallsCount > 0,
    hasMadeCall: todayCallCount > 0,
    hasFollowup: (followupsRes.count ?? 0) > 0,
  });

  return (
    <div className="space-y-4">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={telecallerSetupSteps}
          portalKey={`telecaller-${actor.userId}`}
          accentColor="blue"
          dark={true}
        />
      </TourTarget>
      <DashboardClient
        todayCallCount={todayCallCount}
        connectedCalls={connectedCalls}
        notRespondedCalls={notRespondedCalls}
        contactRate={contactRate}
        recentCalls={callsRes.data || []}
        pendingFollowups={followupsRes.data || []}
        overdueCount={overdueRes.count || 0}
        streak={streak}
        dailyTarget={dailyTarget}
      />
    </div>
  );
}
