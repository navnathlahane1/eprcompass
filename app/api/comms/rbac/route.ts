import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient, COMMS_ROLES } from '@/lib/comms/auth';

// GET: fetch full RBAC matrix (all roles × all verbs)
export async function GET() {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getCommsAdminClient();

  const [permsRes, matrixRes] = await Promise.all([
    client.from('comms_permissions').select('verb, description').order('verb'),
    client.from('comms_role_permissions').select('role, permission_verb, granted, scope').order('role'),
  ]);

  if (permsRes.error) return NextResponse.json({ error: permsRes.error.message }, { status: 500 });

  // Roles to display (exclude admin/manager which are not stored in the matrix)
  const commsOnlyRoles = COMMS_ROLES.filter(r => r !== 'admin' && r !== 'manager');

  return NextResponse.json({
    permissions: permsRes.data ?? [],
    matrix:      matrixRes.data ?? [],
    roles:       commsOnlyRoles,
  });
}

// PATCH: toggle a single role × verb cell
// Only CMO and admin may edit
export async function PATCH(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['admin', 'comms_cmo'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden: only CMO and Admin can modify the permission matrix' }, { status: 403 });
  }

  const { role, verb, granted } = await req.json();
  if (!role || !verb || typeof granted !== 'boolean') {
    return NextResponse.json({ error: 'role, verb, and granted (boolean) are required' }, { status: 400 });
  }

  const client = getCommsAdminClient();

  const { error } = await client
    .from('comms_role_permissions')
    .update({ granted, updated_at: new Date().toISOString() })
    .eq('role', role)
    .eq('permission_verb', verb);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
