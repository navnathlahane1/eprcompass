import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = actor.db;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['telecaller', 'tc_team_lead', 'tc_senior_agent'])
    .order('full_name');

  const agentIds = (agents || []).map((a: any) => a.id);

  if (!agentIds.length) {
    return NextResponse.json({ agents: [], totals: {}, agentStats: [] });
  }

  const [callsRes, todayCallsRes, followupsRes, leadsRes, proposalsRes] = await Promise.all([
    supabase.from('tc_calls').select('id, agent_id, disposition, duration_seconds, created_at')
      .in('agent_id', agentIds).gte('created_at', since),
    supabase.from('tc_calls').select('id, agent_id, disposition')
      .in('agent_id', agentIds).gte('created_at', todayStart.toISOString()),
    supabase.from('tc_followups').select('id, assigned_to, status, scheduled_for')
      .in('assigned_to', agentIds).eq('status', 'Pending'),
    supabase.from('leads').select('id, assigned_to, tc_status')
      .in('assigned_to', agentIds),
    supabase.from('tc_proposals').select('id, created_by, status')
      .in('created_by', agentIds).gte('created_at', since),
  ]);

  const calls = callsRes.data || [];
  const todayCalls = todayCallsRes.data || [];
  const followups = followupsRes.data || [];
  const leads = leadsRes.data || [];
  const proposals = proposalsRes.data || [];

  function isConnected(d: string) {
    return d && !['No Answer', 'Busy', 'Failed', 'Voicemail'].includes(d);
  }

  const agentStats = (agents || []).map((agent: any) => {
    const agentCalls = calls.filter((c: any) => c.agent_id === agent.id);
    const agentTodayCalls = todayCalls.filter((c: any) => c.agent_id === agent.id);
    const agentFollowups = followups.filter((f: any) => f.assigned_to === agent.id);
    const agentLeads = leads.filter((l: any) => l.assigned_to === agent.id);
    const agentProposals = proposals.filter((p: any) => p.created_by === agent.id);
    const connected = agentCalls.filter((c: any) => isConnected(c.disposition)).length;
    const todayConnected = agentTodayCalls.filter((c: any) => isConnected(c.disposition)).length;
    const totalDuration = agentCalls.reduce((s: number, c: any) => s + (c.duration_seconds || 0), 0);
    const overdueFu = agentFollowups.filter((f: any) => new Date(f.scheduled_for) < new Date()).length;
    return {
      id: agent.id,
      full_name: agent.full_name,
      role: agent.role,
      total_calls: agentCalls.length,
      today_calls: agentTodayCalls.length,
      today_connected: todayConnected,
      connected_calls: connected,
      contact_rate: agentCalls.length > 0 ? Math.round((connected / agentCalls.length) * 100) : 0,
      avg_duration: agentCalls.length > 0 ? Math.round(totalDuration / agentCalls.length) : 0,
      open_leads: agentLeads.filter((l: any) => !['Converted', 'Lost', 'Rejected'].includes(l.tc_status)).length,
      converted_leads: agentLeads.filter((l: any) => l.tc_status === 'Converted').length,
      proposals_sent: agentProposals.filter((p: any) => p.status === 'sent').length,
      pending_followups: agentFollowups.length,
      overdue_followups: overdueFu,
    };
  });

  const totals = {
    total_agents: agentIds.length,
    total_calls: calls.length,
    today_calls: todayCalls.length,
    today_connected: todayCalls.filter((c: any) => isConnected(c.disposition)).length,
    connected_calls: calls.filter((c: any) => isConnected(c.disposition)).length,
    contact_rate: calls.length > 0 ? Math.round((calls.filter((c: any) => isConnected(c.disposition)).length / calls.length) * 100) : 0,
    open_leads: leads.filter((l: any) => !['Converted', 'Lost', 'Rejected'].includes(l.tc_status)).length,
    converted_leads: leads.filter((l: any) => l.tc_status === 'Converted').length,
    proposals_sent: proposals.filter((p: any) => p.status === 'sent').length,
    pending_followups: followups.length,
    overdue_followups: followups.filter((f: any) => new Date(f.scheduled_for) < new Date()).length,
  };

  return NextResponse.json({ agents: agents || [], agentStats, totals, period });
}
