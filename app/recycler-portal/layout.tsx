import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import PortalShell from '@/components/portal/PortalShell';
import type { PortalNavSection } from '@/components/portal/PortalShell';
import { buildRecyclerPortalTour } from '@/components/portal/tour/tourContent';
import { RECYCLER_DASHBOARD_TOUR_STEPS } from '@/components/recycler-portal/dashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';
import IdentifyUser from '@/components/IdentifyUser';

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_SECTIONS: PortalNavSection[] = [
  {
    links: [
      {
        label: 'Dashboard',
        href: '/recycler-portal/dashboard',
        iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
      {
        label: 'Onboarding Training',
        href: '/recycler-portal/training',
        iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      },
      {
        label: 'Notifications',
        href: '/recycler-portal/notifications',
        iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      },
      {
        label: 'Announcements',
        href: '/recycler-portal/announcements',
        iconPath: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      },
      {
        label: 'AI Assistant',
        href: '/recycler-portal/ai-assistant',
        iconPath: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z',
      },
    ],
  },
  {
    title: 'Trading & Compliance',
    links: [
      {
        label: 'Tender Alerts',
        href: '/recycler-portal/tenders',
        iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        label: 'Live Auctions',
        href: '/recycler-portal/auctions',
        iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
      },
      {
        label: 'Corporate Requests',
        href: '/recycler-portal/requests',
        iconPath: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      },
      {
        label: 'Buyer Network',
        href: '/recycler-portal/buyer-network',
        iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      },
      {
        label: 'Contracts',
        href: '/recycler-portal/contracts',
        iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        label: 'Meetings',
        href: '/recycler-portal/meetings',
        iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
    ],
  },
  {
    title: 'EPR Credits & Financials',
    links: [
      {
        label: 'EPR Credits & Trading',
        href: '/recycler-portal/credits',
        iconPath: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
      },
      {
        label: 'Tonnage Reporting',
        href: '/recycler-portal/tonnage',
        iconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      },
      {
        label: 'Invoices',
        href: '/recycler-portal/invoices',
        iconPath: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      },
      {
        label: 'Credit Financing',
        href: '/recycler-portal/financing',
        iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        label: 'Price Intelligence',
        href: '/recycler-portal/price-intelligence',
        iconPath: 'M3 3v18h18M7 14l3-3 3 3 5-5',
      },
    ],
  },
  {
    title: 'Operations',
    links: [
      {
        label: 'Collection Network',
        href: '/recycler-portal/collection',
        iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m2-4h10a2 2 0 002-2V8a2 2 0 00-2-2h-7l-2-2H9m4 11a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z',
      },
      {
        label: 'Traceability Ledger',
        href: '/recycler-portal/traceability',
        iconPath: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
      },
      {
        label: 'Analytics',
        href: '/recycler-portal/analytics',
        iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
      {
        label: 'Capacity Calendar',
        href: '/recycler-portal/capacity',
        iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
      {
        label: 'CPCB Alerts',
        href: '/recycler-portal/cpcb-alerts',
        iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      },
      {
        label: 'Cert Renewal',
        href: '/recycler-portal/cert-renewal',
        iconPath: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      },
      {
        label: 'Authorizations',
        href: '/recycler-portal/authorizations',
        iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      },
      {
        label: 'CPCB Returns',
        href: '/recycler-portal/cpcb-returns',
        iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        label: 'Statutory Returns',
        href: '/recycler-portal/statutory-returns',
        iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      },
    ],
  },
  {
    title: 'Govt Tender Services',
    links: [
      {
        label: 'Tender Plans',
        href: '/recycler-portal/tender-services',
        iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      },
      {
        label: 'Govt Tenders',
        href: '/recycler-portal/govt-tenders',
        iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h7',
      },
      {
        label: 'Filing Requests',
        href: '/recycler-portal/filing-requests',
        iconPath: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      },
    ],
  },
  {
    title: 'Account',
    links: [
      {
        label: 'My Documents',
        href: '/recycler-portal/my-documents',
        iconPath: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      },
      {
        label: 'Contacts',
        href: '/recycler-portal/contacts',
        iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        label: 'Reputation & Profile',
        href: '/recycler-portal/reputation',
        iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      },
      {
        label: 'Team & Access',
        href: '/recycler-portal/team',
        iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      },
      {
        label: 'Service Requests',
        href: '/recycler-portal/service-requests',
        iconPath: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
      },
      {
        label: 'My Profile',
        href: '/recycler-portal/profile',
        iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      },
    ],
  },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function RecyclerPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  if (pathname === '/recycler-portal/login' || pathname === '/recycler-portal/change-password') {
    return <>{children}</>;
  }

  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/recycler-portal/login');

  const db = adminClient();

  const [profileRes, recyclerRes] = await Promise.all([
    (db as any).from('profiles').select('role, is_banned, force_password_change').eq('id', user.id).maybeSingle(),
    (db as any)
      .from('recyclers')
      .select('name, recycler_code, verification_status')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (profileRes.data?.role !== 'recycler' || profileRes.data?.is_banned) redirect('/recycler-portal/login');

  if (profileRes.data?.force_password_change) redirect('/recycler-portal/change-password');

  // Onboarding page must not be gated by the recycler-record check — the user
  // is mid-claim and has no record yet. Render it outside PortalShell.
  if (pathname === '/recycler-portal/onboarding') {
    return <>{children}</>;
  }

  // Primary owner record, or fall back to a team-member (sub-user) link.
  let recycler = recyclerRes.data;
  let memberRole = 'OWNER';
  if (!recycler) {
    const { data: membership } = await (db as any)
      .from('recycler_team_members')
      .select('member_role, recycler:recycler_id(name, recycler_code, verification_status)')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    if (membership?.recycler) {
      recycler = membership.recycler;
      memberRole = membership.member_role;
    }
  }

  if (!recycler) redirect('/recycler-portal/onboarding');
  const isVerified = recycler.verification_status === 'VERIFIED';

  const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Owner', PLANT_MANAGER: 'Plant Manager', COMPLIANCE: 'Compliance', FINANCE: 'Finance', VIEWER: 'Viewer',
  };
  const roleLabel = memberRole === 'OWNER'
    ? (isVerified ? 'Recycler · Verified' : `Recycler · ${recycler.verification_status || 'Pending'}`)
    : `Recycler · ${ROLE_LABELS[memberRole] ?? memberRole}`;

  return (
    <>
      <PortalShell
        portalName="Recycler Portal"
        portalTagline={recycler.recycler_code}
        loginPath="/recycler-portal/login"
        storageKey="recycler-portal-sidebar-collapsed"
        accent="teal"
        navSections={NAV_SECTIONS}
        userName={recycler.name}
        companyName={recycler.name}
        roleLabel={roleLabel}
        tourSteps={interleaveDeepDive(buildRecyclerPortalTour(NAV_SECTIONS), {
          '/recycler-portal/dashboard': RECYCLER_DASHBOARD_TOUR_STEPS,
        })}
      >
        {children}
      </PortalShell>
      <IdentifyUser
        userId={user.id}
        email={user.email}
        role={profileRes.data?.role}
        portal="recycler"
        companyName={recycler.name}
      />
    </>
  );
}
