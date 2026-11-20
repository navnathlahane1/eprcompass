import ProgramsClient from './ProgramsClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function ProgramsPage() {
  const supabase = await createServerComponentClient();

  const { data: programs } = await (supabase as any)
    .from('training_programs')
    .select('id, title, slug, category, tier, delivery, duration_hours, fee_inr, max_seats, trainer_name, trainer_bio, description, objectives, status, created_at')
    .order('created_at', { ascending: false });

  return <ProgramsClient initialRows={programs || []} />;
}
