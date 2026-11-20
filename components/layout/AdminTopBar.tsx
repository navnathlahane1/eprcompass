'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Search, Settings, Activity, ExternalLink, CircleHelp, Plus, UserPlus, ClipboardList, Receipt, Upload } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { adminPathToHelpModule } from '@/lib/instructions/modules';
import InboxBell from '@/components/inbox/InboxBell';

interface Props {
  unreadCount: number;
  userEmail?: string | null;
  userRole?: string | null;
}

export default function AdminTopBar({ userEmail, userRole }: Props) {
  const pathname = usePathname() || '/admin/dashboard';
  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const label = (segments.at(-1) || 'Overview').replace(/-/g, ' ');
  const iconClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600';

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white pl-16 pr-3 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <Link href="/admin/dashboard" className="hidden text-zinc-500 hover:text-emerald-700 md:block">Workspace</Link>
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-zinc-300 md:block" />
        <span aria-current="page" className="truncate font-medium capitalize text-zinc-900">{label}</span>
      </nav>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Menu>
          <MenuButton title="Quick create" aria-label="Quick create" className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800"><Plus className="h-4 w-4" /></MenuButton>
          <MenuItems anchor="bottom end" className="z-50 mt-2 w-48 rounded-lg border border-zinc-200 bg-white p-1 text-xs text-zinc-700 shadow-lg focus:outline-none">
            {[
              { label: 'New client', href: '/admin/crm/clients/new', icon: UserPlus },
              { label: 'Import leads', href: '/admin/telecalling/leads/import', icon: Upload },
              { label: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
              { label: 'New invoice', href: '/admin/billing/create', icon: Receipt },
            ].map(action => <MenuItem key={action.href}><Link href={action.href} className="flex items-center gap-2 rounded-md px-3 py-2.5 data-[focus]:bg-zinc-100"><action.icon className="h-4 w-4" />{action.label}</Link></MenuItem>)}
          </MenuItems>
        </Menu>
        <button type="button" title="Search workspace" aria-label="Search workspace" className={iconClass}
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
          <Search className="h-4 w-4" />
        </button>
        <Link href="/intel" title="Intel workspace" aria-label="Intel workspace" className={iconClass + ' hidden sm:flex'}><Activity className="h-4 w-4" /></Link>
        <Link href="/" title="Open website" aria-label="Open website" className={iconClass + ' hidden lg:flex'}><ExternalLink className="h-4 w-4" /></Link>
        <Link href="/admin/settings/team" title="Team settings" aria-label="Team settings" className={iconClass + ' hidden sm:flex'}><Settings className="h-4 w-4" /></Link>
        <InboxBell />
        <Link href={`/admin/help/${adminPathToHelpModule(pathname)}`} title="Module help" aria-label="Module help" className={iconClass + ' hidden sm:flex'}><CircleHelp className="h-4 w-4" /></Link>
        <div className="ml-1 flex min-w-0 items-center gap-2 border-l border-zinc-200 pl-3 sm:ml-2 sm:pl-4">
          <div title={userEmail || 'Admin workspace'} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{(userEmail || 'A')[0].toUpperCase()}</div>
          <div className="hidden max-w-40 lg:block">
            <p className="truncate text-xs font-semibold text-zinc-800" title={userEmail || undefined}>{userEmail || 'Admin workspace'}</p>
            <p className="truncate text-[11px] capitalize text-zinc-500">{(userRole || 'Operations').replace(/-/g, ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
