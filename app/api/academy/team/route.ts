/**
 * GET /api/academy/team
 * Returns the academy team visible to the requesting user.
 *
 * Director / Admin  → full team (all academy roles)
 * Academy Manager   → program managers + trainers
 * Program Manager   → trainers assigned to their sessions
 * Trainer           → their coordinator (program_manager) + manager
 * Guest Trainer     → their assigned sessions with coordinator info
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  // Fetch auth emails in bulk
  async function getEmails(ids: string[]): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 500 });
    const map: Record<string, string> = {};
    for (const u of data?.users ?? []) {
      if (ids.includes(u.id)) map[u.id] = u.email ?? '';
    }
    return map;
  }

  async function profilesByRole(roles: string[]) {
    const { data } = await db
      .from('profiles')
      .select('id, full_name, role, company_name, created_at')
      .in('role', roles)
      .eq('is_banned', false)
      .order('full_name');
    return data ?? [];
  }

  // ── Director / Admin: full team ─────────────────────────────────────────────
  if (actor.role === 'academy_director' || actor.role === 'admin') {
    const members = await profilesByRole([
      'academy_manager', 'training_program_manager', 'trainer', 'guest_trainer',
    ]);
    const emails = await getEmails(members.map(m => m.id));

    // Enrich with quick stats per member
    const enriched = await Promise.all(members.map(async m => {
      let stats: Record<string, number> = {};

      if (m.role === 'academy_manager') {
        const { count } = await db
          .from('academy_programs')
          .select('*', { count: 'exact', head: true })
          .eq('academy_manager_id', m.id);
        stats.programs_managed = count ?? 0;
      }

      if (m.role === 'training_program_manager') {
        const { count } = await db
          .from('academy_programs')
          .select('*', { count: 'exact', head: true })
          .eq('program_manager_id', m.id);
        stats.programs_managed = count ?? 0;
      }

      if (m.role === 'trainer' || m.role === 'guest_trainer') {
        const { count } = await db
          .from('academy_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', m.id);
        stats.sessions_total = count ?? 0;

        const { count: upcoming } = await db
          .from('academy_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', m.id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', new Date().toISOString());
        stats.sessions_upcoming = upcoming ?? 0;

        // avg feedback
        const { data: fb } = await db
          .from('academy_session_feedback')
          .select('overall_rating')
          .eq('trainer_id', m.id);
        if (fb && fb.length) {
          stats.avg_feedback = Math.round(
            (fb.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / fb.length) * 10
          ) / 10;
        }
      }

      // Latest performance review score
      const { data: latestReview } = await db
        .from('academy_performance_reviews')
        .select('score_overall, review_period, status')
        .eq('reviewee_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: m.id,
        full_name: m.full_name,
        email: emails[m.id] ?? null,
        role: m.role,
        joined_at: m.created_at,
        stats,
        latest_review: latestReview ?? null,
      };
    }));

    return NextResponse.json({ team: enriched, role: actor.role });
  }

  // ── Academy Manager: program managers + trainers ────────────────────────────
  if (actor.role === 'academy_manager') {
    // Program managers assigned to their programs
    const { data: myPrograms } = await db
      .from('academy_programs')
      .select('program_manager_id')
      .eq('academy_manager_id', actor.id)
      .not('program_manager_id', 'is', null);

    const pmIds = [...new Set((myPrograms ?? []).map(p => p.program_manager_id))] as string[];

    // Trainers assigned to sessions under their programs
    const { data: mySessions } = await db
      .from('academy_sessions')
      .select('trainer_id, program_id')
      .in('program_id', (myPrograms ?? []).map(p => p.program_manager_id)); // will refine below

    // Simpler: fetch trainers directly via assignments on their sessions
    const programIds = (await db
      .from('academy_programs')
      .select('id')
      .eq('academy_manager_id', actor.id)).data?.map(p => p.id) ?? [];

    const sessionRows = programIds.length
      ? (await db.from('academy_sessions').select('id, trainer_id').in('program_id', programIds)).data ?? []
      : [];

    const trainerIds = [...new Set(
      sessionRows.filter(s => s.trainer_id).map(s => s.trainer_id as string)
    )];

    const allIds = [...new Set([...pmIds, ...trainerIds])];
    if (!allIds.length) return NextResponse.json({ team: [], role: actor.role });

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, role')
      .in('id', allIds);

    const emails = await getEmails(allIds);

    return NextResponse.json({
      role: actor.role,
      team: (profiles ?? []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: emails[p.id] ?? null,
        role: p.role,
      })),
    });
  }

  // ── Program Manager: trainers assigned to their sessions ────────────────────
  if (actor.role === 'training_program_manager') {
    const { data: mySessions } = await db
      .from('academy_sessions')
      .select('id, trainer_id, title, scheduled_date, status')
      .in('program_id',
        ((await db.from('academy_programs').select('id').eq('program_manager_id', actor.id)).data ?? []).map(p => p.id)
      );

    const trainerIds = [...new Set(
      (mySessions ?? []).filter(s => s.trainer_id).map(s => s.trainer_id as string)
    )];

    if (!trainerIds.length) return NextResponse.json({ team: [], role: actor.role });

    const { data: profiles } = await db
      .from('profiles').select('id, full_name, role').in('id', trainerIds);
    const emails = await getEmails(trainerIds);

    return NextResponse.json({
      role: actor.role,
      team: (profiles ?? []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: emails[p.id] ?? null,
        role: p.role,
        sessions: (mySessions ?? []).filter(s => s.trainer_id === p.id),
      })),
    });
  }

  // ── Trainer / Guest Trainer: my coordinator ─────────────────────────────────
  if (actor.role === 'trainer' || actor.role === 'guest_trainer') {
    const { data: mySessions } = await db
      .from('academy_sessions')
      .select('id, title, scheduled_date, status, program_id')
      .eq('trainer_id', actor.id)
      .order('scheduled_date');

    const programIds = [...new Set((mySessions ?? []).map(s => s.program_id).filter(Boolean) as string[])];

    const coordinators: any[] = [];
    if (programIds.length) {
      const { data: programs } = await db
        .from('academy_programs')
        .select('id, title, program_manager_id, academy_manager_id')
        .in('id', programIds);

      const coordIds = [...new Set([
        ...((programs ?? []).map(p => p.program_manager_id).filter(Boolean) as string[]),
        ...((programs ?? []).map(p => p.academy_manager_id).filter(Boolean) as string[]),
      ])];

      if (coordIds.length) {
        const { data: coordProfiles } = await db
          .from('profiles').select('id, full_name, role').in('id', coordIds);
        const emails = await getEmails(coordIds);
        for (const cp of coordProfiles ?? []) {
          coordinators.push({
            id: cp.id,
            full_name: cp.full_name,
            email: emails[cp.id] ?? null,
            role: cp.role,
          });
        }
      }
    }

    return NextResponse.json({ role: actor.role, coordinators, my_sessions: mySessions ?? [] });
  }

  return NextResponse.json({ team: [], role: actor.role });
}
