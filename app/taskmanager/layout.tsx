import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveTaskManager } from '@/lib/taskmanager/auth';
import TaskManagerShell from '@/components/taskmanager/TaskManagerShell';
import IdentifyUser from '@/components/IdentifyUser';

export default async function TaskManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  const BYPASS = ['/taskmanager/login', '/taskmanager/change-password'];
  if (BYPASS.includes(pathname)) return <>{children}</>;

  const actor = await resolveTaskManager();
  if (!actor) redirect('/taskmanager/login');

  // Force password change on first login
  if (actor.forcePasswordChange) redirect('/taskmanager/change-password');

  return (
    <>
      <TaskManagerShell
        userName={actor.fullName || ''}
        userRole={actor.role}
        userEmail={actor.email || ''}
      >
        {children}
      </TaskManagerShell>
      <IdentifyUser userId={actor.id} email={actor.email} role={actor.role} portal="taskmanager" />
    </>
  );
}
