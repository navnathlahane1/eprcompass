// POST /api/comms/connect/[platform]/disconnect
// Body: { account_id: string }
// Revokes the stored connection (soft-delete the tokens).
import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canManage = await checkCommsPermission(actor.role, 'connections:manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { platform } = await params;
  const { account_id } = await req.json();
  if (!account_id) return NextResponse.json({ error: 'account_id required' }, { status: 400 });

  const client = getCommsAdminClient();

  // Mark as revoked and clear encrypted tokens
  const { error } = await client
    .from('comms_platform_connections')
    .update({
      status:                  'revoked',
      encrypted_access_token:  '',
      encrypted_refresh_token: null,
      sync_error:              null,
      updated_at:              new Date().toISOString(),
    })
    .eq('account_id', account_id)
    .eq('platform', platform);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_credential_audit').insert({
    account_id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'delete',
    field_name:  `${platform}_connection`,
    metadata:    { platform, action: 'disconnect' },
  });

  return NextResponse.json({ success: true });
}
