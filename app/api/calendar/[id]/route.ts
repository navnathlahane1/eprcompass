import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function escapeICS(value: string) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toICSDate(value: string) {
  return value.replace(/[-:]/g, '').split('.')[0];
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase environment missing' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: row, error } = await (supabase as any)
    .from('training_sessions')
    .select('id, session_date, start_time, end_time, timezone, platform, meeting_link, venue, training_programs!inner(title)')
    .eq('id', id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const startISO = `${row.session_date}T${row.start_time}`;
  const endISO = `${row.session_date}T${row.end_time}`;

  const uid = `${row.id}@epracademy`;
  const dtStamp = toICSDate(new Date().toISOString()) + 'Z';
  const dtStart = toICSDate(startISO);
  const dtEnd = toICSDate(endISO);

  const location = row.platform === 'Offline' ? row.venue || 'Offline Venue' : row.meeting_link || row.platform;
  const description = [
    `Platform: ${row.platform}`,
    row.meeting_link ? `Meeting Link: ${row.meeting_link}` : '',
    row.venue ? `Venue: ${row.venue}` : ''
  ].filter(Boolean).join('\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EPR Academy//Training Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${row.timezone || 'Asia/Kolkata'}:${dtStart}`,
    `DTEND;TZID=${row.timezone || 'Asia/Kolkata'}:${dtEnd}`,
    `SUMMARY:${escapeICS(row.training_programs?.title || 'Training Session')}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    'ORGANIZER;CN=EPR Academy:mailto:supporteprcompass@gmail.com',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="training-session-${row.id}.ics"`
    }
  });
}
