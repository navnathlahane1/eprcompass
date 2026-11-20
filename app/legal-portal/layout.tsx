import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import PortalShell from '@/components/portal/PortalShell';
import type { PortalNavSection } from '@/components/portal/PortalShell';
import { buildLegalPortalTour } from '@/components/portal/tour/tourContent';

const NAV_SECTIONS: PortalNavSection[] = [
  {
    links: [
      {
        label: 'Dashboard',
        href: '/legal-portal/dashboard',
        iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    title: 'Document Review',
    links: [
      {
        label: 'Recyclers',
        href: '/legal-portal/recyclers',
        iconPath: 'M3 10h18M3 6h18M3 14h18M3 18h18',
      },
    ],
  },
];

export default async function LegalPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  if (pathname === '/legal-portal/login' || pathname === '/legal-portal/change-password') {
    return <>{children}</>;
  }

  const user = await getAuthenticatedUser();

  if (!user || !['legal', 'compliance_manager'].includes(user.role)) {
    redirect('/legal-portal/login');
  }

  if (user.forcePasswordChange) {
    redirect('/legal-portal/change-password');
  }

  return (
    <PortalShell
      portalName="Legal Portal"
      loginPath="/legal-portal/login"
      storageKey="legal-portal-sidebar-collapsed"
      accent="violet"
      navSections={NAV_SECTIONS}
      userName={user.fullName ?? ''}
      companyName="Legal Team"
      roleLabel={user.role === 'compliance_manager' ? 'Compliance Manager' : 'Legal · Verifier'}
      tourSteps={buildLegalPortalTour(NAV_SECTIONS)}
    >
      {children}
    </PortalShell>
  );
}
