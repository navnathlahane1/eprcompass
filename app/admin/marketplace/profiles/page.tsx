import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import MarketplaceProfilesAdminClient from './MarketplaceProfilesAdminClient';

const LISTING_FILTERS = new Set([
  'consultants_marketplace',
  'service_providers_directory',
  'compliance_consultants',
  'recyclers_pro_network'
]);

export default async function AdminMarketplaceProfilesPage({
  searchParams
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const params = await searchParams;
  const requestedListing = String(params?.listing || '');
  const initialListingFilter = LISTING_FILTERS.has(requestedListing) ? requestedListing : 'All';

  const supabase = await createServerComponentClient();

  const { data: rows } = await (supabase as any)
    .from('marketplace_profiles')
    .select('id, listing_type, full_name, company_name, email, phone, state, city, approval_status, approval_notes, years_experience, focus_areas, waste_categories, services_offered, created_at, approved_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Marketplace Profiles Approval</h1>
        <p className="mt-1 text-slate-400">Review, approve, reject, and create marketplace user profiles.</p>
      </section>

      <MarketplaceProfilesAdminClient
        initialRows={(rows || []) as any}
        initialListingFilter={initialListingFilter}
      />
    </div>
  );
}
