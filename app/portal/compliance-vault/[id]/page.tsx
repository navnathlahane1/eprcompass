import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { createClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ComplianceVaultPortalDetail from './ComplianceVaultPortalDetail';

export default async function ComplianceVaultPortalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect('/portal/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Resolve client record for ownership check
  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', user.id).maybeSingle();

  const { data: raw } = await (db as any)
    .from('compliance_accounts')
    .select(`
      id, client_id, portal_name, portal_url, status, renewal_due_date,
      registration_number, client_notes,
      compliance_countries ( name, flag_emoji ),
      compliance_types ( name, region ),
      profiles!compliance_accounts_assigned_manager_id_fkey ( full_name ),
      compliance_credentials (
        username, encrypted_password,
        otp_email, otp_mobile, otp_owner_type, otp_notes, otp_status, security_notes
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (!raw) notFound();
  if (client && raw.client_id !== client.id) redirect('/portal/compliance-vault');

  // Strip password
  const creds = raw.compliance_credentials;
  const credObj = Array.isArray(creds) ? creds[0] : creds;
  const account = {
    ...raw,
    compliance_credentials: credObj
      ? { ...credObj, encrypted_password: undefined, has_password: Boolean(credObj.encrypted_password) }
      : null,
  };

  return (
    <div className="space-y-5">
      <div className="text-sm">
        <Link href="/portal/compliance-vault" className="text-teal-600 hover:text-teal-700 font-medium">
          ← Compliance Vault
        </Link>
      </div>
      <ComplianceVaultPortalDetail account={account} />
    </div>
  );
}
