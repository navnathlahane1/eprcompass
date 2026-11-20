import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveFinanceUser } from '@/lib/finance/auth';
import FinanceShell from '@/components/finance/FinanceShell';

/**
 * Routes that a finance_executive (non-CFO) may access.
 * Every other /finance/* route is CFO-only.
 * Admin role bypasses this check and can access everything.
 */
const FINANCE_EXEC_ALLOWED_PREFIXES = [
  '/finance/dashboard',
  '/finance/tasks',
  '/finance/invoices',
  '/finance/payments',
  '/finance/pricing-strategy',
];

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  // Bypass auth for login and change-password pages
  if (pathname === '/finance/login') return <>{children}</>;
  if (pathname === '/finance/change-password') return <>{children}</>;

  const actor = await resolveFinanceUser();

  if (!actor) {
    redirect('/finance/login');
  }

  // Force password change on first login
  if (actor.forcePasswordChange) {
    redirect('/finance/change-password');
  }

  // Finance executives can only access a subset of routes.
  // CFOs and admins have full access.
  if (actor.role === 'finance_executive') {
    const allowed = FINANCE_EXEC_ALLOWED_PREFIXES.some(
      prefix => pathname === prefix || pathname.startsWith(prefix + '/')
    );
    if (!allowed) {
      redirect('/finance/dashboard');
    }
  }

  return (
    <FinanceShell
      userName={actor.fullName || ''}
      userRole={actor.role}
      userEmail={actor.email || ''}
    >
      {children}
    </FinanceShell>
  );
}
