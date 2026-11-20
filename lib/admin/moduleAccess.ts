export const TEAM_STORAGE_KEY = 'admin.team.settings.v1';

export const AVAILABLE_MODULES = [
  'dashboard',
  'analytics',
  'reports',
  'resource-downloads',
  'crm',
  'compliance',
  'documents',
  'recyclers',
  'tasks',
  'bulk-filing',
  'renewals',
  'onboarding',
  'billing',
  'marketplace',
  'price-history',
  'whatsapp',
  'forms',
  'cepc',
  'academy',
  'partner-import',
  'partner-outreach',
  'team-settings',
  'notifications',
  'announcements',
  'instructions',
  'users',
  'pages',
  'impersonate',
  'telecalling'
] as const;

export type ModuleName = (typeof AVAILABLE_MODULES)[number];

export type TeamRole =
  | 'admin'
  | 'manager'
  | 'operator'
  | 'hr-executive'
  | 'sales-executive'
  | 'training-executive'
  | 'epr-executive'
  | 'telecaller';

export type TeamMemberAccess = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  active: boolean;
  modules: string[];
};

export function defaultModulesByRole(role: TeamRole): string[] {
  if (role === 'admin') return [...AVAILABLE_MODULES];
  if (role === 'manager') {
    return ['dashboard', 'analytics', 'reports', 'resource-downloads', 'crm', 'compliance', 'documents', 'recyclers', 'tasks', 'renewals', 'onboarding', 'billing', 'marketplace', 'whatsapp', 'forms', 'notifications', 'announcements', 'telecalling'];
  }
  if (role === 'hr-executive') {
    return ['dashboard', 'onboarding', 'tasks', 'forms', 'notifications', 'announcements'];
  }
  if (role === 'sales-executive') {
    return ['dashboard', 'crm', 'billing', 'marketplace', 'resource-downloads', 'whatsapp', 'forms', 'notifications', 'announcements', 'telecalling'];
  }
  if (role === 'training-executive') {
    return ['dashboard', 'academy', 'cepc', 'forms', 'whatsapp', 'notifications', 'announcements'];
  }
  if (role === 'epr-executive') {
    return ['dashboard', 'crm', 'compliance', 'documents', 'recyclers', 'bulk-filing', 'renewals', 'onboarding', 'tasks', 'notifications', 'announcements'];
  }
  if (role === 'telecaller') {
    return ['telecalling'];
  }
  return ['dashboard', 'crm', 'documents', 'notifications', 'announcements'];
}

export function routeToModule(pathname: string): ModuleName {
  if (pathname === '/admin' || pathname.startsWith('/admin/dashboard')) return 'dashboard';
  if (pathname.startsWith('/admin/analytics')) return 'analytics';
  if (pathname.startsWith('/admin/reports')) return 'reports';
  if (pathname.startsWith('/admin/resources')) return 'resource-downloads';
  if (pathname.startsWith('/admin/crm') || pathname.startsWith('/admin/partners')) return 'crm';
  if (pathname.startsWith('/admin/compliance')) return 'compliance';
  if (pathname.startsWith('/admin/documents')) return 'documents';
  if (pathname.startsWith('/admin/recyclers')) return 'recyclers';
  if (pathname.startsWith('/admin/tasks')) return 'tasks';
  if (pathname.startsWith('/admin/bulk-filing')) return 'bulk-filing';
  if (pathname.startsWith('/admin/renewals')) return 'renewals';
  if (pathname.startsWith('/admin/onboarding')) return 'onboarding';
  if (pathname.startsWith('/admin/billing')) return 'billing';
  if (pathname.startsWith('/admin/marketplace/price-history')) return 'price-history';
  if (pathname.startsWith('/admin/marketplace')) return 'marketplace';
  if (pathname.startsWith('/admin/whatsapp')) return 'whatsapp';
  if (pathname.startsWith('/admin/forms')) return 'forms';
  if (pathname.startsWith('/admin/cepc')) return 'cepc';
  if (pathname.startsWith('/admin/academy')) return 'academy';
  if (pathname.startsWith('/admin/partners/import')) return 'partner-import';
  if (pathname.startsWith('/admin/partners/outreach')) return 'partner-outreach';
  if (pathname.startsWith('/admin/settings/team')) return 'team-settings';
  if (pathname.startsWith('/admin/settings/notifications')) return 'notifications';
  if (pathname.startsWith('/admin/announcements')) return 'announcements';
  if (pathname.startsWith('/admin/settings/instructions')) return 'instructions';
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/pages')) return 'pages';
  if (pathname.startsWith('/admin/epr-credentials')) return 'compliance';
  if (pathname.startsWith('/admin/user-documents')) return 'documents';
  if (pathname.startsWith('/admin/impersonate')) return 'impersonate';
  if (pathname.startsWith('/admin/telecalling')) return 'telecalling';
  return 'dashboard';
}

export function normalizeMembers(raw: unknown): TeamMemberAccess[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => ({
      id: String(item?.id || ''),
      name: String(item?.name || ''),
      email: String(item?.email || '').toLowerCase(),
      role: (item?.role || 'operator') as TeamRole,
      active: Boolean(item?.active),
      modules: Array.isArray(item?.modules) ? item.modules.map((m: any) => String(m)) : defaultModulesByRole((item?.role || 'operator') as TeamRole)
    }))
    .filter((item) => item.id && item.email);
}
