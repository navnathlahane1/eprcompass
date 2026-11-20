/**
 * GET /api/academy/trainer-profile/[id]
 * Returns a trainer's full profile for director/manager viewing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

const ALLOWED_ROLES = ['academy_director', 'academy_manager', 'admin'];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ALLOWED_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = getServiceClient();

  const [{ data: profile }, { data: clients }, { data: profileRow }] = await Promise.all([
    db.from('trainer_profiles').select('*').eq('user_id', id).maybeSingle(),
    db.from('trainer_past_clients').select('*').eq('trainer_id', id).order('sort_order'),
    db.from('profiles').select('full_name, email, role, avatar_url').eq('id', id).maybeSingle(),
  ]);

  return NextResponse.json({
    profile:  profile ?? null,
    clients:  clients ?? [],
    name:     profileRow?.full_name ?? '—',
    email:    profileRow?.email ?? '',
    role:     profileRow?.role ?? '',
    avatarUrl: profileRow?.avatar_url ?? (profile as any)?.profile_photo_url ?? null,
  });
}
