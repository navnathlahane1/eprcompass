import TrainingCalendarClient from './TrainingCalendarClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function TrainingCalendarPage() {
  const supabase = await createServerComponentClient();

  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const end = new Date(today);
  end.setDate(end.getDate() + 60);
  const endDate = end.toISOString().slice(0, 10);

  const { data: sessions } = await (supabase as any)
    .from('training_sessions')
    .select(
      'id, session_date, start_time, end_time, timezone, platform, meeting_link, venue, seats_total, seats_booked, status, training_programs!inner(id, title, slug, category, tier, delivery, fee_inr, status)'
    )
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .in('status', ['Scheduled', 'Live'])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true });

  const rows = (sessions || [])
    .filter((row: any) => row.training_programs?.status === 'Published')
    .map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      start_time: row.start_time,
      end_time: row.end_time,
      timezone: row.timezone,
      platform: row.platform,
      meeting_link: row.meeting_link,
      venue: row.venue,
      seats_total: Number(row.seats_total || 0),
      seats_booked: Number(row.seats_booked || 0),
      status: row.status,
      program: row.training_programs
    }));

  return <TrainingCalendarClient initialRows={rows} />;
}
