import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import ProjectsListClient from './ProjectsListClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = await createServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');

  return (
    <ProjectsListClient
      currentUser={profile}
      allUsers={users || []}
    />
  );
}
