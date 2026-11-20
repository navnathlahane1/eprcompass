import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { encryptPassword, isEncryptedToken } from '@/lib/complianceVault/encryption';
import { ACTIVITY_ACTIONS } from '@/lib/complianceVault/constants';

/** GET /api/admin/compliance-vault/[id] — full detail (password redacted) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  const { data: account, error } = await (db as any)
    .from('compliance_accounts')
    .select(`
      id, portal_name, portal_url, status, renewal_due_date, registration_number,
      internal_notes, client_notes, created_at, updated_at,
      clients ( id, profiles!clients_profile_id_fkey ( id, full_name, company_name, phone ) ),
      compliance_countries ( id, name, iso2, iso3, flag_emoji ),
      compliance_types ( id, name, code, region, category ),
      profiles!compliance_accounts_assigned_manager_id_fkey ( id, full_name ),
      profiles!compliance_accounts_created_by_fkey ( full_name ),
      compliance_credentials (
        id, username, recovery_email, recovery_phone,
        otp_email, otp_mobile, otp_owner_type, otp_notes, otp_status,
        security_notes, last_password_update, created_at, updated_at,
        encrypted_password
      ),
      compliance_activity_logs (
        id, action, actor_role, details, created_at,
        profiles!compliance_activity_logs_actor_id_fkey ( full_name )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Redact password — only return whether it exists
  const creds = account.compliance_credentials;
  const credObj = Array.isArray(creds) ? creds[0] : creds;
  if (credObj) {
    account.compliance_credentials = {
      ...credObj,
      encrypted_password: undefined,
      has_password: Boolean(credObj.encrypted_password),
    };
  }

  // Sort logs newest first
  if (Array.isArray(account.compliance_activity_logs)) {
    account.compliance_activity_logs.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Log access
  await logActivity(db, id, ACTIVITY_ACTIONS.ACCOUNT_ACCESSED, actor);

  return NextResponse.json({ account });
}

/** PATCH /api/admin/compliance-vault/[id] — update account and/or credentials */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = adminClient();

  // ── Account fields ──────────────────────────────────────────
  const accountUpdates: Record<string, unknown> = {};
  const accountFields = [
    'country_id','compliance_type_id','portal_name','portal_url',
    'status','renewal_due_date','registration_number',
    'assigned_manager_id','internal_notes','client_notes',
  ];
  for (const f of accountFields) {
    if (body[f] !== undefined) accountUpdates[f] = body[f] || null;
  }

  if (Object.keys(accountUpdates).length > 0) {
    const { error: acctErr } = await (db as any)
      .from('compliance_accounts').update(accountUpdates).eq('id', id);
    if (acctErr) return NextResponse.json({ error: acctErr.message }, { status: 500 });
    await logActivity(db, id, ACTIVITY_ACTIONS.ACCOUNT_UPDATED, actor, { updated_fields: Object.keys(accountUpdates) });
  }

  // ── Credential fields ───────────────────────────────────────
  const credFields = [
    'username','password','recovery_email','recovery_phone',
    'otp_email','otp_mobile','otp_owner_type','otp_notes','otp_status',
    'security_notes','last_password_update',
  ];
  const hasCredUpdate = credFields.some(f => body[f] !== undefined);

  if (hasCredUpdate) {
    const credUpdates: Record<string, unknown> = {};
    for (const f of credFields) {
      if (f === 'password') continue;
      if (body[f] !== undefined) credUpdates[f] = body[f] || null;
    }

    // Handle password encryption
    if (body.password !== undefined) {
      const pw = body.password as string;
      if (pw && !isEncryptedToken(pw)) {
        credUpdates.encrypted_password = encryptPassword(pw);
        credUpdates.last_password_update = new Date().toISOString().split('T')[0];
      } else if (!pw) {
        credUpdates.encrypted_password = null;
      }
      // If pw === masked placeholder or encrypted token, ignore (no change)
    }

    // Upsert credentials (create if not exists)
    const { data: existing } = await (db as any)
      .from('compliance_credentials').select('id').eq('account_id', id).maybeSingle();

    if (existing) {
      await (db as any).from('compliance_credentials').update(credUpdates).eq('account_id', id);
    } else {
      await (db as any).from('compliance_credentials').insert({ account_id: id, ...credUpdates });
    }

    await logActivity(db, id, ACTIVITY_ACTIONS.CREDENTIALS_UPDATED, actor, {
      updated_fields: Object.keys(credUpdates).filter(k => k !== 'encrypted_password'),
      password_changed: body.password !== undefined && Boolean(body.password),
    });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/compliance-vault/[id] — permanently delete */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  const { data: account } = await (db as any)
    .from('compliance_accounts').select('portal_name, client_id').eq('id', id).maybeSingle();

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Log before delete (CASCADE will remove the log entry too if we wait)
  await logActivity(db, id, ACTIVITY_ACTIONS.ACCOUNT_DELETED, actor, {
    portal_name: account.portal_name,
  });

  const { error } = await (db as any).from('compliance_accounts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// ── Helper ───────────────────────────────────────────────────
async function logActivity(
  db: ReturnType<typeof adminClient>,
  accountId: string,
  action: string,
  actor: { userId: string },
  details?: Record<string, unknown>
) {
  try {
    const { data: profile } = await (db as any)
      .from('profiles').select('role').eq('id', actor.userId).maybeSingle();
    await (db as any).from('compliance_activity_logs').insert({
      account_id: accountId,
      action,
      actor_id:   actor.userId,
      actor_role: profile?.role || 'admin',
      details:    details || null,
    });
  } catch { /* non-fatal */ }
}
