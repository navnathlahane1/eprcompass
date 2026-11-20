import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ComplianceVaultAdminDetail from './ComplianceVaultAdminDetail';

export default async function ComplianceVaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor?.isAdmin) redirect('/admin/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [accountRes, typesRes, countriesRes, managersRes] = await Promise.all([
    (db as any)
      .from('compliance_accounts')
      .select(`
        id, portal_name, portal_url, status, renewal_due_date, registration_number,
        internal_notes, client_notes, created_at, updated_at,
        clients ( id, profiles!clients_profile_id_fkey ( full_name, company_name, phone ) ),
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code, region, category ),
        profiles!compliance_accounts_assigned_manager_id_fkey ( id, full_name ),
        compliance_credentials (
          id, username, encrypted_password,
          recovery_email, recovery_phone,
          otp_email, otp_mobile, otp_owner_type, otp_notes, otp_status,
          security_notes, last_password_update
        ),
        compliance_activity_logs (
          id, action, actor_id, actor_role, details, created_at,
          profiles!compliance_activity_logs_actor_id_fkey ( full_name )
        )
      `)
      .eq('id', id)
      .order('created_at', { ascending: false, referencedTable: 'compliance_activity_logs' })
      .maybeSingle(),

    (db as any).from('compliance_types').select('id, name, code, region').eq('is_active', true).order('sort_order'),
    (db as any).from('compliance_countries').select('id, name, iso2, flag_emoji').eq('is_active', true).order('sort_order'),
    (db as any).from('profiles').select('id, full_name').in('role', ['admin', 'manager']).order('full_name'),
  ]);

  const raw = accountRes.data;
  if (!raw) notFound();

  // Sanitize: convert encrypted_password → has_password
  const creds = raw.compliance_credentials;
  const credObj = Array.isArray(creds) ? creds[0] : creds;
  const account = {
    ...raw,
    compliance_credentials: credObj
      ? { ...credObj, encrypted_password: undefined, has_password: Boolean(credObj.encrypted_password) }
      : null,
  };

  const companyName = account.clients?.profiles?.company_name || account.clients?.profiles?.full_name || 'Unknown Client';

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/compliance-vault" className="text-teal-600 hover:text-teal-700 font-medium">
          Compliance Vault
        </Link>
        <span className="text-slate-500">/</span>
        <div>
          <span className="text-slate-500">{companyName}</span>
          <span className="text-slate-500 mx-1">·</span>
          <span className="font-semibold text-slate-100">{account.portal_name}</span>
        </div>
      </div>

      <ComplianceVaultAdminDetail
        account={account}
        types={typesRes.data || []}
        countries={countriesRes.data || []}
        managers={managersRes.data || []}
      />
    </div>
  );
}
