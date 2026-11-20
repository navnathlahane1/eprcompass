import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.company_name) return NextResponse.json({ error: 'company_name required' }, { status: 400 });

  const db = getServiceClient();
  const { data, error } = await db
    .from('trainer_past_clients')
    .insert({
      trainer_id:      actor.id,
      company_name:    body.company_name,
      industry:        body.industry ?? null,
      engagement_type: body.engagement_type ?? null,
      year_from:       body.year_from ?? null,
      year_to:         body.year_to ?? null,
      description:     body.description ?? null,
      can_reference:   body.can_reference ?? false,
      sort_order:      body.sort_order ?? 0,
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
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getServiceClient();
  const { error } = await db
    .from('trainer_past_clients')
    .update({
      company_name:    body.company_name,
      industry:        body.industry ?? null,
      engagement_type: body.engagement_type ?? null,
      year_from:       body.year_from ?? null,
      year_to:         body.year_to ?? null,
      description:     body.description ?? null,
      can_reference:   body.can_reference ?? false,
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
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getServiceClient();
  await db.from('trainer_past_clients').delete().eq('id', id).eq('trainer_id', actor.id);
  return NextResponse.json({ success: true });
}
