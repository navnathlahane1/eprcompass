'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────
type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ReactNode;
  badge?: string;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

// ── SVG icon helpers ──────────────────────────────────────────────────────────
const S = (d: string | string[], extra?: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round"
    className={`h-[17px] w-[17px] shrink-0 ${extra ?? ''}`}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

// ── Navigation groups ─────────────────────────────────────────────────────────
const GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        href: '/intel', exact: true, label: 'Command Center',
        icon: S(['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10']),
      },
      {
        href: '/intel/radar', label: 'Regulatory Radar',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0">
            <path d="M5.5 5.5A8.38 8.38 0 0 0 3 12"/><path d="M18.5 5.5A8.38 8.38 0 0 1 21 12"/><path d="M9 9a4.38 4.38 0 0 0-1.28 3"/><path d="M15 9a4.38 4.38 0 0 1 1.28 3"/><circle cx="12" cy="12" r="1"/>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Market Intelligence',
    items: [
      {
        href: '/intel/companies', label: 'Companies',
        icon: S(['M3 21h18', 'M4 21V8l8-5 8 5v13', 'M9 21v-5h6v5']),
      },
      {
        href: '/intel/leads', label: 'Lead Scoring',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        ),
      },
      {
        href: '/intel/staging', label: 'Lead Intelligence',
        icon: S(['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']),
      },
      {
        href: '/intel/products', label: 'Product Intel',
        icon: S(['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.27 6.96 12 12.01l8.73-5.05', 'M12 22.08V12']),
      },
      {
        href: '/intel/recyclers', label: 'Recycler Network',
        icon: S(['M2.5 2 1 7l5.5-.5L2.5 2z', 'M1 7c1.7 5 7.2 8.3 12 8.3', 'M21.5 22 23 17l-5.5.5 4 4.5z', 'M23 17c-1.7-5-7.2-8.3-12-8.3']),
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      {
        href: '/intel/expirations', label: 'Expiry Tracker',
        icon: S(['M8 2v4', 'M16 2v4', 'M3 10h18', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z', 'M12 14v3', 'M12 11v.01']),
      },
      {
        href: '/intel/outreach', label: 'Outreach Center',
        icon: S(['M22 2 11 13', 'M22 2 15 22 11 13 2 9l20-7z']),
      },
      {
        href: '/intel/location-review-queue', label: 'Review Queue',
        icon: S(['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z']),
      },
    ],
  },
  {
    id: 'dataops',
    label: 'Data Operations',
    items: [
      {
        href: '/intel/upload', label: 'Import Data',
        icon: S(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12']),
      },
      {
        href: '/intel/sources', label: 'Source Registry',
        icon: S(['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z']),
      },
      {
        href: '/intel/discovery', label: 'Discovery Ops',
        icon: S(['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01']),
      },
      {
        href: '/intel/export', label: 'Export',
        icon: S(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']),
      },
      {
        href: '/intel/dynamic-columns', label: 'Schema Evolution',
        icon: S(['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z']),
      },
      {
        href: '/intel/templates', label: 'Mapping Templates',
        icon: S(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8']),
      },
    ],
  },
  {
    id: 'cockpit',
    label: 'Strategy Cockpit',
    items: [
      {
        href: '/intel/cockpit', exact: true, label: 'Morning Brief',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        ),
      },
      {
        href: '/intel/cockpit/tasks', label: 'Tasks',
        icon: S(['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']),
      },
      {
        href: '/intel/cockpit/plays', label: 'Plays',
        icon: S(['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M10 8l6 4-6 4V8z']),
      },
      {
        href: '/intel/cockpit/deals', label: 'Deal Analytics',
        icon: S(['M18 20V10', 'M12 20V4', 'M6 20v-6']),
      },
      {
        href: '/intel/cockpit/market', label: 'Market Map',
        icon: S(['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z', 'M8 2v16', 'M16 6v16']),
      },
      {
        href: '/intel/cockpit/risk', label: 'Risk',
        icon: S(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']),
      },
      {
        href: '/intel/cockpit/standing', label: 'Market Standing',
        icon: S(['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6']),
      },
      {
        href: '/intel/cockpit/money', label: 'Revenue',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
      {
        href: '/intel/cockpit/memo', label: 'Strategy Memo',
        icon: S(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8']),
      },
      {
        href: '/intel/cockpit/scenarios', label: 'Scenarios',
        icon: S(['M6 3h12l4 6-10 13L2 9z', 'M11 3 8 9l4 13', 'M13 3l3 6-4 13', 'M2 9h20']),
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
interface IntelSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function IntelSidebar({ collapsed, onToggle }: IntelSidebarProps) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-full flex-col border-r border-slate-800/80 bg-[#0a0f1e] transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-[220px]'
      }`}
    >
      {/* ── Logo / Brand ───────────────────────────────────────────────────── */}
      <div className={`flex h-14 shrink-0 items-center border-b border-slate-800/80 px-3 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        {/* Logo mark */}
        <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={36} height={36} className="h-8 w-8 shrink-0 rounded-full object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-tight text-slate-100 leading-none">EPR Intel</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Intelligence Platform</p>
          </div>
        )}
      </div>

      {/* ── Scrollable nav area ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
        {GROUPS.map((group) => (
          <div key={group.id} className="mb-1">
            {/* Group label */}
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-1 h-px w-6 bg-slate-800" />}

            {/* Items */}
            {group.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour-id={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group relative mx-1.5 mb-0.5 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'bg-teal-500/15 text-teal-300'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-teal-400" />
                  )}
                  <span className={active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto shrink-0 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">
                      {item.badge}
                    </span>
                  )}
                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-2.5 hidden whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 shadow-xl group-hover:block z-50">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom links ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-800/80 py-2">
        <Link
          href="/intel/field-explainer"
          title={collapsed ? 'Field Guide' : undefined}
          className={`group relative mx-1.5 mb-0.5 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-800/60 hover:text-slate-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          {!collapsed && <span className="truncate">Field Guide</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2.5 hidden whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 shadow-xl group-hover:block z-50">
              Field Guide
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mx-1.5 flex w-[calc(100%-12px)] items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-800/60 hover:text-slate-300 ${collapsed ? 'justify-center' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            className={`h-[17px] w-[17px] shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}>
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
