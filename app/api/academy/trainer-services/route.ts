import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const TRAINER_ROLES = ['trainer', 'guest_trainer', 'partner_trainer'] as const;
const DIRECTOR_ROLES = ['academy_director', 'admin'] as const;

function isTrainer(role: string) { return (TRAINER_ROLES as readonly string[]).includes(role); }
function isDirector(role: string) { return (DIRECTOR_ROLES as readonly string[]).includes(role); }

export async function GET(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { searchParams } = new URL(req.url);

  if (isDirector(actor.role)) {
    // Directors see all pending services (with trainer info)
    const status = searchParams.get('status') ?? 'pending_approval';
    const { data } = await db
      .from('trainer_services')
      .select(`*, profiles!trainer_id(full_name, email)`)
      .eq('status', status)
      .order('submitted_at', { ascending: true });
    return NextResponse.json({ services: data ?? [] });
  }

  // Trainers see their own
  const { data } = await db
    .from('trainer_services')
    .select('*')
    .eq('trainer_id', actor.id)
    .order('created_at', { ascending: false });
  return NextResponse.json({ services: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isTrainer(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const required = ['title', 'category', 'delivery_mode', 'pricing_model'];
  for (const f of required) {
    if (!body[f]) return NextResponse.json({ error: `Missing: ${f}` }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('trainer_services')
    .insert({
      trainer_id:       actor.id,
      title:            body.title,
      category:         body.category,
      description:      body.description ?? null,
      key_topics:       body.key_topics ?? [],
      delivery_mode:    body.delivery_mode,
      duration_hours:   body.duration_hours ?? null,
      max_participants: body.max_participants ?? null,
      language:         body.language ?? 'English',
      pricing_model:    body.pricing_model,
      price_amount:     body.price_amount ?? null,
      price_currency:   body.price_currency ?? 'INR',
      price_notes:      body.price_notes ?? null,
      status:           'draft',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PUT(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = getServiceClient();

  // Director approving / rejecting
  if (isDirector(actor.role) && body.action && body.service_id) {
    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const newStatus = body.action === 'approve' ? 'approved' : 'rejected';

    const { data: svc, error: fetchErr } = await db
      .from('trainer_services')
      .select('*')
      .eq('id', body.service_id)
      .single();
    if (fetchErr || !svc) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const { error: updErr } = await db
      .from('trainer_services')
      .update({
        status:       newStatus,
        reviewed_at:  new Date().toISOString(),
        reviewed_by:  actor.id,
        review_notes: body.review_notes ?? null,
      })
      .eq('id', body.service_id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // On approval, create an offering snapshot
    if (body.action === 'approve') {
      const { data: trainerProfile } = await db
        .from('trainer_profiles')
        .select('headline')
        .eq('user_id', svc.trainer_id)
        .maybeSingle();
      const { data: trainerUser } = await db
        .from('profiles')
        .select('full_name')
        .eq('id', svc.trainer_id)
        .maybeSingle();

      await db.from('trainer_offerings').upsert({
        service_id:       svc.id,
        trainer_id:       svc.trainer_id,
        title:            svc.title,
        category:         svc.category,
        description:      svc.description,
        delivery_mode:    svc.delivery_mode,
        duration_hours:   svc.duration_hours,
        pricing_model:    svc.pricing_model,
        price_amount:     svc.price_amount,
        price_currency:   svc.price_currency,
        price_notes:      svc.price_notes,
        trainer_name:     trainerUser?.full_name ?? null,
        trainer_headline: trainerProfile?.headline ?? null,
        is_active:        true,
        approved_at:      new Date().toISOString(),
        approved_by:      actor.id,
      }, { onConflict: 'service_id' });
    }

    return NextResponse.json({ success: true });
  }

  // Trainer editing / submitting their own service
  if (!isTrainer(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (body.action === 'submit') {
    const { error } = await db
      .from('trainer_services')
      .update({ status: 'pending_approval', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('trainer_id', actor.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Regular save
  const { error } = await db
    .from('trainer_services')
    .update({
      title:            body.title,
      category:         body.category,
      description:      body.description ?? null,
      key_topics:       body.key_topics ?? [],
      delivery_mode:    body.delivery_mode,
      duration_hours:   body.duration_hours ?? null,
      max_participants: body.max_participants ?? null,
      language:         body.language ?? 'English',
      pricing_model:    body.pricing_model,
      price_amount:     body.price_amount ?? null,
      price_currency:   body.price_currency ?? 'INR',
      price_notes:      body.price_notes ?? null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', body.id)
    .eq('trainer_id', actor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getServiceClient();

  if (isTrainer(actor.role)) {
    await db.from('trainer_services').delete().eq('id', id).eq('trainer_id', actor.id).in('status', ['draft']);
  } else if (isDirector(actor.role)) {
    await db.from('trainer_services').delete().eq('id', id);
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
