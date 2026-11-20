'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Search, X, Menu, LayoutDashboard, Users, BarChart3, ClipboardList, FileText, Settings, Phone, ShieldCheck, Wallet, Folder, Bell, ChevronRight, ChevronsDownUp, ChevronsUpDown, PanelLeftClose, LogOut, CircleHelp, Activity } from 'lucide-react';
import { activeNavigationId } from '@/lib/admin/navigation';
import GlobalSearch from './GlobalSearch';
import { supabase } from '@/lib/supabaseClient';
import { TEAM_STORAGE_KEY, normalizeMembers, routeToModule } from '@/lib/admin/moduleAccess';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { ADMIN_TOUR_STEPS } from '@/components/portal/tour/adminTourSteps';
import { ADMIN_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/adminDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

// ── Constants ──────────────────────────────────────────────────────────────────
const SIDEBAR_KEY = 'admin-sidebar-collapsed';
function readCollapsed() {
  try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
}
function subscribeCollapsed(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener('admin-sidebar-change', notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('admin-sidebar-change', notify);
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────
type Props = { unreadCount: number };

type NavItem = {
  label: string;
  href: string;
  id: string;
  /** Renders a thin divider line above this item to visually separate sub-clusters */
  dividerBefore?: boolean;
};

type Group = {
  title: string;
  id: string;
  items: NavItem[];
};

// ── Navigation groups (15 → 7) ─────────────────────────────────────────────────
const GROUPS: Group[] = [
  {
    title: 'OVERVIEW',
    id: 'overview',
    items: [
      { label: 'Dashboard',  href: '/admin/dashboard',  id: 'dashboard'  },
      { label: 'Analytics',  href: '/admin/analytics',  id: 'analytics'  },
      { label: 'Reports',    href: '/admin/reports',    id: 'reports'    },
    ],
  },
  {
    title: 'CRM & SALES',
    id: 'crm',
    items: [
      { label: 'Clients',         href: '/admin/crm/clients',     id: 'clients'         },
      { label: 'Partners',        href: '/admin/crm/partners',    id: 'partners',        dividerBefore: true },
      { label: 'Partner Import',  href: '/admin/partners/import',     id: 'partner-import'     },
      { label: 'Partner Outreach',href: '/admin/partners/outreach',  id: 'partner-outreach'  },
      { label: 'Partner Docs',    href: '/admin/partners/documents',  id: 'partner-documents' },
    ],
  },
  {
    title: 'TELECALLING',
    id: 'telecalling',
    items: [
      { label: 'Dashboard',       href: '/admin/telecalling',                  id: 'tc-dashboard'        },
      { label: 'CRM Leads',       href: '/admin/telecalling/leads',            id: 'tc-leads'            },
      { label: 'Calls',           href: '/admin/telecalling/calls',            id: 'tc-calls'            },
      { label: 'Follow-ups',      href: '/admin/telecalling/followups',        id: 'tc-followups'        },
      { label: 'Campaigns',       href: '/admin/telecalling/campaigns',        id: 'tc-campaigns'        },
      { label: 'Scripts',         href: '/admin/telecalling/scripts',          id: 'tc-scripts'          },
      { label: 'Notifications',   href: '/admin/telecalling/notifications',    id: 'tc-notifications'    },
      { label: 'Analytics',       href: '/admin/telecalling/analytics',        id: 'tc-analytics'        },
      { label: 'Email Templates', href: '/admin/telecalling/email-templates',  id: 'tc-email-templates'  },
      { label: 'Settings',        href: '/admin/telecalling/settings',         id: 'tc-settings'         },
      { label: 'WFH Team',        href: '/admin/wfh',                          id: 'wfh-team',             dividerBefore: true },
    ],
  },
  {
    title: 'EPR OPERATIONS',
    id: 'operations',
    items: [
      { label: 'Service Requests',     href: '/admin/service-requests',              id: 'service-requests'    },
      { label: 'Compliance Vault',     href: '/admin/compliance-vault',              id: 'compliance-vault'    },
      { label: 'Compliance',           href: '/admin/compliance',                    id: 'compliance'          },
      { label: 'Certificates',         href: '/admin/certificates',                  id: 'certificates'        },
      { label: 'Documents',            href: '/admin/documents',                     id: 'documents'           },
      { label: 'EPR Unified',          href: '/admin/epr-unified-dashboard',         id: 'epr-unified-dashboard'},
      { label: 'EPR Credentials',      href: '/admin/epr-credentials',              id: 'epr-credentials'     },
      { label: 'User Documents',       href: '/admin/user-documents',               id: 'user-documents'      },
      { label: 'EPR Filing',           href: '/admin/epr-filing',                   id: 'epr-filing'          },
      { label: 'Client Documents',     href: '/admin/epr-documents',               id: 'epr-documents'       },
      { label: 'Audit Documents',      href: '/admin/epr-audit',                    id: 'epr-audit'           },
      { label: 'Financial Years',      href: '/admin/epr-settings/financial-years', id: 'epr-financial-years' },
      { label: 'Recyclers',            href: '/admin/recyclers',                    id: 'recyclers'           },
      { label: 'Projects',              href: '/admin/tasks/projects',               id: 'projects'            },
      { label: 'My Tasks',             href: '/admin/tasks/projects/my-tasks',      id: 'my-tasks'            },
      { label: 'Tasks',                href: '/admin/tasks',                        id: 'tasks'               },
      { label: 'Bulk Filing',          href: '/admin/bulk-filing',                  id: 'bulk-filing'         },
      { label: 'Renewals',             href: '/admin/renewals',                     id: 'renewals'            },
      { label: 'Onboarding',           href: '/admin/onboarding',                   id: 'onboarding'          },
      { label: 'CPCB Alerts',          href: '/admin/cpcb-alerts',                  id: 'cpcb-alerts'         },
      // ── Compliance Knowledge ─────────────────────────
      { label: 'Knowledge Hub',        href: '/admin/compliance-knowledge',            id: 'compliance-knowledge', dividerBefore: true },
      { label: 'Frameworks',           href: '/admin/compliance-knowledge/frameworks', id: 'compliance-frameworks' },
      { label: 'Deadlines',            href: '/admin/compliance-knowledge/deadlines',  id: 'compliance-deadlines'  },
      { label: 'Assign to Clients',    href: '/admin/compliance-knowledge/assign',     id: 'compliance-assign'     },
      // ── EPR Notifications ────────────────────────────
      { label: 'All Notifications',    href: '/admin/notifications',                            id: 'notif-list', dividerBefore: true },
      { label: 'Pending Review',       href: '/admin/notifications?status=draft',               id: 'notif-draft'      },
      { label: 'Export Report',        href: '/api/admin/notifications/export?format=xlsx',     id: 'notif-export'     },
      // ── Autofill Engine ──────────────────────────────
      { label: 'Autofill Hub',         href: '/admin/autofill',                id: 'autofill',         dividerBefore: true },
      { label: 'Global Fields',        href: '/admin/autofill/global-fields',  id: 'autofill-fields'   },
      { label: 'Portal Registry',      href: '/admin/autofill/portals',        id: 'autofill-portals'  },
      { label: 'Field Mappings',       href: '/admin/autofill/mappings',       id: 'autofill-mappings' },
    ],
  },
  {
    title: 'FINANCE & MARKET',
    id: 'finance',
    items: [
      { label: 'Billing',            href: '/admin/billing',                                                          id: 'billing'          },
      { label: 'Payments',           href: '/admin/billing/payments',                                                 id: 'payments'         },
      { label: 'Credit Notes',       href: '/admin/billing/credits',                                                  id: 'credit-notes'     },
      { label: 'Marketplace',        href: '/admin/marketplace',                                                      id: 'marketplace',       dividerBefore: true },
      { label: 'Profiles – All',     href: '/admin/marketplace/profiles',                                             id: 'marketplace-profiles'              },
      { label: 'Consultants',        href: '/admin/marketplace/profiles?listing=consultants_marketplace',             id: 'marketplace-consultants'           },
      { label: 'Service Companies',  href: '/admin/marketplace/profiles?listing=service_providers_directory',         id: 'marketplace-service-providers'     },
      { label: 'EPR Consultants',    href: '/admin/marketplace/profiles?listing=compliance_consultants',              id: 'marketplace-compliance-consultants'},
      { label: 'Recyclers & PRO',    href: '/admin/marketplace/profiles?listing=recyclers_pro_network',               id: 'marketplace-recyclers-pro'         },
      { label: 'Credit Trading',     href: '/admin/marketplace/epr-credit-trading',                                   id: 'marketplace-trading'               },
      { label: 'Credit Price History', href: '/admin/marketplace/price-history',                                      id: 'price-history'                     },
      { label: 'Requirements Board',  href: '/marketplace/requirements',                                               id: 'requirements-board'                },
      { label: 'CEPC Consultants',   href: '/admin/cepc',                                                             id: 'cepc',              dividerBefore: true },
      { label: 'CEPC Leaderboard',   href: '/admin/cepc/leaderboard',                                                 id: 'cepc-leaderboard'  },
    ],
  },
  {
    title: 'ACADEMY & MARKETING',
    id: 'marketing',
    items: [
      { label: 'Academy',              href: '/admin/academy',               id: 'academy'                          },
      { label: 'Programs',             href: '/admin/academy/programs',      id: 'academy-programs'                 },
      { label: 'Sessions',             href: '/admin/academy/sessions',      id: 'academy-sessions'                 },
      { label: 'Registrations',        href: '/admin/academy/registrations', id: 'academy-registrations'            },
      { label: '→ Academy Portal',     href: '/academy/dashboard',           id: 'academy-portal',  dividerBefore: true },
      { label: 'WhatsApp Broadcast',   href: '/admin/whatsapp/broadcast',    id: 'whatsapp',        dividerBefore: true },
      { label: 'WA Leads',             href: '/admin/whatsapp/leads',        id: 'whatsapp-leads'                   },
      { label: 'Announcements',        href: '/admin/announcements',         id: 'announcements'                    },
      { label: 'All Forms',            href: '/admin/forms',                 id: 'forms',           dividerBefore: true },
      { label: 'Contact Forms',        href: '/admin/forms/contact_form',                              id: 'forms-contact'              },
      { label: 'Consultation Forms',   href: '/admin/forms/consultation_form',                         id: 'forms-consultation'         },
      { label: 'Callback Forms',       href: '/admin/forms/callback_form',                             id: 'forms-callback'             },
      { label: 'Newsletter Forms',     href: '/admin/forms/newsletter_form',                           id: 'forms-newsletter'           },
      { label: 'Training Forms',       href: '/admin/forms/training_form',                             id: 'forms-training'             },
      { label: 'Webinar Forms',        href: '/admin/forms/webinar_form',                              id: 'forms-webinar'              },
      { label: 'Workshop Forms',       href: '/admin/forms/workshop_form',                             id: 'forms-workshop'             },
      { label: 'Job Applications',     href: '/admin/forms/job_applications',                          id: 'forms-job-applications'     },
      { label: 'Calculator Forms',     href: '/admin/forms/calculator_form',                           id: 'forms-calculator'           },
      { label: 'Program Applications', href: '/admin/forms/service_provider_program_application',      id: 'forms-program-applications' },
      { label: 'Network Requirements', href: '/admin/forms/network_requirement_form',                  id: 'forms-network-requirements' },
      { label: 'Resource Downloads',   href: '/admin/resources/downloads',   id: 'resource-downloads', dividerBefore: true },
    ],
  },
  {
    title: 'SETTINGS',
    id: 'settings',
    items: [
      { label: 'Team',           href: '/admin/settings/team',          id: 'team'           },
      { label: 'Notifications',  href: '/admin/settings/notifications', id: 'notifications'  },
      { label: 'Instructions',   href: '/admin/settings/instructions',  id: 'instructions'   },
      { label: 'Users',          href: '/admin/users',                  id: 'users'          },
      { label: 'Integrations',   href: '/admin/settings/integrations',  id: 'integrations'   },
      { label: 'AI Docs Center', href: '/admin/ai-documentation-center', id: 'ai-docs',       dividerBefore: true },
      { label: 'Pages Directory',href: '/admin/pages',                  id: 'pages'          },
      { label: 'Audit Log',      href: '/admin/audit-log',              id: 'audit-log'      },
      { label: 'Login as User',  href: '/admin/impersonate',            id: 'impersonate'    },
    ],
  },
];

// ── Maps a nav item href to the group id it lives in, so the tour can
// auto-expand the right accordion group before highlighting a step.
const ITEM_GROUP: Record<string, string> = GROUPS.reduce((acc, g) => {
  for (const item of g.items) acc[item.href] = g.id;
  return acc;
}, {} as Record<string, string>);

// ── SVG icon map ───────────────────────────────────────────────────────────────
function NavIcon({ id }: { id: string }) {
  const Icon = id.includes('dashboard') ? LayoutDashboard
    : /analytics|reports|growth/.test(id) ? BarChart3
    : /client|partner|team|user|lead/.test(id) ? Users
    : /billing|payment|market|credit/.test(id) ? Wallet
    : /settings|integration|fields|mapping/.test(id) ? Settings
    : /call|followup/.test(id) ? Phone
    : /compliance|certificate|audit/.test(id) ? ShieldCheck
    : /notif|alert/.test(id) ? Bell
    : /task|filing|registration/.test(id) ? ClipboardList
    : /doc|script|page/.test(id) ? FileText : Folder;
  return <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function isSuperAdmin(email?: string | null) {
  const list = String(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || '').trim().toLowerCase());
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminSidebar({ unreadCount }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('');
  const router   = useRouter();
  const currentPath = pathname || '';

  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  function toggleCollapsed() {
    try { localStorage.setItem(SIDEBAR_KEY, String(!collapsed)); } catch { return; }
    window.dispatchEvent(new Event('admin-sidebar-change'));
  }

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group open/close
  const [groupStates, setGroupStates] = useState<Record<string, Record<string, boolean>>>({});
  const openGroups = groupStates[currentPath] || {};
  function setOpenGroups(update: (previous: Record<string, boolean>) => Record<string, boolean>) {
    setGroupStates(previous => ({ ...previous, [currentPath]: update(previous[currentPath] || {}) }));
  }

  const tour = usePortalTour({
    steps: interleaveDeepDive(ADMIN_TOUR_STEPS, { '/admin/dashboard': ADMIN_DASHBOARD_TOUR_STEPS }),
    storageKey: SIDEBAR_KEY,
  });

  useEffect(() => {
    if (!tour.isActive || !tour.step) return;
    // The guided tour owns focus; reveal its navigation target on small screens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.innerWidth < 640) setMobileOpen(true);
  }, [tour.isActive, tour.step]);

  const nextTourStep = tour.next;
  // Auto-skip a step if its target isn't in the current DOM (e.g. role-gated
  // nav item not rendered for this user)
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) nextTourStep();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.isReady, nextTourStep]);

  // Role-based module access
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);
  const [isUserSuperAdmin, setIsUserSuperAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadAccess() {
      try {
        const { data: { user } } = await (supabase as any).auth.getUser();
        const email = String(user?.email || '').toLowerCase();
        const superAdmin = Boolean(email) && isSuperAdmin(email);
        if (active) setIsUserSuperAdmin(superAdmin);

        if (!email || superAdmin) {
          if (active) setAllowedModules(null);
          return;
        }
        const raw = localStorage.getItem(TEAM_STORAGE_KEY);
        const members = normalizeMembers(raw ? JSON.parse(raw) : []);
        const member = members.find((m: any) => m.email === email);
        if (!member) { if (active) setAllowedModules(null); return; }
        if (active) setAllowedModules(member.active ? member.modules : []);
      } catch {
        if (active) setAllowedModules(null);
      }
    }
    loadAccess();
    return () => { active = false; };
  }, []);

  const visibleGroups = useMemo(() => {
    const baseGroups = GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => (isUserSuperAdmin ? true : item.id !== 'ai-docs')),
    })).filter((g) => g.items.length > 0);

    if (!allowedModules) return baseGroups;
    return baseGroups.map((g) => ({
      ...g,
      items: g.items.filter((item) => allowedModules.includes(routeToModule(item.href))),
    })).filter((g) => g.items.length > 0);
  }, [allowedModules, isUserSuperAdmin]);

  const filteredGroups = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return visibleGroups.map(group => ({
      ...group,
      items: group.items.filter(item => (group.title + ' ' + item.label).toLowerCase().includes(query)),
    })).filter(group => group.items.length);
  }, [filter, visibleGroups]);
  const activeId = activeNavigationId(currentPath, searchParams.toString(), visibleGroups.flatMap(group => group.items));
  const displayCollapsed = collapsed && !mobileOpen && !tour.isActive;
  function isGroupOpen(group: Group) {
    if (filter || (tour.isActive && ITEM_GROUP[tour.step?.id || ''] === group.id)) return true;
    return openGroups[group.id] ?? (group.id === 'overview' || group.items.some(item => item.id === activeId));
  }

  const allExpanded = visibleGroups.length > 0 && visibleGroups.every(isGroupOpen);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Sidebar body ─────────────────────────────────────────────────────────────
  const sidebarBody = (
    <div
      className={`
        flex h-full flex-col
        border-r border-zinc-200 bg-white
        transition-all duration-200
        ${displayCollapsed ? 'w-[68px]' : 'w-[256px]'} max-w-[85vw]
      `}
    >
      {/* ── Brand header ─────────────────────────────────────────── */}
      <div className={`flex h-16 shrink-0 items-center border-b border-zinc-200 px-3 ${displayCollapsed ? 'justify-center' : 'gap-2.5'}`}>
        <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={40} height={40} className="h-9 w-9 shrink-0 rounded-full object-contain" />
        {!displayCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold leading-tight text-zinc-900">EPR Compass</p>
            <p className="truncate text-[10px] leading-tight text-zinc-500">Administration</p>
          </div>
        )}
        {!displayCollapsed && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded p-1 text-zinc-500 hover:text-zinc-700 sm:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 py-4">
        {displayCollapsed ? (
          <button type="button" aria-label="Expand navigation search" title="Search navigation" onClick={toggleCollapsed} className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"><Search className="h-4 w-4" /></button>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input aria-label="Filter navigation" placeholder="Find a module..." value={filter} onChange={event => setFilter(event.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs text-zinc-800 outline-none placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            {filter && <button type="button" title="Clear filter" aria-label="Clear navigation filter" onClick={() => setFilter('')} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center text-zinc-500"><X className="h-3.5 w-3.5" /></button>}
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3" aria-label="Admin navigation">
        {!filteredGroups.length && <p role="status" className="px-2 py-4 text-xs text-zinc-500">No matching modules.</p>}
        {/* Expand/collapse all — expanded mode only */}
        {!displayCollapsed && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setOpenGroups((prev) => {
                  const next: Record<string, boolean> = { ...prev };
                  for (const g of visibleGroups) next[g.id] = !allExpanded;
                  return next;
                });
              }}
              title={allExpanded ? 'Collapse all groups' : 'Expand all groups'}
              aria-label={allExpanded ? 'Collapse all groups' : 'Expand all groups'}
              className="rounded px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:text-zinc-600"
            >
              {allExpanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
            </button>
          </div>
        )}

        {filteredGroups.map((group) => (
          <div key={group.id} className="mb-2">
            {/* Group header */}
            {!displayCollapsed ? (
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !isGroupOpen(group) }))}
                aria-expanded={isGroupOpen(group)}
                className="mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-normal text-zinc-500 transition hover:text-zinc-600"
              >
                <span>{group.title}</span>
                <ChevronRight className={`h-3 w-3 transition-transform ${isGroupOpen(group) ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <div className="mx-auto mb-1 h-px w-6 bg-zinc-100" />
            )}

            {/* Items */}
            {(displayCollapsed || isGroupOpen(group)) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.id === activeId;
                  return (
                    <div key={item.id}>
                      {/* Sub-cluster divider */}
                      {!displayCollapsed && item.dividerBefore && (
                        <div className="mx-2 my-1 h-px bg-zinc-100/70" />
                      )}
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => { setMobileOpen(false); setFilter(''); }}
                        data-tour-id={item.href}
                        title={displayCollapsed ? item.label : undefined}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                          active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800'
                        } ${displayCollapsed ? 'justify-center' : ''}`}
                      >
                        {/* Active left indicator */}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-emerald-600" />
                        )}
                        {/* Icon */}
                        <span className={`shrink-0 ${active ? 'text-emerald-700' : 'text-zinc-500 group-hover:text-zinc-700 transition-colors'}`}>
                          <NavIcon id={item.id} />
                        </span>
                        {/* Label */}
                        {!displayCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {/* Unread badge */}
                        {!displayCollapsed && item.id === 'dashboard' && unreadCount > 0 && (
                          <span className="ml-auto shrink-0 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        {/* Collapsed unread dot */}
                        {displayCollapsed && item.id === 'dashboard' && unreadCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
                        )}
                        {/* Tooltip in displayCollapsed mode */}
                        {displayCollapsed && (
                          <span className="pointer-events-none absolute left-full z-50 ml-2.5 hidden whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-800 shadow-xl group-hover:block">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="shrink-0 space-y-0.5 border-t border-zinc-200 p-2">
        {/* Intel workspace link */}
        <Link
          href="/intel"
          title={displayCollapsed ? 'Intel Workspace' : undefined}
          className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-emerald-800 ${displayCollapsed ? 'justify-center' : ''}`}
        >
          <Activity className="h-4 w-4 shrink-0" />
          {!displayCollapsed && <span>Intel Workspace</span>}
          {displayCollapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-2.5 hidden whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-800 shadow-xl group-hover:block">
              Intel Workspace
            </span>
          )}
        </Link>

        {/* Take a tour */}
        <button
          type="button"
          onClick={tour.start}
          title="Take a tour of this portal"
          aria-label="Take a tour of this portal"
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 ${displayCollapsed ? 'justify-center' : ''}`}
        >
          <CircleHelp className="h-4 w-4 shrink-0" />
          {!displayCollapsed && <span>Take a tour</span>}
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={displayCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={displayCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 sm:flex ${displayCollapsed ? 'justify-center' : ''}`}
        >
          <PanelLeftClose className={`h-4 w-4 shrink-0 ${displayCollapsed ? 'rotate-180' : ''}`} />
          {!displayCollapsed && <span>Collapse</span>}
        </button>

        {/* Sign out */}
        <button
          type="button"
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          aria-label="Sign out"
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-400 ${displayCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!displayCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        className="fixed left-3 top-2.5 z-30 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-slate-600 hover:bg-zinc-100 sm:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Desktop */}
      <aside className="hidden shrink-0 sm:block">{sidebarBody}</aside>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} className="relative z-40 sm:hidden">
        <div className="fixed inset-0 bg-zinc-950/40" aria-hidden="true" />
        <DialogPanel className="fixed inset-y-0 left-0 max-w-[85vw]">
          <DialogTitle className="sr-only">Admin navigation</DialogTitle>
          {sidebarBody}
        </DialogPanel>
      </Dialog>

      <GlobalSearch />

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
    </>
  );
}

