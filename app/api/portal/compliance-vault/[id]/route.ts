import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { decryptPassword } from '@/lib/complianceVault/encryption';
import { ACTIVITY_ACTIONS } from '@/lib/complianceVault/constants';

/** GET /api/portal/compliance-vault/[id] — detail (no password) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  // Verify ownership
  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', actor.userId).maybeSingle();
  if (!client && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: account, error } = await (db as any)
    .from('compliance_accounts')
    .select(`
      id, client_id, portal_name, portal_url, status, renewal_due_date,
      registration_number, client_notes, created_at, updated_at,
      compliance_countries ( id, name, iso2, flag_emoji ),
      compliance_types ( id, name, code, region, category ),
      profiles!compliance_accounts_assigned_manager_id_fkey ( id, full_name ),
      compliance_credentials (
        id, username, otp_email, otp_mobile, otp_owner_type, otp_notes, otp_status,
        security_notes, last_password_update, encrypted_password
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify client ownership
  if (!actor.isAdmin && client && account.client_id !== client.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Strip password
  const creds = account.compliance_credentials;
  const credObj = Array.isArray(creds) ? creds[0] : creds;
  if (credObj) {
    account.compliance_credentials = {
      ...credObj,
      encrypted_password: undefined,
      has_password: Boolean(credObj.encrypted_password),
    };
  }

  return NextResponse.json({ account });
}

/** POST /api/portal/compliance-vault/[id]/reveal — client requests password reveal */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', actor.userId).maybeSingle();

  // Verify ownership
  const { data: account } = await (db as any)
    .from('compliance_accounts').select('id, client_id').eq('id', id).maybeSingle();
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!actor.isAdmin && (!client || account.client_id !== client.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: creds } = await (db as any)
    .from('compliance_credentials')
    .select('encrypted_password')
    .eq('account_id', id)
    .maybeSingle();

  if (!creds?.encrypted_password)
    return NextResponse.json({ error: 'No password stored' }, { status: 404 });

  let plaintext: string;
  try {
    plaintext = decryptPassword(creds.encrypted_password);
  } catch {
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
  }

  // Log
  try {
    const { data: profile } = await (db as any)
      .from('profiles').select('full_name, role').eq('id', actor.userId).maybeSingle();
    await (db as any).from('compliance_activity_logs').insert({
      account_id: id,
      action:     ACTIVITY_ACTIONS.PASSWORD_REVEALED,
      actor_id:   actor.userId,
      actor_role: profile?.role || 'client',
      details:    { actor_name: profile?.full_name, source: 'client_portal' },
    });
  } catch { /* non-fatal */ }

  return NextResponse.json({ password: plaintext });
}
