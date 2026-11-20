/**
 * GET /api/academy/dashboard
 * Returns role-specific KPIs and lists computed from the database.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date().toISOString();
  const role = actor.role;

  // ── Helpers ──────────────────────────────────────────────────────────────
  async function trainerNames(ids: string[]): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const { data } = await db.from('profiles').select('id, full_name').in('id', ids);
    const m: Record<string, string> = {};
    for (const p of data ?? []) m[p.id] = p.full_name ?? '—';
    return m;
  }

  async function programTitles(ids: string[]): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const { data } = await db.from('academy_programs').select('id, title').in('id', ids);
    const m: Record<string, string> = {};
    for (const p of data ?? []) m[p.id] = p.title ?? '—';
    return m;
  }

  function countByStatus(rows: { status: string }[], statuses: string[]) {
    return rows.filter(r => statuses.includes(r.status)).length;
  }

  function mapSession(s: any, tnMap: Record<string, string>, ptMap?: Record<string, string>) {
    return {
      id: s.id,
      title: s.title ?? '',
      program_type: s.program?.program_type ?? s.program_type ?? '',
      delivery_mode: s.program?.delivery_mode ?? s.delivery_mode ?? '',
      scheduled_date: s.scheduled_date ?? '',
      registered_count: s.registered_count ?? s.program?.registered_count ?? 0,
      capacity: s.seats_total ?? s.capacity ?? s.program?.capacity ?? 0,
      trainer_name: tnMap[s.trainer_id] ?? '—',
      program_title: ptMap ? (ptMap[s.program_id] ?? s.program?.title ?? '—') : (s.program?.title ?? '—'),
    };
  }

  // ── Director / Admin ──────────────────────────────────────────────────────
  if (role === 'academy_director' || role === 'admin') {
    const [
      { data: programs },
      { data: sessionRows },
      { data: paymentRows },
      { count: certsIssued },
      { count: certsPending },
      { count: totalRegs },
      { count: attendedRegs },
    ] = await Promise.all([
      db.from('academy_programs').select('id, status, waste_category, capacity, fee, is_free, program_type'),
      db.from('academy_sessions')
        .select('id, title, scheduled_date, trainer_id, program_id, seats_total, registered_count, program_type, delivery_mode')
        .gte('scheduled_date', now)
        .order('scheduled_date')
        .limit(5),
      db.from('academy_payments')
        .select('id, participant_name, program_title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5),
      db.from('academy_certificates').select('*', { count: 'exact', head: true }).not('issued_at', 'is', null),
      db.from('academy_certificates').select('*', { count: 'exact', head: true }).is('issued_at', null),
      db.from('academy_registrations').select('*', { count: 'exact', head: true }),
      db.from('academy_registrations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    ]);

    const progs = programs ?? [];
    const tnMap = await trainerNames([...new Set((sessionRows ?? []).filter(s => s.trainer_id).map(s => s.trainer_id as string))]);

    // Revenue from paid payments
    const { data: revenueRows } = await db
      .from('academy_payments')
      .select('total_inr, program_title')
      .eq('status', 'paid');

    const totalRevenue = (revenueRows ?? []).reduce((sum, r) => sum + (Number(r.total_inr) || 0), 0);

    // Compliance by waste category
    const catMap: Record<string, { programs: number; participants: number; last_date: string }> = {};
    for (const p of progs) {
      const cat = (p.waste_category as string) || 'Other';
      if (!catMap[cat]) catMap[cat] = { programs: 0, participants: 0, last_date: '' };
      catMap[cat].programs++;
      catMap[cat].participants += Number(p.capacity) || 0;
    }
    const complianceActivities = Object.entries(catMap)
      .map(([waste_category, v]) => ({ waste_category, ...v }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 5);

    const attendanceRate = totalRegs ? Math.round(((attendedRegs ?? 0) / totalRegs) * 100) : 0;

    return NextResponse.json({
      kpis: {
        totalPrograms:      progs.length,
        upcomingPrograms:   countByStatus(progs, ['Registration', 'Scheduling']),
        ongoingPrograms:    countByStatus(progs, ['Delivery', 'Assessment']),
        completedPrograms:  countByStatus(progs, ['Closure', 'Certification']),
        cancelledPrograms:  countByStatus(progs, ['Cancelled']),
        totalParticipants:  totalRegs ?? 0,
        activeParticipants: attendedRegs ?? 0,
        attendanceRate,
        completionRate:     0,
        certificatesIssued: certsIssued ?? 0,
        certificatesPending:certsPending ?? 0,
        awarenessprogramsConducted: countByStatus(progs, ['Closure', 'Certification', 'Delivery', 'Assessment']),
        stakeholdersReached:totalRegs ?? 0,
        employeesTrained:   0,
        customersTrained:   0,
        institutionsCovered:0,
        trainingRevenue:    totalRevenue,
        corporateRevenue:   0,
        certificationRevenue: 0,
        eventRevenue:       0,
      },
      upcomingSessions: (sessionRows ?? []).map(s => mapSession(s, tnMap)),
      recentRegistrations: (paymentRows ?? []).map(r => ({
        id: r.id,
        participant_name: r.participant_name ?? '—',
        program_title:    r.program_title ?? '—',
        registered_at:    r.created_at,
        status:           r.status === 'paid' ? 'confirmed' : 'pending',
      })),
      complianceActivities,
    });
  }

  // ── Academy Manager ────────────────────────────────────────────────────────
  if (role === 'academy_manager') {
    const { data: myProgramIds } = await db
      .from('academy_programs')
      .select('id')
      .eq('academy_manager_id', actor.id);

    const ids = (myProgramIds ?? []).map(p => p.id);

    const [
      { data: programs },
      { data: sessionRows },
      { count: totalRegs },
      { count: pendingRegs },
      { count: certsIssued },
      { count: certsPending },
    ] = await Promise.all([
      db.from('academy_programs').select('id, status, waste_category, capacity').eq('academy_manager_id', actor.id),
      ids.length
        ? db.from('academy_sessions')
            .select('id, title, scheduled_date, trainer_id, program_id, seats_total, registered_count, program_type, delivery_mode')
            .in('program_id', ids)
            .gte('scheduled_date', now)
            .order('scheduled_date')
            .limit(5)
        : { data: [] },
      db.from('academy_registrations').select('*', { count: 'exact', head: true }),
      db.from('academy_registrations').select('*', { count: 'exact', head: true }).not('status', 'eq', 'confirmed'),
      db.from('academy_certificates').select('*', { count: 'exact', head: true }).not('issued_at', 'is', null),
      db.from('academy_certificates').select('*', { count: 'exact', head: true }).is('issued_at', null),
    ]);

    const progs = programs ?? [];
    const tnMap = await trainerNames([...new Set((sessionRows ?? []).filter(s => s.trainer_id).map(s => s.trainer_id as string))]);

    // Pending approvals from payments
    const { data: pendingPayments } = await db
      .from('academy_payments')
      .select('id, participant_name, program_title, created_at')
      .not('status', 'eq', 'paid')
      .order('created_at', { ascending: false })
      .limit(5);

    const catMap: Record<string, { programs: number; participants: number }> = {};
    for (const p of progs) {
      const cat = (p.waste_category as string) || 'Other';
      if (!catMap[cat]) catMap[cat] = { programs: 0, participants: 0 };
      catMap[cat].programs++;
      catMap[cat].participants += Number(p.capacity) || 0;
    }

    return NextResponse.json({
      kpis: {
        totalPrograms:          progs.length,
        upcomingPrograms:       countByStatus(progs, ['Registration', 'Scheduling']),
        ongoingPrograms:        countByStatus(progs, ['Delivery', 'Assessment']),
        completedPrograms:      countByStatus(progs, ['Closure', 'Certification']),
        totalRegistrations:     totalRegs ?? 0,
        pendingRegistrations:   pendingRegs ?? 0,
        attendanceRate:         0,
        completionRate:         0,
        certificatesPending:    certsPending ?? 0,
        certificatesIssued:     certsIssued ?? 0,
        awarenessprogramsConducted: countByStatus(progs, ['Delivery', 'Assessment', 'Closure', 'Certification']),
        stakeholdersReached:    totalRegs ?? 0,
        complianceCoverage:     0,
      },
      upcomingSessions:  (sessionRows ?? []).map(s => mapSession(s, tnMap)),
      pendingRegistrations: (pendingPayments ?? []).map(r => ({
        id: r.id,
        participant_name: r.participant_name ?? '—',
        program_title:    r.program_title ?? '—',
        registered_at:    r.created_at,
      })),
      complianceItems: Object.entries(catMap).map(([waste_category, v]) => ({ waste_category, ...v })).sort((a, b) => b.participants - a.participants).slice(0, 5),
    });
  }

  // ── Trainer ────────────────────────────────────────────────────────────────
  if (role === 'trainer') {
    const { data: sessionRows } = await db
      .from('academy_sessions')
      .select('id, title, program_id, scheduled_date, seats_total, registered_count, program_type, delivery_mode, attendance_marked')
      .eq('trainer_id', actor.id)
      .order('scheduled_date');

    const sessions = sessionRows ?? [];
    const ptMap = await programTitles([...new Set(sessions.map(s => s.program_id).filter(Boolean) as string[])]);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const withStatus = sessions.map(s => ({
      ...s,
      isUpcoming: s.scheduled_date >= now,
    }));

    return NextResponse.json({
      kpis: {
        upcomingSessions:   withStatus.filter(s => s.isUpcoming).length,
        completedSessions:  withStatus.filter(s => !s.isUpcoming).length,
        totalParticipants:  sessions.reduce((sum, s) => sum + (Number(s.registered_count) || 0), 0),
        avgAttendanceRate:  0,
        attendancePending:  withStatus.filter(s => !s.isUpcoming && !s.attendance_marked).length,
        thisMonthSessions:  sessions.filter(s => s.scheduled_date >= startOfMonth).length,
      },
      sessions: withStatus.map(s => ({
        id:               s.id,
        title:            s.title ?? '',
        program_title:    ptMap[s.program_id] ?? '—',
        program_type:     s.program_type ?? '',
        delivery_mode:    s.delivery_mode ?? '',
        scheduled_date:   s.scheduled_date ?? '',
        registered_count: Number(s.registered_count) || 0,
        capacity:         Number(s.seats_total) || 0,
        status:           s.isUpcoming ? 'upcoming' : 'completed',
        attendance_marked:s.attendance_marked ?? false,
      })),
    });
  }

  // ── Training Program Manager ───────────────────────────────────────────────
  if (role === 'training_program_manager') {
    const { data: myPrograms } = await db
      .from('academy_programs')
      .select('id, title, status, program_type, capacity, registered_count')
      .eq('program_manager_id', actor.id);

    const progIds = (myPrograms ?? []).map(p => p.id);

    const [{ data: sessionRows }, { count: certsPending }] = await Promise.all([
      progIds.length
        ? db.from('academy_sessions')
            .select('id, title, program_id, delivery_mode, scheduled_date, seats_total, registered_count, attendance_marked')
            .in('program_id', progIds)
            .order('scheduled_date')
        : { data: [] },
      db.from('academy_certificates').select('*', { count: 'exact', head: true }).is('issued_at', null),
    ]);

    const progs  = myPrograms ?? [];
    const sesss  = sessionRows ?? [];

    const sessCountMap: Record<string, { total: number; done: number }> = {};
    for (const s of sesss) {
      if (!sessCountMap[s.program_id]) sessCountMap[s.program_id] = { total: 0, done: 0 };
      sessCountMap[s.program_id].total++;
      if (s.scheduled_date < now) sessCountMap[s.program_id].done++;
    }

    const upcomingSessions = sesss.filter(s => s.scheduled_date >= now).slice(0, 5);
    const ptMap: Record<string, string> = {};
    for (const p of progs) ptMap[p.id] = p.title ?? '—';

    return NextResponse.json({
      kpis: {
        myPrograms:           progs.length,
        upcomingPrograms:     countByStatus(progs, ['Registration', 'Scheduling']),
        ongoingPrograms:      countByStatus(progs, ['Delivery', 'Assessment']),
        completedPrograms:    countByStatus(progs, ['Closure', 'Certification']),
        totalSessions:        sesss.length,
        upcomingSessions:     sesss.filter(s => s.scheduled_date >= now).length,
        totalRegistrations:   progs.reduce((sum, p) => sum + (Number(p.registered_count) || 0), 0),
        attendanceRate:       0,
        completionRate:       0,
        certificatesPending:  certsPending ?? 0,
        evidenceSubmissions:  0,
      },
      mySessions: upcomingSessions.map(s => ({
        id:               s.id,
        title:            s.title ?? '',
        program_title:    ptMap[s.program_id] ?? '—',
        delivery_mode:    s.delivery_mode ?? '',
        scheduled_date:   s.scheduled_date ?? '',
        registered_count: Number(s.registered_count) || 0,
        capacity:         Number(s.seats_total) || 0,
        attendance_marked:s.attendance_marked ?? false,
      })),
      myPrograms: progs.map(p => ({
        id:             p.id,
        title:          p.title ?? '',
        program_type:   p.program_type ?? '',
        status:         (['Delivery','Assessment'].includes(p.status) ? 'ongoing'
                        : ['Closure','Certification'].includes(p.status) ? 'completed'
                        : 'upcoming') as 'upcoming' | 'ongoing' | 'completed',
        sessions_total: sessCountMap[p.id]?.total ?? 0,
        sessions_done:  sessCountMap[p.id]?.done ?? 0,
        registrations:  Number(p.registered_count) || 0,
      })),
    });
  }

  // ── Guest Trainer ──────────────────────────────────────────────────────────
  if (role === 'guest_trainer') {
    const { data: sessionRows } = await db
      .from('academy_sessions')
      .select('id, title, program_id, program_type, delivery_mode, scheduled_date, registered_count, venue, coordinator_id')
      .eq('trainer_id', actor.id)
      .order('scheduled_date');

    const sessions = sessionRows ?? [];
    const coordIds = [...new Set(sessions.map(s => s.coordinator_id).filter(Boolean) as string[])];
    const ptMap    = await programTitles([...new Set(sessions.map(s => s.program_id).filter(Boolean) as string[])]);

    let coordMap: Record<string, { name: string; email: string }> = {};
    if (coordIds.length) {
      const [{ data: coordProfs }, { data: authUsers }] = await Promise.all([
        db.from('profiles').select('id, full_name').in('id', coordIds),
        db.auth.admin.listUsers({ page: 1, perPage: 500 }),
      ]);
      const emailMap: Record<string, string> = {};
      for (const u of authUsers?.users ?? []) if (coordIds.includes(u.id)) emailMap[u.id] = u.email ?? '';
      for (const c of coordProfs ?? []) coordMap[c.id] = { name: c.full_name ?? '—', email: emailMap[c.id] ?? '' };
    }

    const mapped = sessions.map(s => ({
      id:                s.id,
      title:             s.title ?? '',
      program_title:     ptMap[s.program_id] ?? '—',
      program_type:      s.program_type ?? '',
      delivery_mode:     s.delivery_mode ?? '',
      scheduled_date:    s.scheduled_date ?? '',
      registered_count:  Number(s.registered_count) || 0,
      venue:             s.venue ?? null,
      coordinator_name:  coordMap[s.coordinator_id]?.name ?? '—',
      coordinator_email: coordMap[s.coordinator_id]?.email ?? '',
      status:            (s.scheduled_date >= now ? 'upcoming' : 'completed') as 'upcoming' | 'completed',
    }));

    return NextResponse.json({
      totalSessions:     sessions.length,
      upcomingSessions:  mapped.filter(s => s.status === 'upcoming').length,
      completedSessions: mapped.filter(s => s.status === 'completed').length,
      sessions:          mapped,
    });
  }

  return NextResponse.json({ error: 'Role not handled' }, { status: 403 });
}
