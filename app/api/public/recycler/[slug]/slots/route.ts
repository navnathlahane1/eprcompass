/**
 * GET /api/public/recycler/[slug]/slots?date=YYYY-MM-DD — available booking slots for one day (no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeSlotsForDay } from '@/lib/recyclerPortal/calendarSlots';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dateStr = req.nextUrl.searchParams.get('date');
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'A valid date=YYYY-MM-DD query param is required' }, { status: 400 });
  }

  const client = db();
  const { data: recycler } = await (client as any)
    .from('recyclers').select('id, public_profile_enabled').eq('public_slug', slug).maybeSingle();
  if (!recycler || !recycler.public_profile_enabled) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const [settingsRes, rulesRes, bookingsRes] = await Promise.all([
    (client as any).from('recycler_calendar_settings').select('*').eq('recycler_id', recycler.id).maybeSingle(),
    (client as any).from('recycler_availability_rules').select('day_of_week, start_time, end_time').eq('recycler_id', recycler.id),
    (client as any).from('recycler_bookings').select('start_at, end_at').eq('recycler_id', recycler.id).eq('status', 'CONFIRMED')
      .gte('start_at', `${dateStr}T00:00:00Z`).lt('start_at', `${dateStr}T23:59:59Z`),
  ]);

  const settings = settingsRes.data;
  if (!settings || !settings.booking_enabled) {
    return NextResponse.json({ error: 'Booking is not enabled for this recycler' }, { status: 404 });
  }

  const slots = computeSlotsForDay({
    dateStr,
    timeZone: settings.timezone,
    meetingDurationMin: settings.meeting_duration_min,
    bufferMin: settings.buffer_min,
    rules: rulesRes.data ?? [],
    existingBookings: bookingsRes.data ?? [],
  });

  return NextResponse.json({
    slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
  });
}
