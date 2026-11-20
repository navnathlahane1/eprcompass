/**
 * GET    /api/academy/performance/[id]  — fetch single review
 * PATCH  /api/academy/performance/[id]  — update review (director) or acknowledge (reviewee)
 * DELETE /api/academy/performance/[id]  — delete draft (director only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const { data, error } = await db
    .from('academy_performance_reviews')
    .select(`
      *, reviewer:reviewer_id(id, full_name), reviewee:reviewee_id(id, full_name, role)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Non-directors can only read their own reviews
  if (actor.role !== 'academy_director' && actor.role !== 'admin') {
    if (data.reviewee_id !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ review: data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const db = getServiceClient();

  const { data: existing } = await db
    .from('academy_performance_reviews')
    .select('id, reviewee_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Reviewee can only acknowledge their own submitted review
  if (actor.role !== 'academy_director' && actor.role !== 'admin') {
    if (existing.reviewee_id !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (body.status !== 'acknowledged') {
      return NextResponse.json({ error: 'You can only acknowledge a review' }, { status: 403 });
    }
    const { data, error } = await db
      .from('academy_performance_reviews')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ review: data });
  }

  // Director can update any field
  const allowed = [
    'review_period','period_start','period_end',
    'score_overall','score_delivery','score_engagement','score_knowledge',
    'score_punctuality','score_compliance',
    'sessions_conducted','avg_attendance_rate','avg_feedback_rating',
    'programs_managed','completion_rate',
    'strengths','areas_for_improvement','goals_next_period','additional_notes','status',
  ];
  const updates: Record<string, any> = {};
  for (const k of allowed) {
    if (k in body) updates[k] = body[k];
  }

  const { data, error } = await db
    .from('academy_performance_reviews')
    .update(updates)
    .eq('id', id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveAcademyActor(['academy_director', 'admin']);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const db = getServiceClient();

  const { data: existing } = await db
    .from('academy_performance_reviews')
    .select('status').eq('id', id).maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft reviews can be deleted' }, { status: 400 });
  }

  const { error } = await db.from('academy_performance_reviews').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
