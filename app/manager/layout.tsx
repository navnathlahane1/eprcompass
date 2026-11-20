import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveManager } from '@/lib/manager/auth';
import ManagerShell from '@/components/manager/ManagerShell';
import IdentifyUser from '@/components/IdentifyUser';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  // Pages that bypass the auth gate
  const BYPASS = ['/manager/login', '/manager/change-password'];
  if (BYPASS.includes(pathname)) return <>{children}</>;

  const actor = await resolveManager();

  if (!actor) {
    redirect('/manager/login');
  }

  // Force password change on first login
  if (actor.forcePasswordChange) {
    redirect('/manager/change-password');
  }

  return (
    <>
      <ManagerShell
        userName={actor.fullName || ''}
        userRole={actor.role}
        userEmail={actor.email || ''}
      >
        {children}
      </ManagerShell>
      <IdentifyUser userId={actor.id} email={actor.email} role={actor.role} portal="manager" />
    </>
  );
}
