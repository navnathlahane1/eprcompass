import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client  = getCommsAdminClient();

  const { data, error } = await client
    .from('comms_content_items')
    .select('*, profiles:created_by(id, full_name), approver:approved_by(id, full_name)')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: history } = await client
    .from('comms_content_audit')
    .select('action, from_status, to_status, notes, created_at, actor:actor_id(full_name)')
    .eq('content_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ item: data, history: history ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canEdit = await checkCommsPermission(actor.role, 'edit');
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id }  = await params;
  const client  = getCommsAdminClient();
  const body    = await req.json();

  const allowed = ['platform','content_type','audience_segment','region','topic','hook','body','cta','hashtags','image_brief','variants','scheduled_at'];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { error } = await client
    .from('comms_content_items')
    .update(updates)
    .eq('id', id)
    .eq('is_deleted', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_content_audit').insert({
    content_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'edit',
    notes:       `Updated: ${Object.keys(updates).filter(k => k !== 'updated_at').join(', ')}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canDelete = await checkCommsPermission(actor.role, 'delete');
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const client  = getCommsAdminClient();

  const { error } = await client
    .from('comms_content_items')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_content_audit').insert({
    content_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'archive',
  });

  return NextResponse.json({ success: true });
}
