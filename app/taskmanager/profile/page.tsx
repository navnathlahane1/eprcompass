import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TaskManagerProfileClient from './TaskManagerProfileClient';

export const metadata = { title: 'My Profile | Task Manager' };

export default async function TaskManagerProfilePage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/taskmanager/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, state, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="mx-auto max-w-2xl space-y-1 p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">My Profile</h1>
        <p className="text-sm text-slate-400">Update your personal information and contact details.</p>
      </div>
      <TaskManagerProfileClient
        profile={{ full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, state: profile?.state ?? null }}
        email={user.email ?? ''}
        memberSince={memberSince}
      />
    </div>
  );
}
