import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Email service unavailable' }, { status: 503 });
  }

  const { registration_id: registrationId } = await request.json().catch(() => ({}));
  if (!registrationId) return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: registration, error } = await db
    .from('registrations')
    .select('id, name, email, training_sessions(session_date, start_time, end_time, meeting_link, venue, timezone, training_programs(title))')
    .eq('id', registrationId)
    .maybeSingle();
  if (error || !registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  const session: any = registration.training_sessions;
  const response = await fetch(`${url}/functions/v1/send-registration-email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
      'x-idempotency-key': `registration-email:${registration.id}`,
    },
    body: JSON.stringify({
      registration_id: registration.id,
      name: registration.name,
      email: registration.email,
      program_title: session?.training_programs?.title,
      session_date: session?.session_date,
      start_time: session?.start_time,
      end_time: session?.end_time,
      meeting_link: session?.meeting_link,
      venue: session?.venue,
      timezone: session?.timezone,
    }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Email delivery failed' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
