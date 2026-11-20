import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

const DIRECTOR_ROLES = ['academy_director', 'admin'] as const;

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(DIRECTOR_ROLES as readonly string[]).includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.user_id || !['approve', 'reject'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const newStatus = body.action === 'approve' ? 'approved' : 'rejected';
  const db = getServiceClient();

  const { error } = await db
    .from('trainer_profiles')
    .update({
      profile_status: newStatus,
      reviewed_at:    new Date().toISOString(),
      reviewed_by:    actor.id,
      review_notes:   body.review_notes ?? null,
    })
    .eq('user_id', body.user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
