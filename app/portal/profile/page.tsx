import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PortalProfileClient from './PortalProfileClient';

export const metadata = { title: 'My Profile | EPR Client Portal' };

export default async function PortalProfilePage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, phone, state, gstin, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="mx-auto max-w-2xl space-y-1 p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Company Profile</h1>
        <p className="text-sm text-slate-500">Update your company and contact details.</p>
      </div>
      <PortalProfileClient
        profile={{
          full_name: profile?.full_name ?? null,
          company_name: profile?.company_name ?? null,
          phone: profile?.phone ?? null,
          state: profile?.state ?? null,
          gstin: profile?.gstin ?? null,
        }}
        email={user.email ?? ''}
        memberSince={memberSince}
      />
    </div>
  );
}
