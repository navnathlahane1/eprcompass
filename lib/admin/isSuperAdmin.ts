/**
 * Super-admin allow-list.
 *
 * Server: `SUPER_ADMIN_EMAILS` (preferred, not shipped to the browser) plus
 * `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` (legacy / UI chrome).
 * Client: only the NEXT_PUBLIC list is available — never use that list as the
 * sole authorization check on an API route.
 */
export function getSuperAdminEmails(): string[] {
  const combined = [process.env.SUPER_ADMIN_EMAILS, process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS]
    .filter(Boolean)
    .join(',');
  return combined
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(email?: string | null): boolean {
  return getSuperAdminEmails().includes(String(email || '').trim().toLowerCase());
}

/**
 * Returns the effective role for an admin user, honouring the super admin bypass.
 * Super admins are always treated as 'admin' regardless of their DB profile role.
 */
export function effectiveAdminRole(
  dbRole: string | null | undefined,
  email: string | null | undefined
): string {
  if (isSuperAdmin(email)) return 'admin';
  return dbRole || '';
}
