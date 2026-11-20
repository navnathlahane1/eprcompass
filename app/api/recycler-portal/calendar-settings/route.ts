/**
 * GET   /api/recycler-portal/calendar-settings — this recycler's booking settings + weekly availability
 * PATCH /api/recycler-portal/calendar-settings — update settings and/or replace weekly availability rules
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const [settingsRes, rulesRes] = await Promise.all([
    (db as any).from('recycler_calendar_settings').select('*').eq('recycler_id', actor.recyclerId).maybeSingle(),
    (db as any).from('recycler_availability_rules').select('*').eq('recycler_id', actor.recyclerId).order('day_of_week'),
  ]);

  return NextResponse.json({
    settings: settingsRes.data ?? { timezone: 'Asia/Kolkata', meeting_duration_min: 30, buffer_min: 10, booking_enabled: false },
    rules: rulesRes.data ?? [],
  });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  if (b.settings) {
    const { timezone, meeting_duration_min, buffer_min, booking_enabled } = b.settings;
    const { error } = await (db as any).from('recycler_calendar_settings').upsert(
      {
        recycler_id: actor.recyclerId,
        timezone: timezone || 'Asia/Kolkata',
        meeting_duration_min: Number(meeting_duration_min) || 30,
        buffer_min: Number(buffer_min) || 10,
        booking_enabled: !!booking_enabled,
      },
      { onConflict: 'recycler_id' }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(b.rules)) {
    await (db as any).from('recycler_availability_rules').delete().eq('recycler_id', actor.recyclerId);
    const rows = b.rules
      .filter((r: any) => r.start_time && r.end_time)
      .map((r: any) => ({
        recycler_id: actor.recyclerId,
        day_of_week: Number(r.day_of_week),
        start_time: r.start_time,
        end_time: r.end_time,
      }));
    if (rows.length) {
      const { error } = await (db as any).from('recycler_availability_rules').insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
