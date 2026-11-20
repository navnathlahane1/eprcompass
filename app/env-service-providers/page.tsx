import { createServerComponentClient } from '../../lib/supabase/createServerComponentClient';
import EnvServiceProvidersClient from './EnvServiceProvidersClient';

export const metadata = {
  title: 'Environmental Service Providers | EPR Compass',
  description:
    'Find verified environmental consultants and waste management experts for EPR compliance, sustainability reporting, ESG, and regulatory services.',
};

export default async function EnvServiceProvidersPage() {
  const supabase = await createServerComponentClient();

  const { data: providers } = await (supabase as any)
    .from('env_service_providers')
    .select(
      'id, name, tagline, specialty, about, years_experience, skills, photo_url, profile_url, city, state, country, source_platform, featured, verified'
    )
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('name', { ascending: true });

  return <EnvServiceProvidersClient initialRows={providers || []} />;
}

