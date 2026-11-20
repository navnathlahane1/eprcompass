import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import MyTasksClient from './MyTasksClient';

export const dynamic = 'force-dynamic';

export default async function MyTasksPage() {
  const supabase = await createServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  return <MyTasksClient currentUser={profile} />;
}
