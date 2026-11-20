'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { TELECALLING_TOUR_STEPS } from '@/components/portal/tour/telecallingTourSteps';
import { TELECALLING_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/telecallingDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY = 'telecalling-sidebar-collapsed';

const DOCUMENTS_NAV_ITEM = {
  href: '/telecalling/documents',
  label: 'Shared Documents',
  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

const AGENT_NAV = [
  { href: '/telecalling/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/telecalling/leads',    label: 'My Leads',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/telecalling/calls',    label: 'Call Log',  icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { href: '/telecalling/followups',label: 'Follow-ups',icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/telecalling/scripts',  label: 'Scripts',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/telecalling/intelligence', label: 'Intelligence', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/telecalling/tasks',    label: 'Tasks',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/telecalling/proposals',label: 'Proposals', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/telecalling/deals',    label: 'Deals',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/telecalling/web-support', label: 'Web Support', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  DOCUMENTS_NAV_ITEM,
];

const TEAM_LEAD_NAV = [
  { group: 'Team Command', items: [
    { href: '/telecalling/team-lead/dashboard', label: 'Team Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/telecalling/team-lead/agents',    label: 'My Agents',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { href: '/telecalling/team-lead/analytics', label: 'Analytics',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { href: '/telecalling/team-lead/leads',     label: 'Team Leads',    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { href: '/telecalling/team-lead/followups', label: 'Team Follow-ups', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ]},
  { group: 'My Work', items: [
    { href: '/telecalling/leads',     label: 'My Leads',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { href: '/telecalling/calls',     label: 'Call Log',    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { href: '/telecalling/scripts',   label: 'Scripts',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href: '/telecalling/proposals', label: 'Proposals',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    DOCUMENTS_NAV_ITEM,
  ]},
];

const LEAD_GEN_NAV = [
  { href: '/telecalling/dashboard',       label: 'Dashboard',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/telecalling/lead-gen',        label: 'Lead Pipeline',  icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/telecalling/leads',           label: 'My Leads',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/telecalling/intelligence',    label: 'Intelligence',   icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/telecalling/tasks',           label: 'Tasks',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
];

const APPOINTMENT_NAV = [
  { href: '/telecalling/dashboard',       label: 'Dashboard',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/telecalling/appointments',    label: 'Appointments',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/telecalling/leads',           label: 'My Leads',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/telecalling/followups',       label: 'Follow-ups',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/telecalling/tasks',           label: 'Tasks',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
];

const CRM_DATA_NAV = [
  { href: '/telecalling/dashboard',       label: 'Dashboard',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/telecalling/crm-data',        label: 'Data Entry',     icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { href: '/telecalling/leads',           label: 'Leads',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/telecalling/tasks',           label: 'Tasks',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
];

const SUPPORT_NAV = [
  { href: '/telecalling/dashboard',       label: 'Dashboard',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/telecalling/support',         label: 'Support Queue',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/telecalling/leads',           label: 'Client Leads',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/telecalling/calls',           label: 'Call Log',       icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { href: '/telecalling/tasks',           label: 'Tasks',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/knowledge/dashboard',         label: 'Knowledge Hub',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

function getRoleNav(role: string) {
  switch (role) {
    case 'lead_gen_executive':        return { nav: [...LEAD_GEN_NAV, DOCUMENTS_NAV_ITEM], grouped: false };
    case 'appointment_setter':        return { nav: [...APPOINTMENT_NAV, DOCUMENTS_NAV_ITEM], grouped: false };
    case 'crm_data_executive':        return { nav: [...CRM_DATA_NAV, DOCUMENTS_NAV_ITEM], grouped: false };
    case 'customer_support_executive':return { nav: [...SUPPORT_NAV, DOCUMENTS_NAV_ITEM], grouped: false };
    case 'tc_team_lead':              return { nav: null, grouped: true };
    default:                          return { nav: AGENT_NAV, grouped: false };
  }
}

const NAV = AGENT_NAV;

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}

function NavLink({ href, label, icon, collapsed, onClick }: { href: string; label: string; icon: string; collapsed: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/telecalling/dashboard' && !href.includes('team-lead') && pathname.startsWith(href.split('?')[0]))
    || (href.includes('team-lead') && pathname.startsWith(href));
  return (
    <Link href={href} data-tour-id={href} title={collapsed ? label : undefined} onClick={onClick}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-teal-500/15 text-teal-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'} ${collapsed ? 'justify-center px-2' : ''}`}>
      {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-teal-400" />}
      <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function TelecallingAppShell({ children, userName, userRole }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tour = usePortalTour({
    steps: interleaveDeepDive(TELECALLING_TOUR_STEPS, { '/telecalling/dashboard': TELECALLING_DASHBOARD_TOUR_STEPS }),
    storageKey: STORAGE_KEY,
  });

  // Hydration-safe: read localStorage after mount only
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  // Make sure the sidebar is actually visible while the tour is highlighting a nav item
  useEffect(() => {
    if (!tour.isActive) return;
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) setMobileOpen(true);
  }, [tour.isActive, collapsed]);

  // Auto-skip a step if its target isn't in the current DOM (e.g. nav item not shown for this role)
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) tour.next();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.next]);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  async function handleLogout() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; Max-Age=0; path=/';
    router.push('/telecalling/login');
  }

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarWidth = mounted ? (collapsed ? 'ml-[58px]' : 'ml-[220px]') : 'ml-[220px]';

  const sidebar = (
    <aside
      className={`flex flex-col h-full bg-[#0a0f1e] border-r border-slate-800/80 transition-all duration-200 ${
        collapsed ? 'w-[58px]' : 'w-[220px]'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center h-14 border-b border-slate-800/80 px-3 flex-shrink-0 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.62 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-100 truncate">Telecalling</span>
          </div>
        )}

        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.62 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={handleToggle}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition"
            aria-label="Collapse sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Expand toggle when collapsed */}
      {collapsed && (
        <button
          onClick={handleToggle}
          className="flex items-center justify-center py-2 text-slate-600 hover:text-slate-300 transition"
          aria-label="Expand sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {!collapsed && (
        <button
          onClick={tour.start}
          title="Take a tour of this portal"
          className="hidden sm:flex mx-3 mt-2 items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:border-slate-700 hover:text-slate-300 transition"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Take a tour
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {(() => {
          const { nav, grouped } = getRoleNav(userRole);
          if (grouped) {
            return TEAM_LEAD_NAV.map(group => (
              <div key={group.group} className="mb-1">
                {!collapsed && (
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-700">{group.group}</p>
                )}
                {collapsed && <div className="h-px mx-2 my-2 bg-slate-800/80" />}
                {group.items.map(item => (
                  <NavLink key={item.href} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
                ))}
              </div>
            ));
          }
          return (nav ?? AGENT_NAV).map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          ));
        })()}
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-800/80 p-2 space-y-1 flex-shrink-0`}>
        {/* Intel Workspace link */}
        <Link
          href="/intel"
          title={collapsed ? 'Intel Workspace' : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-teal-400 transition hover:bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          {!collapsed && <span>Intel Workspace</span>}
        </Link>

        {/* Admin Panel link (for admins/managers) */}
        <Link
          href="/admin"
          title={collapsed ? 'Admin Panel' : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span>Admin Panel</span>}
        </Link>

        {/* User info + sign out */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/15 text-[10px] font-bold text-teal-400 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName}</p>
              <p className="text-[10px] capitalize text-slate-500">{userRole.replace(/-/g, ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        {collapsed && (
          <>
            <div className="flex justify-center py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/15 text-[10px] font-bold text-teal-400 select-none" title={userName}>
                {initials}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex w-full items-center justify-center rounded-lg py-2 text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#020817] text-slate-100">
      {/* Desktop sidebar — fixed left column */}
      <div className={`hidden md:flex flex-col h-screen flex-shrink-0 transition-all duration-200 ${mounted ? (collapsed ? 'w-[58px]' : 'w-[220px]') : 'w-[220px]'}`}>
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col h-full w-[220px]">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex md:hidden items-center h-14 px-4 border-b border-slate-800/80 bg-[#0a0f1e]/95 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="mr-3 text-slate-500 hover:text-slate-200 transition"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.62 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-100">Telecalling</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6">{children}</div>
        </main>
      </div>

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass="border-teal-500"
          buttonClass="bg-teal-600 hover:bg-teal-700"
          dotClass="bg-teal-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
