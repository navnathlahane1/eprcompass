/**
 * POST /api/public/recycler/[slug]/book — book a slot on a recycler's public calendar (no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await req.json().catch(() => ({}));

  const name = String(b.name || '').trim();
  const phone = String(b.phone || '').trim();
  const email = String(b.email || '').trim();
  const org = String(b.org || '').trim();
  const start = b.start ? new Date(b.start) : null;

  if (!name || !phone) return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  if (!start || isNaN(start.getTime())) return NextResponse.json({ error: 'A valid slot start time is required' }, { status: 400 });

  const client = db();
  const { data: recycler } = await (client as any)
    .from('recyclers').select('id, public_profile_enabled').eq('public_slug', slug).maybeSingle();
  if (!recycler || !recycler.public_profile_enabled) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: settings } = await (client as any)
    .from('recycler_calendar_settings').select('*').eq('recycler_id', recycler.id).maybeSingle();
  if (!settings || !settings.booking_enabled) {
    return NextResponse.json({ error: 'Booking is not enabled for this recycler' }, { status: 404 });
  }

  const end = new Date(start.getTime() + settings.meeting_duration_min * 60000);

  // Race-protect: reject if another booking now overlaps this slot
  const { data: overlapping } = await (client as any)
    .from('recycler_bookings')
    .select('id')
    .eq('recycler_id', recycler.id)
    .eq('status', 'CONFIRMED')
    .lt('start_at', end.toISOString())
    .gt('end_at', start.toISOString())
    .limit(1);

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json({ error: 'That slot was just booked by someone else. Please pick another.' }, { status: 409 });
  }

  const { error } = await (client as any).from('recycler_bookings').insert({
    recycler_id: recycler.id,
    requirement_id: b.requirement_id || null,
    booked_by_name: name.slice(0, 200),
    booked_by_email: email.slice(0, 200) || null,
    booked_by_phone: phone.slice(0, 30),
    booked_by_org: org.slice(0, 200) || null,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    notes: String(b.notes || '').slice(0, 1000) || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: 'Meeting booked! You will be contacted to confirm.' });
}
