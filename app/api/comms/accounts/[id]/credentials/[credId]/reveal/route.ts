import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { decryptValue } from '@/lib/comms/encryption';

async function isOwner(client: ReturnType<typeof getCommsAdminClient>, accountId: string, userId: string) {
  const { data } = await client
    .from('comms_account_owners')
    .select('id')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// POST /api/comms/accounts/[id]/credentials/[credId]/reveal
// Body: { password: string, action: 'show' | 'copy' }
// Requires: credentials:reveal permission + step-up re-authentication
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; credId: string }> }
) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: accountId, credId } = await params;
  const client = getCommsAdminClient();

  // Load account for scope checks
  const { data: account } = await client
    .from('comms_accounts')
    .select('region, display_name')
    .eq('id', accountId)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const ownerCheck = await isOwner(client, accountId, actor.id);

  const canReveal = await checkCommsPermission(actor.role, 'credentials:reveal', {
    accountRegion:  account.region,
    actorRegion:    actor.commsRegion,
    isAccountOwner: ownerCheck,
  });
  if (!canReveal) return NextResponse.json({ error: 'Forbidden: credentials:reveal permission required' }, { status: 403 });

  const { password, action = 'show' } = await req.json();
  if (!password) return NextResponse.json({ error: 'Password is required for step-up authentication' }, { status: 400 });

  // Step-up: re-authenticate against Supabase with the actor's email + supplied password
  const { createClient } = await import('@supabase/supabase-js');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error: authErr } = await anonClient.auth.signInWithPassword({
    email: actor.email,
    password,
  });
  if (authErr) {
    return NextResponse.json({ error: 'Authentication failed — incorrect password' }, { status: 401 });
  }

  // Fetch the credential (encrypted value)
  const { data: cred } = await client
    .from('comms_account_credentials')
    .select('id, field_name, field_label, encrypted_value')
    .eq('id', credId)
    .eq('account_id', accountId)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!cred) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });

  // Decrypt
  let plaintext: string;
  try {
    plaintext = decryptValue(cred.encrypted_value);
  } catch {
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;

  // Immutable audit entry — every reveal/copy is logged
  await client.from('comms_credential_audit').insert({
    account_id:  accountId,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      action === 'copy' ? 'copy' : 'reveal',
    field_name:  cred.field_name,
    ip_address:  ip,
    metadata:    { account_name: account.display_name, field_label: cred.field_label },
  });

  return NextResponse.json({ value: plaintext });
}
