import { redirect } from 'next/navigation';
import { resolveTaskManager } from '@/lib/taskmanager/auth';
import SixtyDaysClient from './SixtyDaysClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: '60 Days Project | Task Manager' };

export default async function SixtyDaysPage() {
  const actor = await resolveTaskManager();
  if (!actor) redirect('/taskmanager/login');

  return (
    <SixtyDaysClient
      currentUserId={actor.id}
      currentUserRole={actor.role}
    />
  );
}
