import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import IamShell from '@/components/iam/IamShell';
import IdentifyUser from '@/components/IdentifyUser';

const ALLOWED_ROLES = ['user_manager', 'admin', 'manager'];

export default async function IamLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  // Pages that bypass the auth gate
  const BYPASS = ['/iam/login', '/iam/change-password'];
  if (BYPASS.includes(pathname)) return <>{children}</>;

  const authUser = await getAuthenticatedUser();

  if (!authUser || !ALLOWED_ROLES.includes(authUser.role)) {
    redirect('/iam/login');
  }

  // Force password change on first login
  if (authUser.forcePasswordChange) {
    redirect('/iam/change-password');
  }

  return (
    <>
      <IamShell
        userName={authUser.fullName || ''}
        userRole={authUser.role}
        userEmail={authUser.email || ''}
      >
        {children}
      </IamShell>
      <IdentifyUser userId={authUser.id} email={authUser.email} role={authUser.role} portal="iam" />
    </>
  );
}
