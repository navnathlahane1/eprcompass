/**
 * GET /api/academy/trainers
 * Returns all users with trainer roles plus stats.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const ROLE_TO_TYPE: Record<string, string> = {
  trainer:         'Internal',
  guest_trainer:   'Guest',
  partner_trainer: 'Partner Trainer',
};

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data: profileRows } = await db
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['trainer', 'guest_trainer', 'partner_trainer']);

  const profiles = profileRows ?? [];
  const ids = profiles.map(p => p.id);

  if (!ids.length) return NextResponse.json({ trainers: [] });

  const [{ data: sessionRows }, { data: feedbackRows }, { data: tpRows }] = await Promise.all([
    db.from('academy_sessions')
      .select('trainer_id, id')
      .in('trainer_id', ids),
    db.from('academy_session_feedback')
      .select('trainer_id, overall_rating')
      .in('trainer_id', ids),
    db.from('trainer_profiles')
      .select('user_id, profile_photo_url, headline, resume_url, profile_status')
      .in('user_id', ids),
  ]);

  const sessionCountMap: Record<string, number> = {};
  for (const s of sessionRows ?? []) {
    if (s.trainer_id) sessionCountMap[s.trainer_id] = (sessionCountMap[s.trainer_id] ?? 0) + 1;
  }

  const ratingMap: Record<string, { sum: number; count: number }> = {};
  for (const f of feedbackRows ?? []) {
    if (!f.trainer_id || !f.overall_rating) continue;
    if (!ratingMap[f.trainer_id]) ratingMap[f.trainer_id] = { sum: 0, count: 0 };
    ratingMap[f.trainer_id].sum += Number(f.overall_rating);
    ratingMap[f.trainer_id].count++;
  }

  const tpMap: Record<string, { photoUrl: string | null; headline: string | null; resumeUrl: string | null; profileStatus: string }> = {};
  for (const tp of tpRows ?? []) {
    tpMap[tp.user_id] = {
      photoUrl:      tp.profile_photo_url ?? null,
      headline:      tp.headline ?? null,
      resumeUrl:     tp.resume_url ?? null,
      profileStatus: tp.profile_status ?? 'draft',
    };
  }

  const trainers = profiles.map(p => {
    const sessionCount = sessionCountMap[p.id] ?? 0;
    const rb = ratingMap[p.id];
    const rating = rb ? Math.round((rb.sum / rb.count) * 10) / 10 : 0;
    const tp = tpMap[p.id];
    return {
      id:            p.id,
      name:          p.full_name ?? '—',
      email:         p.email ?? '',
      type:          ROLE_TO_TYPE[p.role] ?? 'Internal',
      expertise:     [] as string[],
      rating,
      sessions:      sessionCount,
      participants:  0,
      certifications: [] as string[],
      status:        'Active',
      t3Cert:        null,
      partnerId:     null,
      photoUrl:      tp?.photoUrl ?? null,
      headline:      tp?.headline ?? null,
      resumeUrl:     tp?.resumeUrl ?? null,
      profileStatus: tp?.profileStatus ?? 'draft',
    };
  });

  return NextResponse.json({ trainers });
}
