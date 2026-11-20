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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const db = makeServiceClient();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.status === 'Completed') {
    updates.status = 'Completed';
    updates.completed_at = new Date().toISOString();
    if (body.outcome) updates.notes = body.outcome;
  } else if (body.status === 'Cancelled' || body.status === 'Skipped') {
    updates.status = body.status;
  } else if (body.scheduled_for) {
    // Reschedule / snooze
    updates.scheduled_for = body.scheduled_for;
    if (body.notes) updates.notes = body.notes;
  }

  if (body.assigned_to) updates.assigned_to = body.assigned_to;
  if (body.priority) updates.priority = body.priority;

  const { data, error } = await db.from('tc_followups').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ followup: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = makeServiceClient();
  const { error } = await db.from('tc_followups').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
