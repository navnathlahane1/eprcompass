import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import CepcProfileClient from './CepcProfileClient';

export const metadata = { title: 'My Profile | CEPC Portal' };

export default async function CepcProfilePage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/cepc/login');

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
        <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Update your personal information and service region.</p>
      </div>
      <CepcProfileClient
        profile={{ full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, state: profile?.state ?? null }}
        email={user.email ?? ''}
        memberSince={memberSince}
      />
    </div>
  );
}
