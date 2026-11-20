import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = searchParams.get('to') || new Date().toISOString().slice(0, 10);
  const campaignId = searchParams.get('campaign_id');

  const fromTs = `${from}T00:00:00.000Z`;
  const toTs = `${to}T23:59:59.999Z`;

  let callsQuery = db.from('tc_calls')
    .select('id, duration_seconds, disposition, status, agent_id, created_at')
    .gte('created_at', fromTs)
    .lte('created_at', toTs);
  if (campaignId) callsQuery = callsQuery.eq('campaign_id', campaignId);

  let leadsQuery = db.from('leads')
    .select('id, tc_status, tc_campaign_id, tc_assigned_agent, tc_call_count, created_at')
    .not('tc_status', 'is', null);

  let followupsQuery = db.from('tc_followups')
    .select('id, status, scheduled_for, completed_at')
    .gte('created_at', fromTs)
    .lte('created_at', toTs);

  const [callsRes, leadsRes, followupsRes, agentsRes] = await Promise.all([
    callsQuery,
    leadsQuery,
    followupsQuery,
    db.from('profiles').select('id, full_name').in('role', ['telecaller', 'sales-executive', 'manager', 'admin']),
  ]);

  const calls = callsRes.data || [];
  const leads = leadsRes.data || [];
  const followups = followupsRes.data || [];
  const agents = agentsRes.data || [];

  // KPI aggregations
  const totalCalls = calls.length;
  const connectedCalls = calls.filter(c => c.status === 'Completed').length;
  const contactRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
  const avgDuration = totalCalls > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / totalCalls)
    : 0;

  const dispositionCounts: Record<string, number> = {};
  for (const c of calls) {
    const d = c.disposition || 'Unknown';
    dispositionCounts[d] = (dispositionCounts[d] || 0) + 1;
  }

  // Lead funnel
  const leadsByStatus: Record<string, number> = {};
  for (const l of leads) {
    const s = l.tc_status || 'New';
    leadsByStatus[s] = (leadsByStatus[s] || 0) + 1;
  }

  // Agent leaderboard
  const agentStats: Record<string, { calls: number; connected: number; conversions: number; name: string }> = {};
  for (const agent of agents) {
    agentStats[agent.id] = { calls: 0, connected: 0, conversions: 0, name: agent.full_name };
  }
  for (const c of calls) {
    if (c.agent_id && agentStats[c.agent_id]) {
      agentStats[c.agent_id].calls++;
      if (c.status === 'Completed') agentStats[c.agent_id].connected++;
      if (c.disposition === 'Interested') agentStats[c.agent_id].conversions++;
    }
  }
  const leaderboard = Object.entries(agentStats)
    .map(([agentId, s]) => ({ agent_id: agentId, ...s, contact_rate: s.calls > 0 ? Math.round((s.connected / s.calls) * 100) : 0 }))
    .sort((a, b) => b.calls - a.calls);

  // Daily call volume for chart
  const dailyVolume: Record<string, number> = {};
  for (const c of calls) {
    const day = c.created_at.slice(0, 10);
    dailyVolume[day] = (dailyVolume[day] || 0) + 1;
  }
  const dailyChart = Object.entries(dailyVolume)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Followup completion rate
  const completedFollowups = followups.filter(f => f.status === 'Completed').length;
  const followupRate = followups.length > 0 ? Math.round((completedFollowups / followups.length) * 100) : 0;

  // Daily per-agent report: one row per agent per day (calls, connected, interested, not responded)
  const NOT_RESPONDED = ['No Answer', 'Busy', 'Voicemail'];
  const dailyAgentMap: Record<string, { date: string; agent_id: string; calls: number; connected: number; interested: number; not_responded: number }> = {};
  for (const c of calls) {
    if (!c.agent_id) continue;
    const day = c.created_at.slice(0, 10);
    const key = `${day}__${c.agent_id}`;
    if (!dailyAgentMap[key]) {
      dailyAgentMap[key] = { date: day, agent_id: c.agent_id, calls: 0, connected: 0, interested: 0, not_responded: 0 };
    }
    const row = dailyAgentMap[key];
    row.calls++;
    if (c.status === 'Completed') row.connected++;
    if (c.disposition === 'Interested') row.interested++;
    if (c.disposition && NOT_RESPONDED.includes(c.disposition)) row.not_responded++;
  }

  const dailyAgentIds = [...new Set(Object.values(dailyAgentMap).map(r => r.agent_id))];
  const { data: dailyAgentProfiles } = dailyAgentIds.length
    ? await db.from('profiles').select('id, full_name').in('id', dailyAgentIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const agentNameById: Record<string, string> = {};
  for (const p of dailyAgentProfiles || []) agentNameById[p.id] = p.full_name || 'Unknown';

  const dailyAgentReport = Object.values(dailyAgentMap)
    .map(r => ({
      ...r,
      agent_name: agentNameById[r.agent_id] || 'Unknown',
      contact_rate: r.calls > 0 ? Math.round((r.connected / r.calls) * 100) : 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.agent_name.localeCompare(b.agent_name));

  return NextResponse.json({
    kpis: {
      total_calls: totalCalls,
      connected_calls: connectedCalls,
      contact_rate: contactRate,
      avg_duration_seconds: avgDuration,
      total_leads: leads.length,
      followup_completion_rate: followupRate,
    },
    disposition_breakdown: dispositionCounts,
    leads_by_status: leadsByStatus,
    leaderboard,
    daily_call_volume: dailyChart,
    daily_agent_report: dailyAgentReport,
    date_range: { from, to },
  });
}
