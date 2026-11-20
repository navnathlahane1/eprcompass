import { redirect } from 'next/navigation';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';
import ProjectsListClient from './ProjectsListClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const actor = await resolveTaskManager();
  if (!actor) redirect('/taskmanager/login');

  const db = getServiceClient();

  const { data: users } = await db
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');

  return (
    <ProjectsListClient
      currentUser={{ id: actor.id, full_name: actor.fullName || '', role: actor.role }}
      allUsers={users || []}
    />
  );
}
