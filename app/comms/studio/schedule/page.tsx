import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { redirect } from 'next/navigation';
import ScheduleQueueClient from './ScheduleQueueClient';

export default async function ScheduleQueuePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const client = getCommsAdminClient();

  const { data: items } = await client
    .from('comms_content_items')
    .select('id, platform, content_type, status, hook, topic, audience_segment, scheduled_at, created_at')
    .eq('is_deleted', false)
    .in('status', ['approved', 'scheduled'])
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  const [canPublish, canApprove] = await Promise.all([
    checkCommsPermission(user.role, 'publish'),
    checkCommsPermission(user.role, 'approve'),
  ]);

  if (!canPublish && !canApprove) redirect('/comms/dashboard');

  return (
    <ScheduleQueueClient
      items={items ?? []}
      canPublish={canPublish}
      canApprove={canApprove}
    />
  );
}
