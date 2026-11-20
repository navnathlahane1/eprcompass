import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

async function getAccount(client: ReturnType<typeof getCommsAdminClient>, id: string) {
  const { data } = await client
    .from('comms_accounts')
    .select('*, comms_account_owners(owner_role, user_id, profiles:user_id(id, full_name, role))')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();
  return data;
}

async function isOwner(client: ReturnType<typeof getCommsAdminClient>, accountId: string, userId: string) {
  const { data } = await client
    .from('comms_account_owners')
    .select('id')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = getCommsAdminClient();
  const account = await getAccount(client, id);
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Region-scope check
  if (actor.role === 'comms_regional_manager') {
    if (account.region && account.region !== actor.commsRegion && account.region !== 'Global') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Fetch credential field names only (no encrypted values)
  const { data: credFields } = await client
    .from('comms_account_credentials')
    .select('id, field_name, field_label, created_at')
    .eq('account_id', id)
    .eq('is_deleted', false)
    .order('created_at');

  // Fetch checklist
  const { data: checklist } = await client
    .from('comms_handover_checklist')
    .select('*')
    .eq('account_id', id)
    .order('sort_order');

  await client.from('comms_credential_audit').insert({
    account_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'view',
    ip_address:  req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
  });

  return NextResponse.json({
    account,
    credentialFields: credFields ?? [],
    checklist: checklist ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client  = getCommsAdminClient();
  const account = await getAccount(client, id);
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerCheck = await isOwner(client, id, actor.id);
  const canEdit = await checkCommsPermission(actor.role, 'edit', {
    accountRegion:  account.region,
    actorRegion:    actor.commsRegion,
    isAccountOwner: ownerCheck,
  });
  if (!canEdit) return NextResponse.json({ error: 'Forbidden: edit permission required' }, { status: 403 });

  const body = await req.json();
  const allowed = ['display_name','handle','profile_url','login_url','account_type','brand_entity','region','status','tags','notes'];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { error } = await client.from('comms_accounts').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_credential_audit').insert({
    account_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'edit',
    metadata:    { fields: Object.keys(updates).filter(k => k !== 'updated_at') },
    ip_address:  req.headers.get('x-forwarded-for') || null,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client  = getCommsAdminClient();
  const account = await getAccount(client, id);
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const canDelete = await checkCommsPermission(actor.role, 'delete', {
    accountRegion:  account.region,
    actorRegion:    actor.commsRegion,
  });
  if (!canDelete) return NextResponse.json({ error: 'Forbidden: delete permission required' }, { status: 403 });

  // Soft delete only — never hard delete from UI
  const { error } = await client
    .from('comms_accounts')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_credential_audit').insert({
    account_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'delete',
    ip_address:  req.headers.get('x-forwarded-for') || null,
  });

  return NextResponse.json({ success: true });
}
