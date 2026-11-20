import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { redirect } from 'next/navigation';
import ComplianceVaultAdminClient from './ComplianceVaultAdminClient';

export const metadata = { title: 'Compliance Vault | Admin' };

export default async function ComplianceVaultAdminPage() {
  const actor = await resolveActor();
  if (!actor?.isAdmin) redirect('/admin/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [accountsRes, typesRes, countriesRes, managersRes, clientsRes] = await Promise.all([
    (db as any)
      .from('compliance_accounts')
      .select(`
        id, portal_name, portal_url, status, renewal_due_date, registration_number,
        client_notes, created_at, updated_at,
        clients ( id, profiles!clients_profile_id_fkey ( full_name, company_name ) ),
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code, region, category ),
        profiles!compliance_accounts_assigned_manager_id_fkey ( id, full_name ),
        compliance_credentials ( id, username, otp_email, otp_mobile, otp_status, encrypted_password )
      `)
      .order('created_at', { ascending: false }),

    (db as any).from('compliance_types').select('id, name, code, region, category').eq('is_active', true).order('sort_order'),
    (db as any).from('compliance_countries').select('id, name, iso2, flag_emoji').eq('is_active', true).order('sort_order'),
    (db as any).from('profiles').select('id, full_name').in('role', ['admin', 'manager']).order('full_name'),
    (db as any).from('clients').select('id, profiles!clients_profile_id_fkey ( full_name, company_name )').order('id'),
  ]);

  // Sanitize: strip encrypted_password → has_password
  const accounts = (accountsRes.data || []).map((row: Record<string, unknown>) => {
    const creds = row.compliance_credentials as Record<string, unknown>[] | Record<string, unknown> | null;
    const credObj = Array.isArray(creds) ? creds[0] : creds;
    return {
      ...row,
      compliance_credentials: credObj
        ? { ...credObj, encrypted_password: undefined, has_password: Boolean(credObj.encrypted_password) }
        : null,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Compliance Credential Vault</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Centrally manage EPR portal credentials across all clients, countries, and compliance types.
          All passwords are encrypted at rest with AES-256-GCM.
        </p>
      </div>

      <ComplianceVaultAdminClient
        accounts={accounts}
        types={typesRes.data || []}
        countries={countriesRes.data || []}
        managers={managersRes.data || []}
        clients={clientsRes.data || []}
      />
    </div>
  );
}
