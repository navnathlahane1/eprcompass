import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { redirect } from 'next/navigation';
import ContentItemClient from './ContentItemClient';

export default async function ContentItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const { id }  = await params;
  const client  = getCommsAdminClient();

  const [itemRes, histRes] = await Promise.all([
    client.from('comms_content_items')
      .select('*, profiles:created_by(id, full_name), approver:approved_by(id, full_name)')
      .eq('id', id).eq('is_deleted', false).maybeSingle(),
    client.from('comms_content_audit')
      .select('action, from_status, to_status, notes, created_at, actor:actor_id(full_name)')
      .eq('content_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (!itemRes.data) redirect('/comms/studio/content');

  // Fetch connected accounts for the same platform so the user can pick one when publishing,
  // and post metrics (if the content has been published with a platform_post_id)
  const [connectionsRes, metricsRes, commentsCountRes] = await Promise.all([
    client
      .from('comms_platform_connections')
      .select('id, platform, platform_account_id, comms_accounts(name)')
      .eq('platform', itemRes.data.platform)
      .eq('status', 'connected'),
    itemRes.data.platform_post_id
      ? client
          .from('comms_post_metrics')
          .select('*')
          .eq('platform_post_id', itemRes.data.platform_post_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client
      .from('comms_content_comments')
      .select('id', { count: 'exact', head: true })
      .eq('content_id', id)
      .eq('is_deleted', false),
  ]);

  const [canEdit, canApprove, canPublish] = await Promise.all([
    checkCommsPermission(user.role, 'edit'),
    checkCommsPermission(user.role, 'approve'),
    checkCommsPermission(user.role, 'publish'),
  ]);

  return (
    <ContentItemClient
      item={itemRes.data}
      history={histRes.data ?? []}
      permissions={{ canEdit, canApprove, canPublish }}
      currentUserId={user.id}
      userRole={user.role}
      connections={connectionsRes.data ?? []}
      postMetrics={metricsRes.data ?? null}
      commentCount={commentsCountRes.count ?? 0}
    />
  );
}
