import { redirect } from 'next/navigation';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';
import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await resolveTaskManager();
  if (!actor) redirect('/taskmanager/login');

  const db = getServiceClient();

  const { data: allUsers } = await db
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');

  return (
    <ProjectDetailClient
      projectId={id}
      currentUser={{ id: actor.id, full_name: actor.fullName || '', role: actor.role }}
      allUsers={allUsers || []}
    />
  );
}
