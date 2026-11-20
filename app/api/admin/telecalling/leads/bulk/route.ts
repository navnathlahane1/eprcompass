// Feature 6: Bulk Re-assign & Campaign Auto-assign API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { leadHasPhone } from '@/lib/telecalling/phoneGuard';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor?.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json();
  const { lead_ids, action, agent_id, campaign_id } = body;

  if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids required' }, { status: 400 });
  }
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  const db = makeServiceClient();

  // Business rule: leads with no phone number are never allocated to a
  // telecaller. For actions that set an agent, restrict the agent assignment to
  // leads that actually have a phone (campaign / status changes still apply to
  // all selected leads). See lib/telecalling/phoneGuard.
  const assignsAgent = action === 'reassign' || action === 'reassign_campaign';
  let agentEligibleIds = lead_ids;
  let skippedNoPhone = 0;
  if (assignsAgent) {
    const { data: leadRows, error: phoneErr } = await db
      .from('leads')
      .select('id, phone, mobile')
      .in('id', lead_ids);
    if (phoneErr) return NextResponse.json({ error: phoneErr.message }, { status: 500 });
    agentEligibleIds = (leadRows || []).filter(leadHasPhone).map((l: any) => l.id);
    skippedNoPhone = lead_ids.length - agentEligibleIds.length;
  }

  const now = new Date().toISOString();

  if (action === 'reassign') {
    if (!agent_id) return NextResponse.json({ error: 'agent_id required for reassign' }, { status: 400 });
    if (agentEligibleIds.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, skipped_no_phone: skippedNoPhone, action });
    }
    const { error, count } = await db.from('leads')
      .update({ tc_assigned_agent: agent_id, updated_at: now })
      .in('id', agentEligibleIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: count ?? agentEligibleIds.length, skipped_no_phone: skippedNoPhone, action });
  }

  if (action === 'reassign_campaign') {
    if (!agent_id || !campaign_id) return NextResponse.json({ error: 'agent_id and campaign_id required' }, { status: 400 });
    // Campaign applies to all selected leads; the agent only to phone-bearing ones.
    const { error: campErr } = await db.from('leads')
      .update({ tc_campaign_id: campaign_id, updated_at: now })
      .in('id', lead_ids);
    if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });
    if (agentEligibleIds.length > 0) {
      const { error: agErr } = await db.from('leads')
        .update({ tc_assigned_agent: agent_id, updated_at: now })
        .in('id', agentEligibleIds);
      if (agErr) return NextResponse.json({ error: agErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, updated: lead_ids.length, assigned_agent: agentEligibleIds.length, skipped_no_phone: skippedNoPhone, action });
  }

  const patch: Record<string, any> = { updated_at: now };
  if (action === 'assign_campaign') {
    if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });
    patch.tc_campaign_id = campaign_id;
  } else if (action === 'mark_dnc') {
    patch.tc_status = 'DNC';
  } else if (action === 'reset_status') {
    patch.tc_status = 'New';
  } else {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  const { error, count } = await db
    .from('leads')
    .update(patch)
    .in('id', lead_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: count ?? lead_ids.length, action });
}
