import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { redirect } from 'next/navigation';
import AccountDetailClient from './AccountDetailClient';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const canAccessVault = await checkCommsPermission(user.role, 'credentials:view_masked');
  if (!canAccessVault) redirect('/comms/dashboard');

  const { id } = await params;
  const client = getCommsAdminClient();

  const { data: account } = await client
    .from('comms_accounts')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!account) redirect('/comms/vault');

  const [ownersRes, checklistRes, credFieldsRes, connectionsRes] = await Promise.all([
    client.from('comms_account_owners')
      .select('id, owner_role, assigned_at, profiles:user_id(id, full_name, role)')
      .eq('account_id', id),
    client.from('comms_handover_checklist')
      .select('id, item, is_done, done_at, sort_order, profiles:done_by(full_name)')
      .eq('account_id', id)
      .order('sort_order'),
    // Credential field names ONLY — encrypted values never touch server-rendered HTML
    client.from('comms_account_credentials')
      .select('id, field_name, field_label, created_at')
      .eq('account_id', id)
      .eq('is_deleted', false)
      .order('created_at'),
    // Platform connections (without encrypted token values)
    client.from('comms_platform_connections')
      .select('id, platform, platform_account_name, platform_account_url, status, last_synced_at, sync_error, scopes')
      .eq('account_id', id)
      .order('platform'),
  ]);

  const isOwner = ownersRes.data?.some((o: any) => o.profiles?.id === user.id || o.user_id === user.id) ?? false;

  const [canEdit, canDelete, canViewMasked, canReveal, canCreate, canManageConnections] = await Promise.all([
    checkCommsPermission(user.role, 'edit',         { accountRegion: account.region, actorRegion: null, isAccountOwner: isOwner }),
    checkCommsPermission(user.role, 'delete',       { accountRegion: account.region }),
    checkCommsPermission(user.role, 'credentials:view_masked', { accountRegion: account.region, isAccountOwner: isOwner }),
    checkCommsPermission(user.role, 'credentials:reveal',      { accountRegion: account.region, actorRegion: null, isAccountOwner: isOwner }),
    checkCommsPermission(user.role, 'create'),
    checkCommsPermission(user.role, 'connections:manage'),
  ]);

  return (
    <AccountDetailClient
      account={account}
      owners={ownersRes.data ?? []}
      checklist={checklistRes.data ?? []}
      credentialFields={credFieldsRes.data ?? []}
      connections={(connectionsRes.data ?? []) as any}
      currentUserId={user.id}
      permissions={{ canEdit, canDelete, canViewMasked, canReveal, canCreate, canManageConnections }}
    />
  );
}
