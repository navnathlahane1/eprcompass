import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import ProgramDetailClient from './ProgramDetailClient';

export default async function ProgramDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ session?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createServerComponentClient();

  const { data: program } = await (supabase as any)
    .from('training_programs')
    .select('id, title, slug, category, tier, delivery, duration_hours, fee_inr, max_seats, trainer_name, trainer_bio, description, objectives, status')
    .eq('slug', slug)
    .eq('status', 'Published')
    .maybeSingle();

  if (!program) {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: sessions } = await (supabase as any)
    .from('training_sessions')
    .select('id, session_date, start_time, end_time, timezone, platform, meeting_link, venue, seats_total, seats_booked, status')
    .eq('program_id', program.id)
    .gte('session_date', today)
    .in('status', ['Scheduled', 'Live'])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true });

  return (
    <ProgramDetailClient
      program={program}
      initialSessions={sessions || []}
      initialSelectedSession={resolvedSearchParams?.session || null}
    />
  );
}
