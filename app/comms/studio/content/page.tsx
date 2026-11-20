import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { redirect } from 'next/navigation';
import ContentClient from './ContentClient';

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const { status = '', platform = '' } = await searchParams;
  const client = getCommsAdminClient();

  let query = client
    .from('comms_content_items')
    .select('id, platform, content_type, audience_segment, region, topic, hook, status, scheduled_at, created_at, generated_by, profiles:created_by(full_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (status)   query = (query as any).eq('status', status);
  if (platform) query = (query as any).eq('platform', platform);

  const { data: rawItems } = await query;

  // Supabase returns join results as arrays; normalise to the single-object shape the component expects
  const items = (rawItems ?? []).map(item => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? (item.profiles[0] ?? null) : item.profiles,
  }));

  const [canCreate, canApprove] = await Promise.all([
    checkCommsPermission(user.role, 'create'),
    checkCommsPermission(user.role, 'approve'),
  ]);

  return (
    <ContentClient
      initialItems={items}
      activeStatus={status}
      userRole={user.role}
      canCreate={canCreate}
      canApprove={canApprove}
    />
  );
}
