/**
 * GET  /api/academy/surveys  — list surveys
 * POST /api/academy/surveys  — create a survey
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data, error } = await (db as any)
    .from('academy_surveys')
    .select('id, name, program, type, trigger, response_rate, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ surveys: [] });
    return NextResponse.json({ error: 'Failed to load surveys' }, { status: 500 });
  }

  return NextResponse.json({ surveys: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, type, trigger, questions } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const db = getServiceClient();

  const { data: survey, error } = await (db as any)
    .from('academy_surveys')
    .insert({
      name: name.trim(),
      type: type ?? 'Post-Session',
      trigger: trigger ?? 'Manual',
      questions: Array.isArray(questions) ? questions : [],
      response_rate: 0,
      created_by: actor.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Surveys feature not yet available — migration pending.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }

  return NextResponse.json({ survey }, { status: 201 });
}
