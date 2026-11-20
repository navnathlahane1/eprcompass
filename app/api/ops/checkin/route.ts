import { NextRequest, NextResponse } from 'next/server';
import { resolveOpsActor, getOpsAdminClient } from '@/lib/ops/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db    = getOpsAdminClient();
  const range = req.nextUrl.searchParams.get('range');

  if (range) {
    const days = Math.min(90, Number(range));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await db.from('wfh_checkins')
      .select('date,status,total_hours')
      .eq('user_id', actor.id)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checkins: data ?? [] });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db.from('wfh_checkins')
    .select('*').eq('user_id', actor.id).eq('date', today).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { status: 'pending', checked_in_at: null, total_hours: null });
}

export async function POST(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date().toISOString();
  const db    = getOpsAdminClient();

  if (action === 'checkin') {
    const { data, error } = await db.from('wfh_checkins').upsert({
      user_id:       actor.id,
      date:          today,
      checked_in_at: now,
      status:        'active',
    }, { onConflict: 'user_id,date' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checkin: data });
  }

  if (action === 'checkout') {
    const { data: existing } = await db.from('wfh_checkins')
      .select('checked_in_at').eq('user_id', actor.id).eq('date', today).maybeSingle();

    const checkedInAt = existing?.checked_in_at ? new Date(existing.checked_in_at) : new Date();
    const totalHours  = Math.round(((Date.now() - checkedInAt.getTime()) / 3_600_000) * 100) / 100;

    const { data, error } = await db.from('wfh_checkins')
      .update({ checked_out_at: now, status: 'completed', total_hours: totalHours })
      .eq('user_id', actor.id)
      .eq('date', today)
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checkin: data });
  }

  return NextResponse.json({ error: 'action must be checkin or checkout' }, { status: 400 });
}
