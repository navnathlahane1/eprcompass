/**
 * Academy Director → IAM user-creation requests.
 *
 * GET  /api/academy/user-requests
 *   Director/Admin: list the requests this user has raised (newest first).
 *
 * POST /api/academy/user-requests
 *   Director/Admin: raise a request for IAM to create a new academy user.
 *   Body: { role, full_name, email, phone?, company_name?, notes? }
 *   role ∈ { trainer, guest_trainer, academy_manager }.
 *   Notifies IAM operators (user_manager / admin / manager) so it shows up
 *   in their /iam/requests queue.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const REQUESTABLE_ROLES = ['trainer', 'guest_trainer', 'academy_manager'] as const;
const ROLE_LABELS: Record<string, string> = {
  trainer: 'Trainer',
  guest_trainer: 'Guest Trainer',
  academy_manager: 'Academy Manager',
};

export async function GET() {
  const actor = await resolveAcademyActor(['academy_director', 'admin']);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  try {
    const { data, error } = await db
      .from('academy_user_requests')
      .select('*')
      .eq('requested_by', actor.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ requests: data ?? [] });
  } catch {
    // Table may not exist yet (migration 154 pending) — degrade gracefully.
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor(['academy_director', 'admin']);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const role = String(body.role || '');
  const full_name = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = body.phone ? String(body.phone).trim() : null;
  const company_name = body.company_name ? String(body.company_name).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!REQUESTABLE_ROLES.includes(role as typeof REQUESTABLE_ROLES[number])) {
    return NextResponse.json(
      { error: `Role must be one of: ${REQUESTABLE_ROLES.join(', ')}` },
      { status: 400 }
    );
  }
  if (!full_name) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: inserted, error } = await db
    .from('academy_user_requests')
    .insert({
      requested_by: actor.id,
      requested_by_name: actor.fullName,
      requested_by_email: actor.email,
      role,
      full_name,
      email,
      phone,
      company_name,
      notes,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('academy_user_requests') ? 'Requests are not enabled yet (migration 154 pending).' : error.message },
      { status: 500 }
    );
  }

  // Notify IAM operators so the request surfaces in their queue.
  try {
    const { data: iamUsers } = await db
      .from('profiles')
      .select('id')
      .in('role', ['user_manager', 'admin', 'manager'])
      .eq('is_banned', false);

    const roleLabel = ROLE_LABELS[role] ?? role;
    const message = `${actor.fullName || 'An Academy Director'} requested a new ${roleLabel}: ${full_name}`;

    if (iamUsers?.length) {
      await db.from('notifications').insert(
        iamUsers.map(u => ({
          profile_id: u.id,
          type: 'system',
          message,
          link: '/iam/requests',
          read: false,
        }))
      );
    }
  } catch {
    // Best-effort notification; never block the request.
  }

  return NextResponse.json({ request: inserted }, { status: 201 });
}
