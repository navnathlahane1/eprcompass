// Feature 8 API: Conversion Funnel data

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

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent_id') || (actor.isAdmin ? null : actor.userId);
  const campaignId = searchParams.get('campaign_id');
  const period = searchParams.get('period') || '30d';

  const db = makeServiceClient();

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'all': 9999 };
  const days = daysMap[period] || 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Dialed = all calls in period
  let callsQ = db.from('tc_calls').select('id, disposition, lead_id', { count: 'exact' }).gte('created_at', since);
  if (agentId) callsQ = callsQ.eq('agent_id', agentId);
  if (campaignId) callsQ = callsQ.eq('campaign_id', campaignId);

  const { data: allCalls, count: dialed } = await callsQ;

  const CONNECTED_EXCLUDES = ['No Answer', 'Busy', 'Voicemail', 'Wrong Number', 'Failed'];
  const connected = (allCalls || []).filter((c: any) =>
    c.disposition && !CONNECTED_EXCLUDES.includes(c.disposition)
  ).length;

  // Interested = leads with tc_status Interested touched in period
  let interestedQ = db.from('leads').select('id', { count: 'exact', head: true }).eq('tc_status', 'Interested');
  if (agentId) interestedQ = interestedQ.eq('tc_assigned_agent', agentId);
  if (campaignId) interestedQ = interestedQ.eq('tc_campaign_id', campaignId);
  const { count: interested } = await interestedQ;

  // Demo = leads with outcome_demo_scheduled (if column exists) or followup type = 'Demo'
  let demoQ = db.from('tc_followups').select('id', { count: 'exact', head: true }).eq('type', 'Demo');
  if (agentId) demoQ = demoQ.eq('assigned_to', agentId);
  const { count: demo } = await demoQ;

  // Converted
  let convertedQ = db.from('leads').select('id', { count: 'exact', head: true }).eq('tc_status', 'Converted');
  if (agentId) convertedQ = convertedQ.eq('tc_assigned_agent', agentId);
  if (campaignId) convertedQ = convertedQ.eq('tc_campaign_id', campaignId);
  const { count: converted } = await convertedQ;

  const stages = [
    { label: 'Dialed', count: dialed || 0, color: 'bg-slate-600' },
    { label: 'Connected', count: connected, color: 'bg-blue-500/70' },
    { label: 'Interested', count: interested || 0, color: 'bg-teal-500/70' },
    { label: 'Demo / Meeting', count: demo || 0, color: 'bg-amber-400/70' },
    { label: 'Converted', count: converted || 0, color: 'bg-green-500/70' },
  ];

  return NextResponse.json({ stages, period, agentId, campaignId });
}
