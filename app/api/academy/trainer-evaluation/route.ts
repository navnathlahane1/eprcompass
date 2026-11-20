import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const TRAINER_ROLES = ['trainer', 'guest_trainer', 'partner_trainer'] as const;

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data } = await db
    .from('trainer_evaluations')
    .select('id, status, submitted_at')
    .eq('trainer_id', actor.id)
    .maybeSingle();

  return NextResponse.json({ evaluation: data ?? null });
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!TRAINER_ROLES.includes(actor.role as (typeof TRAINER_ROLES)[number])) {
    return NextResponse.json({ error: 'Only trainer accounts can submit this form' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const required = [
    'years_experience', 'domain_expertise', 'highest_qualification',
    'epr_familiarity', 'preferred_delivery', 'avg_batch_size',
    'motivation', 'availability_hours_pw',
  ];
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
  }

  const db = getServiceClient();

  // Upsert so re-submissions before approval just update the record
  const { error } = await db.from('trainer_evaluations').upsert({
    trainer_id:             actor.id,
    years_experience:       body.years_experience,
    domain_expertise:       body.domain_expertise,
    highest_qualification:  body.highest_qualification,
    current_organisation:   body.current_organisation ?? null,
    epr_familiarity:        body.epr_familiarity,
    regulations_known:      body.regulations_known ?? [],
    delivered_epr_training: body.delivered_epr_training ?? false,
    preferred_delivery:     body.preferred_delivery,
    avg_batch_size:         body.avg_batch_size,
    tools_used:             body.tools_used ?? [],
    motivation:             body.motivation,
    availability_hours_pw:  body.availability_hours_pw,
    has_own_content:        body.has_own_content ?? false,
    status:                 'pending',
    submitted_at:           new Date().toISOString(),
  }, { onConflict: 'trainer_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
