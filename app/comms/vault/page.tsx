import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VaultClient from './VaultClient';

export default async function VaultPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const canAccessVault = await checkCommsPermission(user.role, 'credentials:view_masked');
  if (!canAccessVault) redirect('/comms/dashboard');

  const client = getCommsAdminClient();

  // Regional scoping for comms_regional_manager
  let query = client
    .from('comms_accounts')
    .select(`
      id, platform, display_name, handle, account_type, brand_entity,
      region, status, tags, created_at,
      owners:comms_account_owners(owner_role, profiles:user_id(id, full_name))
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(200);

  if (user.role === 'comms_regional_manager') {
    const { data: profile } = await client
      .from('profiles')
      .select('comms_region')
      .eq('id', user.id)
      .maybeSingle();
    const region = profile?.comms_region;
    if (region) {
      query = (query as any).or(`region.eq.${region},region.eq.Global`);
    }
  }

  const { data: rawAccounts } = await query;

  // Supabase returns join results as arrays; normalise profiles to the single-object shape the component expects
  const accounts = (rawAccounts ?? []).map(account => ({
    ...account,
    owners: (account.owners ?? []).map((o: any) => ({
      ...o,
      profiles: Array.isArray(o.profiles) ? (o.profiles[0] ?? null) : o.profiles,
    })),
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Account Vault</h1>
          <p className="text-sm text-slate-500 mt-0.5">All social media & platform accounts</p>
        </div>
        <Link
          href="/comms/vault/create"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition shrink-0"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </Link>
      </div>

      <VaultClient initialAccounts={accounts} userRole={user.role} />
    </div>
  );
}
