/**
 * GET /api/academy/enrollments
 * Returns registration/enrollment records from academy_registrations + payment data.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: regRows }, { data: payRows }] = await Promise.all([
    db.from('academy_registrations')
      .select('id, program_id, session_id, participant_name, participant_email, participant_phone, organization, status, registered_at, notes')
      .order('registered_at', { ascending: false })
      .limit(200),
    db.from('academy_payments')
      .select('registration_id, status, total_inr, partner_code, program_title')
      .eq('status', 'paid')
      .limit(200),
  ]);

  const regs = regRows ?? [];
  const progIds = [...new Set(regs.map(r => r.program_id).filter(Boolean))] as string[];

  const { data: progs } = progIds.length
    ? await db.from('academy_programs').select('id, title').in('id', progIds)
    : { data: [] };

  const progMap: Record<string, string> = {};
  for (const p of progs ?? []) progMap[p.id] = p.title ?? '—';

  const payMap: Record<string, { status: string; partner_code: string | null }> = {};
  for (const pay of payRows ?? []) {
    if (pay.registration_id) payMap[pay.registration_id] = {
      status: pay.status,
      partner_code: pay.partner_code ?? null,
    };
  }

  const thisMonth = regs.filter(r => r.registered_at && r.registered_at >= monthStart);

  const enrollments = regs.map(r => {
    const pay = payMap[r.id];
    return {
      id:       r.id,
      name:     r.participant_name ?? '—',
      email:    r.participant_email ?? '',
      program:  progMap[r.program_id] ?? '—',
      payment:  pay ? 'Paid' : (r.status === 'confirmed' ? 'Paid' : 'Pending'),
      source:   pay?.partner_code ? 'Partner Referral' : 'Organic',
      partner:  pay?.partner_code ?? undefined,
      date:     r.registered_at?.slice(0, 10) ?? '',
      status:   r.status === 'confirmed' ? 'Confirmed'
                : r.status === 'cancelled' ? 'Rejected'
                : r.status === 'completed' ? 'Confirmed'
                : 'Pending Confirmation',
    };
  });

  const pending    = enrollments.filter(e => e.status === 'Pending Confirmation').length;
  const paidNotStarted = enrollments.filter(e => e.payment === 'Paid' && e.status === 'Confirmed').length;

  return NextResponse.json({
    enrollments,
    waitlisted: [],
    kpis: {
      pending,
      paidNotStarted,
      waitlisted: 0,
      thisMonth: thisMonth.length,
    },
  });
}
