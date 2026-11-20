import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveAcademyUser } from '@/lib/academy/auth';
import AcademyShell from '@/components/academy/AcademyShell';
import { canAccessRoute } from '@/lib/academy/access';
import IdentifyUser from '@/components/IdentifyUser';

export default async function AcademyLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  if (pathname === '/academy/login') return <>{children}</>;
  if (pathname === '/academy/change-password') return <>{children}</>;
  // Trainer evaluation and profile are accessible without passing the evaluation gate
  if (pathname === '/academy/trainer-evaluation') return <>{children}</>;

  const actor = await resolveAcademyUser();
  if (!actor) redirect('/academy/login');
  if (actor.forcePasswordChange) redirect('/academy/change-password');

  // Trainers must complete evaluation and have it approved before accessing any other route
  if (
    actor.trainerEvaluationStatus !== undefined &&
    (actor.trainerEvaluationStatus === 'none' || actor.trainerEvaluationStatus === 'pending') &&
    pathname !== '/academy/profile'
  ) {
    redirect('/academy/trainer-evaluation');
  }

  // Enforce route-level access using the same matrix as the nav
  if (!canAccessRoute(actor.role, pathname)) {
    redirect('/academy/dashboard');
  }

  return (
    <>
      <AcademyShell
        userName={actor.fullName || ''}
        userRole={actor.role}
        userEmail={actor.email || ''}
      >
        {children}
      </AcademyShell>
      <IdentifyUser userId={actor.id} email={actor.email} role={actor.role} portal="academy" />
    </>
  );
}
