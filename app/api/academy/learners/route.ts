/**
 * GET /api/academy/learners
 * Returns learner list from academy_registrations.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data: regRows } = await db
    .from('academy_registrations')
    .select('id, program_id, participant_name, participant_email, participant_phone, organization, status, registered_at')
    .neq('status', 'cancelled')
    .order('registered_at', { ascending: false })
    .limit(300);

  const regs = regRows ?? [];
  const progIds = [...new Set(regs.map(r => r.program_id).filter(Boolean))] as string[];

  const { data: progs } = progIds.length
    ? await db.from('academy_programs').select('id, title, program_type').in('id', progIds)
    : { data: [] };

  const progMap: Record<string, { title: string; type: string }> = {};
  for (const p of progs ?? []) progMap[p.id] = { title: p.title ?? '—', type: p.program_type ?? '' };

  // Group by email — a learner may be in multiple programs
  const byEmail: Record<string, {
    id: string; name: string; email: string; phone: string;
    programs: string[]; tier: string; enrolledDate: string;
    status: 'Active' | 'Completed' | 'Dropped';
    certStatus: 'Earned' | 'In Progress' | 'Not Started';
    cohort: string; upsellEligible: boolean; progress: number;
  }> = {};

  for (const r of regs) {
    const key = r.participant_email ?? r.id;
    const prog = progMap[r.program_id];
    if (!byEmail[key]) {
      byEmail[key] = {
        id:             r.id,
        name:           r.participant_name ?? '—',
        email:          r.participant_email ?? '',
        phone:          r.participant_phone ?? '',
        programs:       [],
        tier:           prog?.type?.includes('Tier 1') ? 'Tier 1' : prog?.type?.includes('Tier 2') ? 'Tier 2' : prog?.type?.includes('Tier 3') ? 'Tier 3' : 'Tier 1',
        enrolledDate:   r.registered_at?.slice(0, 10) ?? '',
        status:         r.status === 'completed' ? 'Completed' : r.status === 'cancelled' ? 'Dropped' : 'Active',
        certStatus:     r.status === 'completed' ? 'Earned' : r.status === 'confirmed' ? 'In Progress' : 'Not Started',
        cohort:         r.registered_at?.slice(0, 7) ?? '',
        upsellEligible: r.status === 'completed',
        progress:       r.status === 'completed' ? 100 : r.status === 'confirmed' ? 50 : 0,
      };
    }
    if (prog?.title) byEmail[key].programs.push(prog.title);
  }

  return NextResponse.json({ learners: Object.values(byEmail) });
}
