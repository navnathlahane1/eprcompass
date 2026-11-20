'use client';

interface TelecallingSubNavProps {
  active: string;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/telecalling' },
  { id: 'leads', label: 'Leads', href: '/admin/telecalling/leads' },
  { id: 'calls', label: 'Calls', href: '/admin/telecalling/calls' },
  { id: 'followups', label: 'Follow-ups', href: '/admin/telecalling/followups' },
  { id: 'campaigns', label: 'Campaigns', href: '/admin/telecalling/campaigns' },
  { id: 'agents',    label: 'Agents',    href: '/admin/telecalling/agents' },
  { id: 'tc-tasks', label: 'Tasks',    href: '/admin/telecalling/tasks' },
  { id: 'scripts', label: 'Scripts', href: '/admin/telecalling/scripts' },
  { id: 'notifications', label: 'Notifications', href: '/admin/telecalling/notifications' },
  { id: 'emails', label: 'Emails', href: '/admin/telecalling/email-templates' },
  { id: 'proposals', label: 'Proposals', href: '/admin/telecalling/proposals' },
  { id: 'analytics', label: 'Analytics', href: '/admin/telecalling/analytics' },
  { id: 'settings', label: 'Settings', href: '/admin/telecalling/settings' },
];

export default function TelecallingSubNav({ active }: TelecallingSubNavProps) {
  return (
    <div className="border-b border-slate-700/60 mb-6">
      <nav className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <a
            key={tab.id}
            href={tab.href}
            className={[
              'whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              active === tab.id
                ? 'border-blue-600 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700',
            ].join(' ')}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
