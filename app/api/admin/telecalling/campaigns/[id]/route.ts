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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = makeServiceClient();

  const [campaignRes, callsRes, leadsRes] = await Promise.all([
    db.from('tc_campaigns').select('*').eq('id', id).maybeSingle(),
    db.from('tc_calls').select('id, disposition, duration_seconds, created_at').eq('campaign_id', id).order('created_at', { ascending: false }).limit(100),
    db.from('leads').select('id, company, contact_name, tc_status, tc_enrichment_status').eq('tc_campaign_id', id).limit(200),
  ]);

  if (!campaignRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ campaign: campaignRes.data, calls: callsRes.data || [], leads: leadsRes.data || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const allowed = ['name', 'description', 'type', 'status', 'start_date', 'end_date', 'daily_call_limit', 'target_filter'];
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const db = makeServiceClient();
  const { data, error } = await db.from('tc_campaigns').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = makeServiceClient();
  const { error } = await db.from('tc_campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
