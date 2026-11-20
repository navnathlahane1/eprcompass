import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { requireAdmin } from '@/lib/api/requireActor';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

const ALLOWED_ROLES = [
  'client', 'admin', 'manager', 'telecaller', 'sales-executive',
  'epr-executive', 'operator', 'hr-executive', 'training-executive',
] as const;

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: string }
 *
 * Updates the profiles.role for the given user ID.
 * Only super-admins / DB admins may call this endpoint.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await resolveActor();
  const deny = requireAdmin(actor);
  if (deny) return deny;

  const { id } = await params;
  let body: { role?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const role = String(body.role || '').trim();
  if (!ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json(
      { error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  const db = makeServiceClient();

  // Upsert so users who have no profile row yet still get one
  const { error } = await db
    .from('profiles')
    .upsert({ id, role }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to audit table (best-effort, don't fail the request if it errors)
  try {
    await db.from('admin_audit_log').insert({
      user_id: actor!.userId,
      action: 'update_role',
      resource_type: 'user',
      resource_id: id,
      new_value: { role },
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, role });
}
