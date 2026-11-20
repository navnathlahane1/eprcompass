import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveOpsActor } from '@/lib/ops/auth';
import OpsShell from '@/components/ops/OpsShell';
import IdentifyUser from '@/components/IdentifyUser';

const BYPASS = ['/ops/login', '/ops/change-password'];

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (BYPASS.includes(pathname)) return <>{children}</>;

  const actor = await resolveOpsActor();
  if (!actor) redirect('/ops/login');
  if (actor.forcePasswordChange) redirect('/ops/change-password');

  return (
    <>
      <OpsShell
        userName={actor.fullName || ''}
        userRole={actor.role}
        userEmail={actor.email}
      >
        {children}
      </OpsShell>
      <IdentifyUser userId={actor.id} email={actor.email} role={actor.role} portal="ops" />
    </>
  );
}
