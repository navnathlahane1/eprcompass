import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

const DIRECTOR_ROLES = ['academy_director', 'admin'] as const;

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(DIRECTOR_ROLES as readonly string[]).includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getServiceClient();
  const { data } = await db
    .from('trainer_profiles')
    .select(`*, profiles!user_id(full_name, email)`)
    .eq('profile_status', 'submitted')
    .order('submitted_at', { ascending: true });

  return NextResponse.json({ profiles: data ?? [] });
}
