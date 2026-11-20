import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');

  return (
    <ProjectDetailClient
      projectId={id}
      currentUser={profile}
      allUsers={allUsers || []}
    />
  );
}
