import { redirect } from 'next/navigation';
import { resolveTaskManager } from '@/lib/taskmanager/auth';
import MyTasksClient from './MyTasksClient';

export const dynamic = 'force-dynamic';

export default async function MyTasksPage() {
  const actor = await resolveTaskManager();
  if (!actor) redirect('/taskmanager/login');

  return (
    <MyTasksClient
      currentUser={{ id: actor.id, full_name: actor.fullName || '', role: actor.role }}
    />
  );
}
