import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { decryptPassword } from '@/lib/complianceVault/encryption';
import { ACTIVITY_ACTIONS } from '@/lib/complianceVault/constants';

/**
 * POST /api/admin/compliance-vault/[id]/reveal
 * Decrypts and returns the password for the given account.
 * Every call is logged to compliance_activity_logs.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  const { data: creds } = await (db as any)
    .from('compliance_credentials')
    .select('id, encrypted_password')
    .eq('account_id', id)
    .maybeSingle();

  if (!creds?.encrypted_password)
    return NextResponse.json({ error: 'No password stored for this account' }, { status: 404 });

  let plaintext: string;
  try {
    plaintext = decryptPassword(creds.encrypted_password);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt credential' }, { status: 500 });
  }

  // Audit log — always log reveals
  try {
    const { data: profile } = await (db as any)
      .from('profiles').select('full_name, role').eq('id', actor.userId).maybeSingle();
    await (db as any).from('compliance_activity_logs').insert({
      account_id: id,
      action:     ACTIVITY_ACTIONS.PASSWORD_REVEALED,
      actor_id:   actor.userId,
      actor_role: profile?.role || 'admin',
      details:    { actor_name: profile?.full_name },
    });
  } catch { /* non-fatal */ }

  return NextResponse.json({ password: plaintext });
}
