/**
 * GET /api/academy/automation-log
 * Returns automation trigger history from academy_automation_logs (if table exists).
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data, error } = await db
    .from('academy_automation_logs')
    .select('id, learner_name, automation_name, fired_at, status')
    .order('fired_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ log: [] });
  }

  const log = (data ?? []).map(r => ({
    id:         r.id,
    learner:    r.learner_name ?? '—',
    automation: r.automation_name ?? '—',
    firedAt:    r.fired_at ?? '',
    status:     r.status ?? 'Delivered',
  }));

  return NextResponse.json({ log });
}
