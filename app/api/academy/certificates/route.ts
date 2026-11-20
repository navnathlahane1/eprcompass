/**
 * GET /api/academy/certificates
 * Returns issued certificates from older registrations system + CEPC consultants.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // ── Older training system certificates ───────────────────────────────────────
  const { data: regRows } = await db
    .from('registrations')
    .select('id, name, email, certificate_url, registered_at, session_id')
    .eq('certificate_issued', true)
    .order('registered_at', { ascending: false })
    .limit(200) as any;

  // Get session → program mapping
  const sessionIds = [...new Set((regRows ?? []).map((r: any) => r.session_id).filter(Boolean))] as string[];
  const { data: sessionRows } = sessionIds.length
    ? await db.from('training_sessions').select('id, program_id').in('id', sessionIds) as any
    : { data: [] };

  const sessionProgMap: Record<string, string> = {};
  for (const s of sessionRows ?? []) sessionProgMap[s.id] = s.program_id;

  const programIds = [...new Set(Object.values(sessionProgMap))] as string[];
  const { data: programRows } = programIds.length
    ? await db.from('training_programs').select('id, title, tier').in('id', programIds) as any
    : { data: [] };

  const programMap: Record<string, { title: string; tier: string }> = {};
  for (const p of programRows ?? []) programMap[p.id] = { title: p.title ?? '—', tier: p.tier ?? '' };

  const attendanceCerts = (regRows ?? []).map((r: any) => {
    const progId = sessionProgMap[r.session_id];
    const prog = progId ? programMap[progId] : null;
    return {
      id:       r.id,
      learner:  r.name ?? '—',
      email:    r.email ?? '',
      program:  prog?.title ?? '—',
      tier:     prog?.tier ?? 'Tier 1',
      type:     'Attendance',
      issued:   r.registered_at?.slice(0, 10) ?? '',
      expires:  '',
      url:      r.certificate_url ?? null,
    };
  });

  // ── CEPC / EALP certifications ────────────────────────────────────────────────
  const { data: cepcRows } = await db
    .from('cepc_consultants')
    .select('id, full_name, email, certification_tier, cert_no, certification_date, certification_expiry, status')
    .in('status', ['Certified', 'Active'])
    .order('certification_date', { ascending: false })
    .limit(200) as any;

  const cepcCerts = (cepcRows ?? []).map((c: any) => ({
    id:       c.id,
    learner:  c.full_name ?? '—',
    email:    c.email ?? '',
    program:  c.certification_tier === 'CEPC' ? 'CEPC — Certified EPR Consultant'
              : c.certification_tier === 'EALP' ? 'EALP — EPR Agency Launch Program'
              : 'Training Bootcamp',
    tier:     c.certification_tier === 'CEPC' ? 'Tier 2'
              : c.certification_tier === 'EALP' ? 'Tier 3'
              : 'Tier 1',
    type:     c.certification_tier === 'EALP' ? 'EALP' : (c.certification_tier === 'CEPC' ? 'CEPC' : 'Attendance'),
    issued:   c.certification_date ?? '',
    expires:  c.certification_expiry ?? '',
    url:      null,
  }));

  const certs = [...cepcCerts, ...attendanceCerts];

  const issuedThisMonth = certs.filter(c => c.issued >= monthStart.slice(0, 10)).length;
  const byType = (type: string) => certs.filter(c => c.type === type).length;

  return NextResponse.json({
    certs,
    kpis: {
      total:         certs.length,
      thisMonth:     issuedThisMonth,
      t3Trainer:     byType('T3 Trainer'),
      cepc:          byType('CEPC'),
      ealp:          byType('EALP'),
      attendance:    byType('Attendance'),
    },
  });
}
