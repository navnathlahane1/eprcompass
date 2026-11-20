/**
 * GET   /api/iam/user-requests/[id]
 *   Fetch a single request (used to pre-fill the Create User form).
 *
 * PATCH /api/iam/user-requests/[id]
 *   Body: { action: 'fulfill', created_user_id } | { action: 'reject', rejection_reason }
 *   Marks the request fulfilled (linked to the created profile) or rejected,
 *   and notifies the requesting Academy Director.
 *
 * Caller must be user_manager, admin, or manager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';

export const runtime = 'nodejs';

const IAM_ROLES = ['user_manager', 'admin', 'manager'];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !IAM_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getAdminClient();

  const { data, error } = await db
    .from('academy_user_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  return NextResponse.json({ request: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !IAM_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { action?: string; created_user_id?: string; rejection_reason?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const db = getAdminClient();

  const { data: request } = await db
    .from('academy_user_requests')
    .select('id, status, role, full_name, requested_by')
    .eq('id', id)
    .maybeSingle();

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (request.status !== 'pending') {
    return NextResponse.json({ error: `Request already ${request.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  let update: Record<string, unknown>;
  let directorMessage: string;

  if (body.action === 'fulfill') {
    update = {
      status: 'fulfilled',
      created_user_id: body.created_user_id || null,
      handled_by: user.id,
      handled_by_name: user.fullName || user.email,
      handled_at: now,
      updated_at: now,
    };
    directorMessage = `Your request for ${request.full_name} (${request.role}) has been created.`;
  } else if (body.action === 'reject') {
    update = {
      status: 'rejected',
      rejection_reason: body.rejection_reason?.trim() || null,
      handled_by: user.id,
      handled_by_name: user.fullName || user.email,
      handled_at: now,
      updated_at: now,
    };
    directorMessage = `Your request for ${request.full_name} (${request.role}) was declined${
      body.rejection_reason ? `: ${body.rejection_reason.trim()}` : '.'
    }`;
  } else {
    return NextResponse.json({ error: "action must be 'fulfill' or 'reject'" }, { status: 400 });
  }

  const { data: updated, error } = await db
    .from('academy_user_requests')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the requesting director so they see the outcome.
  if (request.requested_by) {
    try {
      await db.from('notifications').insert({
        profile_id: request.requested_by,
        type: 'system',
        message: directorMessage,
        link: '/academy/user-requests',
        read: false,
      });
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({ request: updated });
}
