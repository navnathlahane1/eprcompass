import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import WorkspaceSettings from '@/components/workspace/WorkspaceSettings';

export default async function WorkspaceAccountsPage() {
  const actor = await getAuthenticatedUser();
  if (!actor) redirect('/portal/login');
  if (actor.forcePasswordChange) redirect('/portal/change-password');
  return <WorkspaceSettings />;
}
