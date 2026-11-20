import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = getCommsAdminClient();

  const { data, error } = await client
    .from('comms_account_owners')
    .select('id, owner_role, assigned_at, profiles:user_id(id, full_name, role)')
    .eq('account_id', id)
    .order('owner_role');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ owners: data ?? [] });
}

// POST: assign a user as owner (primary or backup)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canEdit = await checkCommsPermission(actor.role, 'edit');
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { user_id, owner_role } = await req.json();
  if (!user_id || !owner_role) return NextResponse.json({ error: 'user_id and owner_role are required' }, { status: 400 });
  if (!['primary', 'backup'].includes(owner_role)) return NextResponse.json({ error: 'owner_role must be primary or backup' }, { status: 400 });

  const client = getCommsAdminClient();

  // If assigning a new primary, demote current primary to backup
  if (owner_role === 'primary') {
    await client
      .from('comms_account_owners')
      .update({ owner_role: 'backup' })
      .eq('account_id', id)
      .eq('owner_role', 'primary');
  }

  const { error } = await client
    .from('comms_account_owners')
    .upsert({ account_id: id, user_id, owner_role, assigned_by: actor.id, assigned_at: new Date().toISOString() },
             { onConflict: 'account_id,user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_credential_audit').insert({
    account_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'transfer',
    metadata:    { new_owner: user_id, owner_role },
  });

  return NextResponse.json({ success: true });
}

// DELETE: remove an owner assignment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canEdit = await checkCommsPermission(actor.role, 'edit');
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const client = getCommsAdminClient();
  const { error } = await client
    .from('comms_account_owners')
    .delete()
    .eq('account_id', id)
    .eq('user_id', user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
