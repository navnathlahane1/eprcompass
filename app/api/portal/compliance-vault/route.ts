import { NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/portal/compliance-vault — client's own compliance accounts (no passwords) */
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'client' && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', actor.userId).maybeSingle();
  if (!client) return NextResponse.json({ error: 'Client record not found' }, { status: 404 });

  const { data, error } = await (db as any)
    .from('compliance_accounts')
    .select(`
      id, portal_name, portal_url, status, renewal_due_date, registration_number,
      client_notes, created_at, updated_at,
      compliance_countries ( id, name, iso2, flag_emoji ),
      compliance_types ( id, name, code, region, category ),
      profiles!compliance_accounts_assigned_manager_id_fkey ( id, full_name ),
      compliance_credentials (
        id, username, otp_email, otp_mobile, otp_owner_type, otp_notes, otp_status,
        security_notes, last_password_update
      )
    `)
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ accounts: data || [] });
}
