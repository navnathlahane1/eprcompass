import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const DIRECTOR_ROLES = ['academy_director', 'admin'] as const;
function isDirector(role: string) { return (DIRECTOR_ROLES as readonly string[]).includes(role); }

/** GET /api/academy/trainer-shares?trainer_id=xxx  — list all shares for a trainer */
export async function GET(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDirector(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const trainerId = searchParams.get('trainer_id');
  if (!trainerId) return NextResponse.json({ error: 'trainer_id required' }, { status: 400 });

  const db = getServiceClient();
  const { data } = await db
    .from('trainer_profile_shares')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  return NextResponse.json({ shares: data ?? [] });
}

/** POST /api/academy/trainer-shares  — create a new share link */
export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDirector(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.trainer_id) return NextResponse.json({ error: 'trainer_id required' }, { status: 400 });
  if (!body.expires_at) return NextResponse.json({ error: 'expires_at required' }, { status: 400 });

  // Validate expiry is in the future
  const expiresAt = new Date(body.expires_at);
  if (expiresAt <= new Date()) {
    return NextResponse.json({ error: 'Expiry must be in the future' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('trainer_profile_shares')
    .insert({
      trainer_id:       body.trainer_id,
      created_by:       actor.id,
      expires_at:       expiresAt.toISOString(),
      recipient_name:   body.recipient_name ?? null,
      recipient_email:  body.recipient_email ?? null,
      note_to_recipient: body.note_to_recipient ?? null,
    })
    .select('token, id, expires_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data.token, id: data.id, expires_at: data.expires_at });
}

/** PATCH /api/academy/trainer-shares  — revoke a share */
export async function PATCH(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDirector(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getServiceClient();
  await db.from('trainer_profile_shares').update({ is_revoked: true }).eq('id', body.id);
  return NextResponse.json({ success: true });
}
