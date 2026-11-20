import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PostRequirementClient from './PostRequirementClient';

export default async function PostRequirementPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/marketplace/requirements/new');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || '';
  const allowedRoles = ['admin', 'manager', 'client', 'recycler', 'partner', 'cepc'];
  if (!allowedRoles.includes(role)) redirect('/dashboard');

  let companyName = profile?.full_name || '';

  if (role === 'client') {
    const { data: clientRow } = await (supabase as any)
      .from('clients')
      .select('company_name')
      .eq('profile_id', user.id)
      .maybeSingle();
    if (clientRow?.company_name) companyName = clientRow.company_name;
  } else if (role === 'recycler') {
    const { data: recyclerRow } = await (supabase as any)
      .from('recyclers')
      .select('company_name')
      .eq('profile_id', user.id)
      .maybeSingle();
    if (recyclerRow?.company_name) companyName = recyclerRow.company_name;
  }

  return <PostRequirementClient role={role} userId={user.id} companyName={companyName} />;
}
