export const ADMIN_HELP_MODULES = [
  'dashboard',
  'crm',
  'compliance',
  'documents',
  'recyclers',
  'billing',
  'marketplace',
  'cepc',
  'academy',
  'team-settings',
  'notifications',
  'instructions'
] as const;

export const PORTAL_HELP_MODULES = [
  'dashboard',
  'filings',
  'documents',
  'payments',
  'account',
  'contacts',
  'activity'
] as const;

export function adminPathToHelpModule(pathname: string): string {
  if (pathname === '/admin' || pathname.startsWith('/admin/dashboard')) return 'dashboard';
  if (pathname.startsWith('/admin/crm')) return 'crm';
  if (pathname.startsWith('/admin/compliance')) return 'compliance';
  if (pathname.startsWith('/admin/documents')) return 'documents';
  if (pathname.startsWith('/admin/recyclers')) return 'recyclers';
  if (pathname.startsWith('/admin/billing')) return 'billing';
  if (pathname.startsWith('/admin/marketplace')) return 'marketplace';
  if (pathname.startsWith('/admin/cepc')) return 'cepc';
  if (pathname.startsWith('/admin/academy')) return 'academy';
  if (pathname.startsWith('/admin/settings/team')) return 'team-settings';
  if (pathname.startsWith('/admin/settings/notifications')) return 'notifications';
  if (pathname.startsWith('/admin/settings/instructions')) return 'instructions';
  return 'dashboard';
}

export function portalPathToHelpModule(pathname: string): string {
  if (pathname.startsWith('/portal/dashboard')) return 'dashboard';
  if (pathname.startsWith('/portal/filings')) return 'filings';
  if (pathname.startsWith('/portal/documents')) return 'documents';
  if (pathname.startsWith('/portal/payments')) return 'payments';
  if (pathname.startsWith('/portal/account')) return 'account';
  if (pathname.startsWith('/portal/contacts')) return 'contacts';
  if (pathname.startsWith('/portal/activity')) return 'activity';
  return 'dashboard';
}
