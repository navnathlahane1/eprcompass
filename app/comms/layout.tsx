import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveCommsActor } from '@/lib/comms/auth';
import CommsShell from '@/components/comms/CommsShell';
import { checkCommsPermission } from '@/lib/comms/permissions';

const BYPASS = ['/comms/login', '/comms/change-password'];

export default async function CommsLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (BYPASS.includes(pathname)) return <>{children}</>;

  const actor = await resolveCommsActor();
  if (!actor) redirect('/comms/login');
  if (actor.forcePasswordChange) redirect('/comms/change-password');

  const [canAccessRbac, canAccessVault, canApprove, canPublish] = await Promise.all([
    Promise.resolve(actor.role === 'admin' || actor.role === 'comms_cmo'),
    checkCommsPermission(actor.role, 'credentials:view_masked'),
    checkCommsPermission(actor.role, 'approve'),
    checkCommsPermission(actor.role, 'publish'),
  ]);

  return (
    <CommsShell
      userName={actor.fullName || ''}
      userRole={actor.role}
      userEmail={actor.email}
      canAccessRbac={canAccessRbac}
      canAccessVault={canAccessVault}
      canAccessQueue={canApprove || canPublish}
    >
      {children}
    </CommsShell>
  );
}
