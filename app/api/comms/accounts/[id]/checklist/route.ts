import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = getCommsAdminClient();

  const { data, error } = await client
    .from('comms_handover_checklist')
    .select('id, item, is_done, done_at, sort_order, profiles:done_by(full_name)')
    .eq('account_id', id)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST: add a new checklist item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canEdit = await checkCommsPermission(actor.role, 'edit');
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { item, sort_order } = await req.json();
  if (!item) return NextResponse.json({ error: 'item text is required' }, { status: 400 });

  const client = getCommsAdminClient();
  const { data, error } = await client
    .from('comms_handover_checklist')
    .insert({ account_id: id, item, sort_order: sort_order ?? 999 })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, itemId: data.id }, { status: 201 });
}

// PATCH: toggle done / update item text
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canEdit = await checkCommsPermission(actor.role, 'edit');
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { item_id, is_done, item } = await req.json();
  if (!item_id) return NextResponse.json({ error: 'item_id is required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof is_done === 'boolean') {
    updates.is_done = is_done;
    updates.done_by = is_done ? actor.id : null;
    updates.done_at = is_done ? new Date().toISOString() : null;
  }
  if (item) updates.item = item;

  const client = getCommsAdminClient();
  const { error } = await client
    .from('comms_handover_checklist')
    .update(updates)
    .eq('id', item_id)
    .eq('account_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
