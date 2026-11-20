import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import PortalShell from '@/components/portal/PortalShell';
import type { PortalNavSection } from '@/components/portal/PortalShell';
import SupportChatWidget from '@/components/support/SupportChatWidget';
import IdentifyUser from '@/components/IdentifyUser';
import { buildClientPortalTour } from '@/components/portal/tour/tourContent';
import { resolveClientActor } from '@/lib/portal/clientAuth';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Navigation ───────────────────────────────────────────────────────────────

const ALL_NAV_SECTIONS: PortalNavSection[] = [
  {
    title: 'Compliance',
    links: [
      { label: 'Compliance Hub',     href: '/portal/compliance-hub',     iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'EPR Task Calendar',  href: '/portal/epr-tasks',          iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { label: 'Tasks & Actions',    href: '/portal/compliance-hub/tasks', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { label: 'Filing Calendar',    href: '/portal/compliance-hub/calendar', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { label: 'Compliance Overview', href: '/portal/compliance',         iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
{ label: 'EPR Checklist',      href: '/portal/epr-checklist',      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { label: 'Compliance Vault',   href: '/portal/compliance-vault',   iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
      { label: 'EPR Credentials',    href: '/portal/epr-credentials',    iconPath: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
      { label: 'CPCB SSO Registration', href: '/portal/cpcb-sso',         iconPath: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
  {
    title: 'Portal',
    links: [
      { label: 'Dashboard',          href: '/portal/dashboard',          iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { label: 'My Certificates',    href: '/portal/certificates',       iconPath: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
      { label: 'Filings',            href: '/portal/filings',            iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { label: 'Documents',          href: '/portal/documents',          iconPath: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
      { label: 'EPR Filing Status',  href: '/portal/epr-filings',        iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'EPR Documents',      href: '/portal/epr-documents',      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { label: 'My Documents',       href: '/portal/my-documents',       iconPath: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
      { label: 'Payments',           href: '/portal/payments',           iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
      { label: 'EPR Credits',        href: '/portal/credits',            iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'Service Requests',   href: '/portal/service-requests',   iconPath: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
      { label: 'Announcements',      href: '/portal/announcements',      iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { label: 'Chrome Extension',   href: '/portal/extension',          iconPath: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v6m0 0a3 3 0 100 6 3 3 0 000-6zm0 6v6m8.66-15L15 10.5m-6 3L3.34 18' },
    ],
  },
  {
    title: 'My Company',
    links: [
      { label: 'Data Profile',       href: '/portal/data-profile',       iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { label: 'Company Profile',    href: '/portal/profile',            iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { label: 'Team Members',        href: '/portal/contacts',           iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { label: 'Team & Access',      href: '/portal/team',               iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { label: 'Help & Guides',      href: '/portal/help/general',       iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
];

const allPortalLinks = ALL_NAV_SECTIONS.flatMap((section) => section.links);
const primaryLink = (href: string, label: string): PortalNavSection['links'][number] => {
  const existing = allPortalLinks.find((link) => link.href === href);
  return { label, href, iconPath: existing?.iconPath };
};

// Primary navigation is intentionally job-oriented. All former routes remain
// available through deep links from their consolidated parent screens.
const NAV_SECTIONS: PortalNavSection[] = [
  {
    title: 'Workspace',
    links: [
      primaryLink('/portal/dashboard', 'Dashboard'),
      primaryLink('/portal/epr-tasks', 'Calendar'),
      primaryLink('/portal/filings', 'Filings'),
      primaryLink('/portal/documents', 'Documents'),
      primaryLink('/portal/credits', 'Credits'),
      primaryLink('/portal/network', 'Recyclers'),
      primaryLink('/portal/account', 'Company'),
      primaryLink('/portal/team', 'Team & Access'),
      primaryLink('/portal/service-requests', 'Account Support'),
      primaryLink('/portal/onboarding', 'Company Setup'),
      primaryLink('/portal/enterprise', 'Enterprise'),
      primaryLink('/account/workspaces', 'Workspace Settings'),
      primaryLink('/portal/payments', 'Payments'),
      primaryLink('/portal/help/general', 'Help'),
      primaryLink('/privacy/preferences', 'Privacy preferences'),
      primaryLink('/account/notifications', 'Reminders'),
    ],
  },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';

  // Login and change-password are under this layout but must not be auth-gated
  if (pathname === '/portal/login' || pathname === '/portal/change-password') {
    return <>{children}</>;
  }

  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== 'client') {
    redirect(`/portal/login?returnUrl=${encodeURIComponent(pathname)}`);
  }

  if (authUser.forcePasswordChange) {
    redirect('/portal/change-password');
  }

  const actor = await resolveClientActor();
  const db: SupabaseClient = await createServerComponentClient();
  const { data: workspace } = actor ? await db.from('workspace_accounts').select('id').eq('entity_type', 'client').eq('entity_id', actor.clientId).maybeSingle() : { data: null };
  return (
    <>
      <PortalShell
        portalName="EPR Compliance Portal"
        portalTagline="Corporate EPR Management"
        loginPath="/portal/login"
        storageKey="portal-sidebar-collapsed"
        accent="blue"
        navSections={NAV_SECTIONS}
        userName={authUser.fullName}
        companyName={authUser.companyName}
        roleLabel="Importer / Manufacturer"
        tourSteps={buildClientPortalTour(NAV_SECTIONS)}
      >
        {children}
      </PortalShell>
      {/* Live support chat: visible on all portal pages for logged-in users */}
      <SupportChatWidget portal="client" accent="blue" />
      <IdentifyUser
        userId={authUser.id}
        email={authUser.email}
        role={authUser.role}
        portal="client"
        companyName={authUser.companyName}
        workspaceId={workspace?.id}
      />
    </>
  );
}
