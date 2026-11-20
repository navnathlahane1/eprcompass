import { redirect } from 'next/navigation';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import ClientOnboardingForm from '@/components/onboarding/ClientOnboardingForm';

export const metadata = { title: 'Company Setup | EPR Compass' };
export default async function ClientOnboardingPage() {
  const actor = await resolveClientActor();
  if (!actor) redirect('/portal/login');
  const { data, error } = await adminClient().from('clients').select('business_activity,onboarding_details').eq('id', actor.clientId).maybeSingle();
  if (error || !data) return <p role="alert" className="p-6">Company setup is unavailable. Please contact support.</p>;
  return <ClientOnboardingForm initial={{ ...data.onboarding_details, business_activity: data.business_activity }} readOnly={actor.memberRole !== 'OWNER'} />;
}

