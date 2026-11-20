import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TelecallingSettingsClient from './TelecallingSettingsClient';

export const metadata = { title: 'Settings | Telecalling Portal' };

export default async function TelecallingSettingsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/telecalling/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, state, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="mx-auto max-w-2xl space-y-1 p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400">Manage your agent profile and contact details.</p>
      </div>
      <TelecallingSettingsClient
        profile={{ full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, state: profile?.state ?? null }}
        email={user.email ?? ''}
        role={profile?.role ?? 'telecaller'}
        memberSince={memberSince}
      />
    </div>
  );
}
