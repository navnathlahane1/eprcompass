import { getCommsAdminClient } from './auth';

export type PermissionVerb =
  | 'view' | 'create' | 'edit' | 'approve' | 'publish' | 'delete'
  | 'credentials:view_masked' | 'credentials:reveal'
  | 'connections:manage' | 'users:manage';

export type PermissionScope = 'global' | 'region' | 'own';

interface CheckOpts {
  accountRegion?: string | null;
  actorRegion?: string | null;
  isAccountOwner?: boolean;
}

// Checks whether the role has the given permission, respecting scope constraints.
// admin always returns true. manager gets brand_manager-level access.
export async function checkCommsPermission(
  role: string,
  verb: PermissionVerb,
  opts: CheckOpts = {}
): Promise<boolean> {
  if (role === 'admin') return true;

  // manager has same access as brand_manager (all except users:manage)
  if (role === 'manager') {
    return verb !== 'users:manage';
  }

  const client = getCommsAdminClient();
  const { data } = await client
    .from('comms_role_permissions')
    .select('granted, scope')
    .eq('role', role)
    .eq('permission_verb', verb)
    .maybeSingle();

  if (!data?.granted) return false;

  const scope = data.scope as PermissionScope | null;

  if (scope === 'region') {
    if (!opts.accountRegion || !opts.actorRegion) return false;
    return opts.accountRegion === opts.actorRegion;
  }

  if (scope === 'own') {
    return opts.isAccountOwner === true;
  }

  return true; // 'global' or null — no scope restriction
}

// Lightweight sync check used in middleware/layout — does NOT query DB.
// Only checks if the role can access the comms module at all.
export function isCommsRole(role: string): boolean {
  return (
    role === 'admin' ||
    role === 'manager' ||
    role.startsWith('comms_')
  );
}

// Returns all granted permissions for a role (for rendering the RBAC matrix UI).
export async function getRolePermissions(
  role: string
): Promise<Array<{ verb: string; granted: boolean; scope: string | null }>> {
  if (role === 'admin') return [];

  const client = getCommsAdminClient();
  const { data } = await client
    .from('comms_role_permissions')
    .select('permission_verb, granted, scope')
    .eq('role', role)
    .order('permission_verb');

  return (data ?? []).map(r => ({
    verb: r.permission_verb,
    granted: r.granted,
    scope: r.scope,
  }));
}
