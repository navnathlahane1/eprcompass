import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import ComplianceVaultPortalClient from './ComplianceVaultPortalClient';

export const metadata = { title: 'Compliance Vault | Portal' };

export default async function ComplianceVaultPortalPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/portal/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Resolve client record
  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', user.id).maybeSingle();

  const accounts = client
    ? (await (db as any)
        .from('compliance_accounts')
        .select(`
          id, portal_name, status, renewal_due_date, registration_number, client_notes,
          compliance_countries ( id, name, flag_emoji ),
          compliance_types ( id, name, region ),
          profiles!compliance_accounts_assigned_manager_id_fkey ( full_name ),
          compliance_credentials ( username, otp_status, encrypted_password )
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
      ).data || []
    : [];

  // Strip encrypted_password
  const sanitized = accounts.map((a: Record<string, unknown>) => {
    const creds = a.compliance_credentials as Record<string, unknown>[] | Record<string, unknown> | null;
    const credObj = Array.isArray(creds) ? creds[0] : creds;
    return {
      ...a,
      compliance_credentials: credObj
        ? { ...credObj, encrypted_password: undefined, has_password: Boolean(credObj.encrypted_password) }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compliance Vault</h1>
        <p className="mt-1 text-sm text-slate-500">
          All your EPR and compliance portal credentials, securely managed by your compliance team.
        </p>
      </div>

      {sanitized.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Security reminder:</span> Your portal credentials are encrypted.
          Password reveals are logged and monitored by your compliance manager.
        </div>
      )}

      <ComplianceVaultPortalClient accounts={sanitized} />
    </div>
  );
}
