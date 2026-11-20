import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { encryptPassword } from '@/lib/complianceVault/encryption';
import { ACTIVITY_ACTIONS } from '@/lib/complianceVault/constants';

/** GET /api/admin/compliance-vault?client_id=&country_id=&type_id=&status=&search= */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const clientId  = searchParams.get('client_id') || '';
  const countryId = searchParams.get('country_id') || '';
  const typeId    = searchParams.get('type_id') || '';
  const status    = searchParams.get('status') || '';
  const search    = searchParams.get('search') || '';
  const listRef   = searchParams.get('list_refs') === 'true';

  const db = adminClient();

  // Return reference data for form dropdowns
  if (listRef) {
    const [types, countries, managers] = await Promise.all([
      (db as any).from('compliance_types').select('id, name, code, region, category').eq('is_active', true).order('sort_order'),
      (db as any).from('compliance_countries').select('id, name, iso2, flag_emoji').eq('is_active', true).order('sort_order'),
      (db as any).from('profiles').select('id, full_name').in('role', ['admin', 'manager']).order('full_name'),
    ]);
    return NextResponse.json({
      types: types.data || [],
      countries: countries.data || [],
      managers: managers.data || [],
    });
  }

  // List compliance accounts (no password in response)
  let query = (db as any)
    .from('compliance_accounts')
    .select(`
      id, portal_name, portal_url, status, renewal_due_date, registration_number,
      client_notes, created_at, updated_at,
      clients ( id, profiles!clients_profile_id_fkey ( full_name, company_name ) ),
      compliance_countries ( id, name, iso2, flag_emoji ),
      compliance_types ( id, name, code, region, category ),
      profiles!compliance_accounts_assigned_manager_id_fkey ( id, full_name ),
      compliance_credentials ( id, username, otp_email, otp_mobile, otp_status, last_password_update,
        encrypted_password )
    `)
    .order('created_at', { ascending: false });

  if (clientId)  query = query.eq('client_id', clientId);
  if (countryId) query = query.eq('country_id', countryId);
  if (typeId)    query = query.eq('compliance_type_id', typeId);
  if (status)    query = query.eq('status', status);
  if (search)    query = query.or(`portal_name.ilike.%${search}%,registration_number.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Strip encrypted_password — replace with hasPassword boolean
  const sanitized = (data || []).map((row: Record<string, unknown>) => {
    const creds = row.compliance_credentials as Record<string, unknown>[] | Record<string, unknown> | null;
    const credObj = Array.isArray(creds) ? creds[0] : creds;
    return {
      ...row,
      compliance_credentials: credObj
        ? {
            ...credObj,
            encrypted_password: undefined,
            has_password: Boolean(credObj.encrypted_password),
          }
        : null,
    };
  });

  return NextResponse.json({ accounts: sanitized });
}

/** POST /api/admin/compliance-vault — create account + optional credentials */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    client_id, country_id, compliance_type_id, portal_name, portal_url,
    status = 'Active', renewal_due_date, registration_number,
    assigned_manager_id, internal_notes, client_notes,
    // credentials (optional)
    username, password, recovery_email, recovery_phone,
    otp_email, otp_mobile, otp_owner_type = 'Client', otp_notes, otp_status = 'Active',
    security_notes, last_password_update,
  } = body as Record<string, string>;

  if (!client_id)    return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  if (!portal_name?.trim()) return NextResponse.json({ error: 'portal_name required' }, { status: 400 });

  const db = adminClient();

  const { data: account, error: acctErr } = await (db as any)
    .from('compliance_accounts')
    .insert({
      client_id,
      country_id:         country_id || null,
      compliance_type_id: compliance_type_id || null,
      portal_name:        portal_name.trim(),
      portal_url:         portal_url?.trim() || null,
      status,
      renewal_due_date:   renewal_due_date || null,
      registration_number: registration_number?.trim() || null,
      assigned_manager_id: assigned_manager_id || null,
      internal_notes:     internal_notes?.trim() || null,
      client_notes:       client_notes?.trim() || null,
      created_by:         actor.userId,
    })
    .select('id')
    .single();

  if (acctErr) return NextResponse.json({ error: acctErr.message }, { status: 500 });

  // Create credentials if any provided
  const hasCredentialData = username || password || otp_email || otp_mobile;
  if (hasCredentialData) {
    const encrypted_password = password ? encryptPassword(password) : null;
    const { error: credErr } = await (db as any)
      .from('compliance_credentials')
      .insert({
        account_id:          account.id,
        username:            username?.trim() || null,
        encrypted_password,
        recovery_email:      recovery_email?.trim() || null,
        recovery_phone:      recovery_phone?.trim() || null,
        otp_email:           otp_email?.trim() || null,
        otp_mobile:          otp_mobile?.trim() || null,
        otp_owner_type,
        otp_notes:           otp_notes?.trim() || null,
        otp_status,
        security_notes:      security_notes?.trim() || null,
        last_password_update: last_password_update || null,
      });
    if (credErr) return NextResponse.json({ error: credErr.message }, { status: 500 });
  }

  // Audit log
  await logActivity(db, account.id, ACTIVITY_ACTIONS.ACCOUNT_CREATED, actor, {
    portal_name, client_id,
  });

  return NextResponse.json({ id: account.id }, { status: 201 });
}

// ── Helper ───────────────────────────────────────────────────
async function logActivity(
  db: ReturnType<typeof adminClient>,
  accountId: string,
  action: string,
  actor: { userId: string; role?: string },
  details?: Record<string, unknown>
) {
  try {
    const { data: profile } = await (db as any)
      .from('profiles').select('full_name, role').eq('id', actor.userId).maybeSingle();
    await (db as any).from('compliance_activity_logs').insert({
      account_id:  accountId,
      action,
      actor_id:    actor.userId,
      actor_role:  profile?.role || actor.role || 'admin',
      details:     details || null,
    });
  } catch { /* non-fatal */ }
}
