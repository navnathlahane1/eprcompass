/**
 * GET /api/academy/programs
 * Returns programs from the database.
 * Query params:
 *   public=true  → only status=Registration/Delivery with visibility=Public
 *   limit        → max rows (default 200)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db     = getServiceClient();
  const url    = new URL(req.url);
  const isPublic = url.searchParams.get('public') === 'true';
  const limit  = Math.min(Number(url.searchParams.get('limit') ?? 200), 500);

  let query = db
    .from('academy_programs')
    .select('id, title, program_type, delivery_mode, status, visibility, waste_category, capacity, trainer_name, start_date, fee, is_free, certification_offered, created_at, registered_count')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (isPublic) {
    query = query
      .in('status', ['Registration', 'Delivery', 'Scheduling'])
      .eq('visibility', 'Public');
  }

  const { data: programs, error } = await query;

  if (error) {
    console.error('[academy/programs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch session counts per program
  const progIds = (programs ?? []).map(p => p.id);
  let sessCountMap: Record<string, number> = {};
  if (progIds.length) {
    const { data: sessCounts } = await db
      .from('academy_sessions')
      .select('program_id')
      .in('program_id', progIds);
    for (const s of sessCounts ?? []) {
      sessCountMap[s.program_id] = (sessCountMap[s.program_id] ?? 0) + 1;
    }
  }

  const result = (programs ?? []).map(p => ({
    id:           p.id,
    title:        p.title ?? '',
    program_type: p.program_type ?? '',
    delivery_mode:p.delivery_mode ?? '',
    status:       p.status ?? 'Draft',
    visibility:   p.visibility ?? 'Internal Only',
    waste_category: p.waste_category ?? 'General',
    capacity:     Number(p.capacity) || 0,
    registered:   Number(p.registered_count) || 0,
    trainer:      p.trainer_name ?? '—',
    start_date:   p.start_date ?? '',
    fee:          Number(p.fee) || 0,
    is_free:      p.is_free ?? false,
    certification_offered: p.certification_offered ?? false,
    sessions:     sessCountMap[p.id] ?? 0,
    revenue:      0,
  }));

  return NextResponse.json({ programs: result });
}
