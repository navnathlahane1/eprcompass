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

/**
 * GET /api/admin/audit-log
 * Query params: limit (default 100), resource_type, action, user_id
 *
 * Returns the most recent admin audit log entries.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  const deny = requireAdmin(actor);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const limit        = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const resourceType = searchParams.get('resource_type') || '';
  const action       = searchParams.get('action') || '';
  const userId       = searchParams.get('user_id') || '';

  const db = makeServiceClient();

  let query = db
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (resourceType) query = query.eq('resource_type', resourceType);
  if (action)       query = query.eq('action', action);
  if (userId)       query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) {
    // Table may not exist yet (migration not run)
    const missing =
      error.message.includes('does not exist') ||
      error.message.includes('relation') ||
      error.message.includes('admin_audit_log');
    if (missing) return NextResponse.json({ entries: [], warning: 'Audit log table not yet created. Run migration 064.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user emails from auth.users
  const userIds = [...new Set((data || []).map((e) => e.user_id).filter(Boolean))] as string[];
  let emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authData?.users || []) emailMap[u.id] = u.email ?? '';
  }

  const entries = (data || []).map((e) => ({
    ...e,
    user_email: emailMap[e.user_id as string] || (e.user_email as string) || null,
  }));

  return NextResponse.json({ entries });
}

/**
 * POST /api/admin/audit-log
 * Body: { action, resource_type, resource_id?, old_value?, new_value?, notes? }
 *
 * Allows server-side code (or trusted admin actions) to write log entries.
 */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  const deny = requireAdmin(actor);
  if (deny) return deny;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, resource_type, resource_id, old_value, new_value, notes } = body;
  if (!action || !resource_type) {
    return NextResponse.json({ error: 'action and resource_type are required' }, { status: 400 });
  }

  const db = makeServiceClient();
  const { data, error } = await db.from('admin_audit_log').insert({
    user_id:       actor!.userId,
    action:        String(action),
    resource_type: String(resource_type),
    resource_id:   resource_id ? String(resource_id) : null,
    old_value:     old_value ?? null,
    new_value:     new_value ?? null,
    notes:         notes ? String(notes) : null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
