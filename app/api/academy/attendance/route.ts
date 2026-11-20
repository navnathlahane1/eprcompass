/**
 * GET /api/academy/attendance?sessionId=...
 * Returns registered participants for a session with attendance status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ participants: [] });

  const db = getServiceClient();

  // Get registrations for this session
  const { data: regRows } = await db
    .from('academy_registrations')
    .select('id, participant_name, organization, status')
    .eq('session_id', sessionId)
    .neq('status', 'cancelled');

  const regs = regRows ?? [];
  const regIds = regs.map(r => r.id);

  // Get existing attendance records
  const { data: attRows } = regIds.length
    ? await db
        .from('academy_attendance')
        .select('registration_id, attended')
        .eq('session_id', sessionId)
        .in('registration_id', regIds)
    : { data: [] };

  const attMap: Record<string, boolean> = {};
  for (const a of attRows ?? []) {
    if (a.registration_id) attMap[a.registration_id] = a.attended ?? false;
  }

  const participants = regs.map(r => ({
    id:      r.id,
    name:    r.participant_name ?? '—',
    org:     r.organization ?? '',
    present: attMap[r.id] ?? false,
  }));

  return NextResponse.json({ participants });
}
