import { createClient } from '@supabase/supabase-js';
import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import DashboardClient from './_components/DashboardClient';

export const metadata = { title: 'Telecalling Dashboard' };

async function fetchDashboardData() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [kpiCalls, pendingFollowups, recentCalls, activeCampaigns] = await Promise.all([
    db.from('tc_calls').select('id, status, duration_seconds', { count: 'exact' }).gte('created_at', todayIso),
    db.from('tc_followups')
      .select('*, lead:leads(company, contact_name, phone)', { count: 'exact' })
      .eq('status', 'Pending')
      .lte('scheduled_for', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(8),
    db.from('tc_calls')
      .select(`*, lead:leads(company, contact_name), agent:profiles!tc_calls_agent_id_fkey(full_name)`)
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('tc_campaigns').select('id, name, status').eq('status', 'Active').limit(5),
  ]);

  const calls = kpiCalls.data || [];
  const connected = calls.filter(c => c.status === 'Completed').length;

  return {
    kpis: {
      calls_today: kpiCalls.count || 0,
      connected_today: connected,
      contact_rate: calls.length > 0 ? Math.round((connected / calls.length) * 100) : 0,
      pending_followups: pendingFollowups.count || 0,
    },
    followups: pendingFollowups.data || [],
    recentCalls: recentCalls.data || [],
    activeCampaigns: activeCampaigns.data || [],
  };
}

export default async function TelecallingDashboardPage() {
  const data = await fetchDashboardData();
  return (
    <div className="p-6">
      <TelecallingSubNav active="dashboard" />
      <DashboardClient data={data} />
    </div>
  );
}
