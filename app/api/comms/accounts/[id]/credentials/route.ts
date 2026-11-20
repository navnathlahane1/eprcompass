import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { encryptValue } from '@/lib/comms/encryption';

async function isOwner(client: ReturnType<typeof getCommsAdminClient>, accountId: string, userId: string) {
  const { data } = await client
    .from('comms_account_owners')
    .select('id')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// GET: returns field names + labels only (NO encrypted values)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = getCommsAdminClient();

  // Fetch the account to check region scope
  const { data: account } = await client
    .from('comms_accounts')
    .select('region')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerCheck = await isOwner(client, id, actor.id);
  const canViewMasked = await checkCommsPermission(actor.role, 'credentials:view_masked', {
    accountRegion:  account.region,
    actorRegion:    actor.commsRegion,
    isAccountOwner: ownerCheck,
  });
  if (!canViewMasked) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await client
    .from('comms_account_credentials')
    .select('id, field_name, field_label, created_at, updated_at')
    .eq('account_id', id)
    .eq('is_deleted', false)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ credentials: data ?? [] });
}

// POST: add a new credential (encrypts before storage)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = getCommsAdminClient();

  const { data: account } = await client
    .from('comms_accounts')
    .select('region')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownerCheck = await isOwner(client, id, actor.id);
  const canCreate = await checkCommsPermission(actor.role, 'create', {
    accountRegion:  account.region,
    actorRegion:    actor.commsRegion,
    isAccountOwner: ownerCheck,
  });
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { field_name, field_label, value } = await req.json();
  if (!field_name || !value) {
    return NextResponse.json({ error: 'field_name and value are required' }, { status: 400 });
  }

  let encrypted: string;
  try {
    encrypted = encryptValue(value);
  } catch (e: unknown) {
    console.error('Encryption error:', e);
    return NextResponse.json({ error: 'Encryption failed — check COMMS_ENCRYPTION_KEY' }, { status: 500 });
  }

  const { data: cred, error } = await client
    .from('comms_account_credentials')
    .insert({
      account_id:      id,
      field_name,
      field_label:     field_label || null,
      encrypted_value: encrypted,
      created_by:      actor.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_credential_audit').insert({
    account_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'create',
    field_name,
    ip_address:  req.headers.get('x-forwarded-for') || null,
  });

  return NextResponse.json({ success: true, credId: cred.id }, { status: 201 });
}
