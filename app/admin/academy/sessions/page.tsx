import SessionsClient from './SessionsClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function SessionsPage() {
  const supabase = await createServerComponentClient();

  const [{ data: programs }, { data: sessions }] = await Promise.all([
    (supabase as any)
      .from('training_programs')
      .select('id, title, status')
      .order('title', { ascending: true }),
    (supabase as any)
      .from('training_sessions')
      .select('id, program_id, session_date, start_time, end_time, timezone, platform, meeting_link, venue, seats_total, seats_booked, status, created_at, training_programs(title)')
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
  ]);

  return <SessionsClient initialPrograms={programs || []} initialSessions={sessions || []} />;
}
