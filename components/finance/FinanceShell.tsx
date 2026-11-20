'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { FINANCE_TOUR_STEPS } from '@/components/portal/tour/financeTourSteps';
import { FINANCE_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/financeDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY   = 'finance-sidebar-collapsed';
const OPEN_GRP_KEY  = 'finance-open-groups';

// Maps a tour step's data-tour-id to the accordion group it lives inside,
// so the tour can auto-expand the group before the target is measured.
const TOUR_STEP_GROUP: Record<string, string> = {
  '/finance/treasury': 'treasury',
  '/finance/treasury/banks': 'treasury',
  '/finance/treasury/forecast': 'treasury',
  '/finance/treasury/investments': 'treasury',
  '/finance/statements/pl': 'statements',
  '/finance/statements/balance': 'statements',
  '/finance/statements/cashflow': 'statements',
  '/finance/statements/ledger': 'statements',
  '/finance/tax/gst': 'tax',
  '/finance/tax/tds': 'tax',
  '/finance/tax/income': 'tax',
};

// ── Icons (SVG path strings) ──────────────────────────────────────────────────
const ICONS = {
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  tasks:        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  treasury:     'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  bank:         'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  forecast:     'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v16H4V4z',
  investments:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  revenue:      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  ar:           'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  ap:           'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  budget:       'M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6m-3 4v6m-2-2h4',
  profit:       'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  statements:   'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  pl:           'M7 21h10M12 3v18M5 9l7-6 7 6',
  balance:      'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  cashflow:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  ledger:       'M4 6h16M4 10h16M4 14h16M4 18h16',
  tax:          'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  gst:          'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  tds:          'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  incometax:    'M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8z',
  expense:      'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  payroll:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  assets:       'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  compliance:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  risk:         'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  audit:        'M9 5l7 7-7 7',
  board:        'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  forecasting:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  invoices:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  chevronDown:  'M19 9l-7 7-7-7',
  chevronRight: 'M9 5l7 7-7 7',
  collapse:     'M15 18l-6-6 6-6',
  expand:       'M9 18l6-6-6-6',
  menu:         'M4 6h16M4 12h16M4 18h16',
  logout:       'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  dollar:       'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  pricing:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  sub:          'M9 5l7 7-7 7',
  tour:         'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

// ── Nav structure ─────────────────────────────────────────────────────────────
type SubItem  = { href: string; label: string; icon: string };
type NavLeaf  = { type: 'leaf'; href: string; label: string; icon: string; badge?: boolean; cfoOnly?: boolean };
type NavGroup = { type: 'group'; id: string; label: string; icon: string; items: SubItem[]; cfoOnly?: boolean };
type NavDiv   = { type: 'divider'; id: string };
type NavEntry = NavLeaf | NavGroup | NavDiv;

const NAV: NavEntry[] = [
  // ── Available to all finance roles ──────────────────────────────────────────
  { type: 'leaf',    href: '/finance/dashboard',  label: 'Dashboard',         icon: ICONS.dashboard  },
  { type: 'leaf',    href: '/finance/tasks',      label: 'My Tasks',          icon: ICONS.tasks, badge: true },
  { type: 'leaf',    href: '/finance/invoices',          label: 'Invoices',          icon: ICONS.invoices   },
  { type: 'leaf',    href: '/finance/payments',          label: 'Payments',          icon: ICONS.ar         },
  { type: 'leaf',    href: '/finance/pricing-strategy',  label: 'Pricing Strategy',  icon: ICONS.pricing    },

  // ── CFO-only sections ────────────────────────────────────────────────────────
  { type: 'divider', id: 'd1' },
  {
    type: 'group', id: 'treasury', label: 'Treasury', icon: ICONS.treasury, cfoOnly: true,
    items: [
      { href: '/finance/treasury',              label: 'Overview',      icon: ICONS.treasury    },
      { href: '/finance/treasury/banks',        label: 'Bank Accounts', icon: ICONS.bank        },
      { href: '/finance/treasury/forecast',     label: 'Cash Forecast', icon: ICONS.forecast    },
      { href: '/finance/treasury/investments',  label: 'Investments',   icon: ICONS.investments },
    ],
  },
  { type: 'leaf',    href: '/finance/revenue',       label: 'Revenue',             icon: ICONS.revenue,    cfoOnly: true },
  { type: 'leaf',    href: '/finance/ar',            label: 'Accounts Receivable', icon: ICONS.ar,         cfoOnly: true },
  { type: 'leaf',    href: '/finance/ap',            label: 'Accounts Payable',    icon: ICONS.ap,         cfoOnly: true },
  { type: 'leaf',    href: '/finance/budgets',       label: 'Budgeting',           icon: ICONS.budget,     cfoOnly: true },
  { type: 'leaf',    href: '/finance/profitability', label: 'Profitability',       icon: ICONS.profit,     cfoOnly: true },
  {
    type: 'group', id: 'statements', label: 'Financial Statements', icon: ICONS.statements, cfoOnly: true,
    items: [
      { href: '/finance/statements/pl',       label: 'P&L',           icon: ICONS.pl      },
      { href: '/finance/statements/balance',  label: 'Balance Sheet', icon: ICONS.balance },
      { href: '/finance/statements/cashflow', label: 'Cash Flow',     icon: ICONS.cashflow },
      { href: '/finance/statements/ledger',   label: 'General Ledger',icon: ICONS.ledger  },
    ],
  },
  { type: 'divider', id: 'd2' },
  {
    type: 'group', id: 'tax', label: 'Tax Management', icon: ICONS.tax, cfoOnly: true,
    items: [
      { href: '/finance/tax/gst',    label: 'GST',        icon: ICONS.gst       },
      { href: '/finance/tax/tds',    label: 'TDS',        icon: ICONS.tds       },
      { href: '/finance/tax/income', label: 'Income Tax', icon: ICONS.incometax },
    ],
  },
  { type: 'leaf',    href: '/finance/expenses',   label: 'Expense Management',    icon: ICONS.expense,    cfoOnly: true },
  { type: 'leaf',    href: '/finance/payroll',    label: 'Payroll Finance',       icon: ICONS.payroll,    cfoOnly: true },
  { type: 'leaf',    href: '/finance/assets',     label: 'Fixed Assets',          icon: ICONS.assets,     cfoOnly: true },
  { type: 'divider', id: 'd3' },
  { type: 'leaf',    href: '/finance/compliance', label: 'Compliance & Governance', icon: ICONS.compliance, cfoOnly: true },
  { type: 'leaf',    href: '/finance/risk',       label: 'Risk Management',       icon: ICONS.risk,       cfoOnly: true },
  { type: 'leaf',    href: '/finance/audit',      label: 'Audit Management',      icon: ICONS.audit,      cfoOnly: true },
  { type: 'leaf',    href: '/finance/board',      label: 'Board Reports',         icon: ICONS.board,      cfoOnly: true },
  { type: 'leaf',    href: '/finance/forecasting',label: 'Forecasting',           icon: ICONS.forecasting,cfoOnly: true },
  { type: 'divider', id: 'd4' },
  { type: 'leaf',    href: '/finance/settings',   label: 'Settings',              icon: ICONS.settings,   cfoOnly: true },
];

function getDefaultOpenGroups(pathname: string): Set<string> {
  const defaults = new Set<string>(['treasury', 'statements', 'tax']);
  // Also open whatever group the current path is inside
  for (const item of NAV) {
    if (item.type === 'group') {
      if (item.items.some(s => pathname.startsWith(s.href))) {
        defaults.add(item.id);
      }
    }
  }
  return defaults;
}

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Small components ──────────────────────────────────────────────────────────
function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-4 w-4'} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

// ── Shell Props ───────────────────────────────────────────────────────────────
interface Props {
  children:  React.ReactNode;
  userName:  string;
  userRole:  string;
  userEmail?: string;
}

export default function FinanceShell({ children, userName, userRole, userEmail }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const isCFO       = userRole === 'cfo';

  const [collapsed,  setCollapsed]  = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taskBadge,  setTaskBadge]  = useState(0);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['treasury', 'statements', 'tax']));

  const tour = usePortalTour({
    steps: interleaveDeepDive(FINANCE_TOUR_STEPS, { '/finance/dashboard': FINANCE_DASHBOARD_TOUR_STEPS }),
    storageKey: STORAGE_KEY,
  });

  // Make sure the sidebar (and, if needed, the group the target lives in) is visible while the tour runs
  useEffect(() => {
    if (!tour.isActive || !tour.step) return;
    if (collapsed) setCollapsed(false);
    if (window.innerWidth < 768) setMobileOpen(true);
    const groupId = TOUR_STEP_GROUP[tour.step.id];
    if (groupId) {
      setOpenGroups(prev => (prev.has(groupId) ? prev : new Set(prev).add(groupId)));
    }
  }, [tour.isActive, tour.step, collapsed]);

  // Auto-skip a step if its target isn't in the current DOM (e.g. gated nav item not rendered for this user)
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) tour.next();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.next]);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);

    const storedGroups = localStorage.getItem(OPEN_GRP_KEY);
    if (storedGroups) {
      try {
        const parsed: string[] = JSON.parse(storedGroups);
        const merged = new Set([...parsed, ...Array.from(getDefaultOpenGroups(pathname))]);
        setOpenGroups(merged);
      } catch {
        setOpenGroups(getDefaultOpenGroups(pathname));
      }
    } else {
      setOpenGroups(getDefaultOpenGroups(pathname));
    }
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expand group for current route
  useEffect(() => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      for (const item of NAV) {
        if (item.type === 'group' && item.items.some(s => pathname.startsWith(s.href))) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, [pathname]);

  // Task badge polling
  useEffect(() => {
    const fetchBadge = () => {
      fetch('/api/finance/tasks?status=pending&limit=1&countOnly=1')
        .then(r => r.ok ? r.json() : { count: 0 })
        .then((d: { count?: number }) => setTaskBadge(d.count ?? 0))
        .catch(() => {});
    };
    fetchBadge();
    const id = setInterval(fetchBadge, 90_000);
    return () => clearInterval(id);
  }, []);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(OPEN_GRP_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  async function handleLogout() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; Max-Age=0; path=/';
    router.push('/finance/login');
  }

  const initials = (userName || userEmail || 'F')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  // ── Sidebar render ──────────────────────────────────────────────────────────
  const sidebar = (
    <aside className={`flex flex-col h-full bg-[#0c1022] border-r border-emerald-900/30 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[240px]'}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-emerald-900/30 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40">
              <Icon path={ICONS.dollar} className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Finance Portal</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{userRole.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40">
            <Icon path={ICONS.dollar} className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={tour.start} title="Take a tour of this portal"
              className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition">
              <Icon path={ICONS.tour} className="h-4 w-4" />
            </button>
            <button onClick={handleToggle} aria-label="Collapse sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition">
              <Icon path={ICONS.collapse} className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {collapsed && (
        <button onClick={handleToggle} aria-label="Expand sidebar"
          className="flex items-center justify-center py-2 text-slate-600 hover:text-slate-300 transition">
          <Icon path={ICONS.expand} className="h-4 w-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700/50">
        {NAV.map((entry) => {
          if (entry.type === 'divider') {
            if (collapsed) return null;
            return <div key={entry.id} className="my-2 border-t border-slate-800/60" />;
          }

          if (entry.type === 'leaf') {
            if (entry.cfoOnly && !isCFO) return null;
            const active = pathname === entry.href || (entry.href !== '/finance' && pathname.startsWith(entry.href + '/'));
            const badge  = entry.badge ? taskBadge : 0;
            return (
              <Link key={entry.href} href={entry.href}
                data-tour-id={entry.href}
                title={collapsed ? entry.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                {active && !collapsed && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-emerald-400" />}
                <div className="relative shrink-0">
                  <Icon path={entry.icon} className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {badge > 0 && collapsed && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                {!collapsed && <span className="flex-1 truncate text-xs">{entry.label}</span>}
                {!collapsed && badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white bg-emerald-600">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          }

          if (entry.type === 'group') {
            if (entry.cfoOnly && !isCFO) return null;
            const isOpen   = openGroups.has(entry.id);
            const anyActive = entry.items.some(s => pathname.startsWith(s.href));

            if (collapsed) {
              // In collapsed mode: show group icon with active indicator
              return (
                <div key={entry.id} className="relative group/grp">
                  <button title={entry.label}
                    className={`relative flex w-full items-center justify-center rounded-lg px-2 py-2 transition-colors ${
                      anyActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 hover:bg-slate-800/70 hover:text-slate-300'
                    }`}
                  >
                    <Icon path={entry.icon} className="h-4 w-4" />
                    {anyActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-emerald-400" />}
                  </button>
                </div>
              );
            }

            return (
              <div key={entry.id}>
                {/* Group header */}
                <button onClick={() => toggleGroup(entry.id)}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    anyActive && !isOpen
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  {anyActive && !isOpen && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-emerald-400" />}
                  <Icon path={entry.icon} className={`h-4 w-4 shrink-0 ${anyActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="flex-1 truncate text-xs text-left">{entry.label}</span>
                  <Icon path={isOpen ? ICONS.chevronDown : ICONS.chevronRight} className="h-3 w-3 text-slate-600 shrink-0" />
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-800/60 pl-3">
                    {entry.items.map(sub => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                      return (
                        <Link key={sub.href} href={sub.href}
                          data-tour-id={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={`relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                            subActive
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                          }`}
                        >
                          {subActive && <span className="absolute -left-3 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-r bg-emerald-400" />}
                          <Icon path={sub.icon} className={`h-3.5 w-3.5 shrink-0 ${subActive ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800/60 p-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-[10px] font-bold text-emerald-300 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail || 'Finance'}</p>
              <p className="text-[10px] capitalize text-slate-500">{userRole.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition">
              <Icon path={ICONS.logout} className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-[10px] font-bold text-emerald-300 select-none" title={userName}>
                {initials}
              </div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="flex w-full items-center justify-center rounded-lg py-2 text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition">
              <Icon path={ICONS.logout} className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#020817] text-slate-100">
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col h-screen shrink-0 transition-all duration-200 ${
        mounted ? (collapsed ? 'w-[58px]' : 'w-[240px]') : 'w-[240px]'
      }`}>
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col h-full w-[240px]">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center h-14 px-4 border-b border-emerald-900/20 bg-[#0c1022]/95 backdrop-blur-sm shrink-0">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            className="mr-3 text-slate-500 hover:text-slate-200 transition">
            <Icon path={ICONS.menu} className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-slate-100">Finance Portal</span>
          {taskBadge > 0 && (
            <span className="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {taskBadge}
            </span>
          )}
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
          ringClass="border-emerald-500"
          buttonClass="bg-emerald-600 hover:bg-emerald-700"
          dotClass="bg-emerald-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
