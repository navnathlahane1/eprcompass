/**
 * GET /api/academy/sessions
 * Returns academy sessions with trainer name and program title.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data: sessions, error } = await db
    .from('academy_sessions')
    .select('id, title, scheduled_date, delivery_mode, meeting_link, venue, status, trainer_id, program_id, capacity, attendance_marked')
    .order('scheduled_date', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ sessions: [] });

  const rows = sessions ?? [];

  // Collect unique IDs
  const trainerIds = [...new Set(rows.map(s => s.trainer_id).filter(Boolean))] as string[];
  const programIds = [...new Set(rows.map(s => s.program_id).filter(Boolean))] as string[];

  const [{ data: trainers }, { data: programs }] = await Promise.all([
    trainerIds.length
      ? db.from('profiles').select('id, full_name').in('id', trainerIds)
      : { data: [] },
    programIds.length
      ? db.from('academy_programs').select('id, title, program_type').in('id', programIds)
      : { data: [] },
  ]);

  const trainerMap: Record<string, string> = {};
  for (const t of trainers ?? []) trainerMap[t.id] = t.full_name ?? '—';

  const programMap: Record<string, { title: string; program_type: string }> = {};
  for (const p of programs ?? []) programMap[p.id] = { title: p.title ?? '—', program_type: p.program_type ?? '' };

  // Count registered participants per session from academy_registrations
  const sessionIds = rows.map(s => s.id);
  const { data: regCounts } = sessionIds.length
    ? await db
        .from('academy_registrations')
        .select('session_id')
        .in('session_id', sessionIds)
        .neq('status', 'cancelled')
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const r of regCounts ?? []) {
    if (r.session_id) countMap[r.session_id] = (countMap[r.session_id] ?? 0) + 1;
  }

  const mapped = rows.map(s => {
    const prog = programMap[s.program_id] ?? { title: s.title ?? '—', program_type: '' };
    const dt = s.scheduled_date ? new Date(s.scheduled_date) : null;
    return {
      id:         s.id,
      program:    prog.title,
      program_type: prog.program_type,
      date:       dt ? dt.toISOString().slice(0, 10) : '',
      time:       dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '',
      trainer:    trainerMap[s.trainer_id] ?? '—',
      mode:       s.delivery_mode ?? '',
      platform:   s.delivery_mode?.includes('Online') ? 'Zoom' : (s.delivery_mode ?? ''),
      registered: countMap[s.id] ?? 0,
      capacity:   Number(s.capacity) || 0,
      status:     s.status ?? 'scheduled',
      link:       s.meeting_link ?? '',
      venue:      s.venue ?? '',
      attendance_marked: s.attendance_marked ?? false,
    };
  });

  return NextResponse.json({ sessions: mapped });
}
