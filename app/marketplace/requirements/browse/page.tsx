import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import RequirementsClient from '../RequirementsClient';

export const metadata = {
  title: 'Requirements Board — Browse | EPR Compass',
  description: 'Browse EPR-related requirements — EPR credits needed, recycling capacity available, compliance services sought, PRO partnerships.',
  alternates: { canonical: '/marketplace/requirements/browse' },
};

export default async function RequirementsBoardBrowsePage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/marketplace/requirements/browse');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || '';
  const allowedRoles = ['admin', 'manager', 'client', 'recycler', 'partner', 'cepc'];
  if (!allowedRoles.includes(role)) redirect('/dashboard');

  const { data: requirements } = await (supabase as any)
    .from('requirements_board')
    .select(
      'id, company_type, waste_category, requirement_type, quantity_kg, quantity_label, location_state, location_city, description, requirement_deadline, budget_range, engagement_type, status, created_at, posted_by'
    )
    .order('created_at', { ascending: false });

  const myPostedIds: string[] = (requirements || [])
    .filter((r: any) => r.posted_by === user.id)
    .map((r: any) => r.id as string);

  return (
    <RequirementsClient
      role={role}
      userId={user.id}
      initialRequirements={requirements || []}
      myPostedIds={myPostedIds}
    />
  );
}

