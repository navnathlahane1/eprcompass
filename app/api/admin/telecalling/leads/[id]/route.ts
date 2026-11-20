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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = makeServiceClient();

  const [leadRes, callsRes, followupsRes, enrichmentRes] = await Promise.all([
    db.from('leads').select('*').eq('id', id).maybeSingle(),
    db.from('tc_calls')
      .select(`*, agent:profiles!tc_calls_agent_id_fkey(full_name)`)
      .eq('lead_id', id).order('created_at', { ascending: false }).limit(20),
    db.from('tc_followups')
      .select(`*, agent:profiles!tc_followups_assigned_to_fkey(full_name)`)
      .eq('lead_id', id).eq('status', 'Pending').order('scheduled_for', { ascending: true }).limit(5),
    db.from('tc_lead_enrichments').select('*').eq('lead_id', id).maybeSingle(),
  ]);

  if (!leadRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    lead: leadRes.data,
    calls: callsRes.data || [],
    followups: followupsRes.data || [],
    enrichment: enrichmentRes.data || null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const allowed = ['tc_status', 'tc_campaign_id', 'tc_assigned_agent', 'tc_next_call_at'];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

  const db = makeServiceClient();

  // Business rule: a lead with no phone number cannot be allocated to a
  // telecaller. Block assigning an agent unless the lead has a phone.
  if (updates.tc_assigned_agent) {
    const { data: lead } = await db.from('leads').select('phone, mobile').eq('id', id).maybeSingle();
    if (!leadHasPhone(lead)) {
      return NextResponse.json(
        { error: 'This lead has no phone number and cannot be assigned to a telecaller. Add a phone number first.' },
        { status: 422 }
      );
    }
  }

  const { data, error } = await db.from('leads').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
