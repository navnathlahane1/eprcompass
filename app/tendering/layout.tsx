import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveTenderingUser } from '@/lib/tendering/auth';
import TenderingShell from '@/components/tendering/TenderingShell';

const TENDERING_EXEC_ALLOWED_PREFIXES = [
  '/tendering/dashboard',
  '/tendering/my-tenders',
  '/tendering/bids',
  '/tendering/calendar',
];

export default async function TenderingLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  if (pathname === '/tendering/login') return <>{children}</>;
  if (pathname === '/tendering/change-password') return <>{children}</>;

  const actor = await resolveTenderingUser();

  if (!actor) {
    redirect('/tendering/login');
  }

  if (actor.forcePasswordChange) {
    redirect('/tendering/change-password');
  }

  if (actor.role === 'tendering_executive') {
    const allowed = TENDERING_EXEC_ALLOWED_PREFIXES.some(
      prefix => pathname === prefix || pathname.startsWith(prefix + '/')
    );
    if (!allowed) {
      redirect('/tendering/dashboard');
    }
  }

  return (
    <TenderingShell
      userName={actor.fullName || ''}
      userRole={actor.role}
      userEmail={actor.email || ''}
    >
      {children}
    </TenderingShell>
  );
}
