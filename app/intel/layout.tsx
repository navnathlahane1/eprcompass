import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import IntelLayoutShell from './_components/IntelLayoutShell';
import { checkIntelAccess } from '@/lib/intel/server';

export default async function IntelLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  // Login page bypasses auth and renders without the shell
  if (pathname === '/intel/login') {
    return <>{children}</>;
  }

  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/intel/login?returnUrl=${encodeURIComponent(pathname || '/intel')}`);
  let access: 'allowed' | 'denied' | 'unavailable' = 'unavailable';
  try { access = await checkIntelAccess(supabase, user, process.env); } catch { /* Fail closed on configuration errors. */ }
  if (access !== 'allowed') redirect(`/intel/login?intelError=${access}`);

  return (
    <IntelLayoutShell>
      {children}
    </IntelLayoutShell>
  );
}
