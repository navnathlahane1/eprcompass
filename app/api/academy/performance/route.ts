/**
 * GET  /api/academy/performance  — list reviews (director sees all; others see own)
 * POST /api/academy/performance  — create a review (director only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const url = new URL(req.url);
  const revieweeId = url.searchParams.get('reviewee_id');
  const period     = url.searchParams.get('period');

  let query = db
    .from('academy_performance_reviews')
    .select(`
      id, review_period, period_start, period_end, reviewee_role, status,
      score_overall, score_delivery, score_engagement, score_knowledge,
      score_punctuality, score_compliance,
      sessions_conducted, avg_attendance_rate, avg_feedback_rating,
      programs_managed, completion_rate,
      strengths, areas_for_improvement, goals_next_period, additional_notes,
      acknowledged_at, created_at, updated_at,
      reviewer:reviewer_id(id, full_name),
      reviewee:reviewee_id(id, full_name, role)
    `)
    .order('created_at', { ascending: false });

  // Non-directors only see their own reviews
  if (actor.role !== 'academy_director' && actor.role !== 'admin') {
    query = query.eq('reviewee_id', actor.id);
  } else if (revieweeId) {
    query = query.eq('reviewee_id', revieweeId);
  }

  if (period) query = query.eq('review_period', period);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor(['academy_director', 'admin']);
  if (!actor) return NextResponse.json({ error: 'Unauthorized — director only' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const {
    reviewee_id, review_period, period_start, period_end,
    score_overall, score_delivery, score_engagement, score_knowledge,
    score_punctuality, score_compliance,
    sessions_conducted, avg_attendance_rate, avg_feedback_rating,
    programs_managed, completion_rate,
    strengths, areas_for_improvement, goals_next_period, additional_notes,
    status = 'draft',
  } = body;

  if (!reviewee_id || !review_period) {
    return NextResponse.json({ error: 'reviewee_id and review_period are required' }, { status: 400 });
  }

  const db = getServiceClient();

  // Snapshot reviewee role
  const { data: revieweeProfile } = await db
    .from('profiles').select('role, full_name').eq('id', reviewee_id).maybeSingle();
  if (!revieweeProfile) return NextResponse.json({ error: 'Reviewee not found' }, { status: 404 });

  const { data, error } = await db
    .from('academy_performance_reviews')
    .insert({
      reviewer_id: actor.id,
      reviewee_id,
      reviewee_role: revieweeProfile.role,
      review_period,
      period_start:  period_start  ?? null,
      period_end:    period_end    ?? null,
      score_overall: score_overall ?? null,
      score_delivery: score_delivery ?? null,
      score_engagement: score_engagement ?? null,
      score_knowledge: score_knowledge ?? null,
      score_punctuality: score_punctuality ?? null,
      score_compliance: score_compliance ?? null,
      sessions_conducted:  sessions_conducted  ?? 0,
      avg_attendance_rate: avg_attendance_rate ?? null,
      avg_feedback_rating: avg_feedback_rating ?? null,
      programs_managed:    programs_managed    ?? 0,
      completion_rate:     completion_rate     ?? null,
      strengths, areas_for_improvement, goals_next_period, additional_notes,
      status,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
