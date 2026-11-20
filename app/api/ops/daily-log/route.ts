import { NextRequest, NextResponse } from 'next/server';
import { resolveOpsActor, getOpsAdminClient } from '@/lib/ops/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db   = getOpsAdminClient();
  const range = req.nextUrl.searchParams.get('range');

  if (range) {
    const days = Math.min(90, Number(range));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await db.from('wfh_daily_logs')
      .select('date,tasks_completed,deliverables,blockers,hours_worked,submitted_at')
      .eq('user_id', actor.id)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ logs: data ?? [] });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db.from('wfh_daily_logs')
    .select('*').eq('user_id', actor.id).eq('date', today).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data ?? null });
}

export async function POST(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { tasks_completed, deliverables, blockers, hours_worked } = body;
  if (!tasks_completed?.trim()) return NextResponse.json({ error: 'tasks_completed required' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];
  const db    = getOpsAdminClient();
  const { data, error } = await db.from('wfh_daily_logs').upsert({
    user_id:         actor.id,
    date:            today,
    tasks_completed: tasks_completed.trim(),
    deliverables:    deliverables ?? null,
    blockers:        blockers ?? null,
    hours_worked:    hours_worked ?? null,
    submitted_at:    new Date().toISOString(),
  }, { onConflict: 'user_id,date' }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const body  = await req.json();
  const allowed = ['tasks_completed', 'deliverables', 'blockers', 'hours_worked'] as const;
  const update: Record<string, unknown> = { submitted_at: new Date().toISOString() };
  for (const key of allowed) { if (key in body) update[key] = body[key]; }

  const db = getOpsAdminClient();
  const { data, error } = await db.from('wfh_daily_logs')
    .update(update)
    .eq('user_id', actor.id)
    .eq('date', today)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
