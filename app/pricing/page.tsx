import { createClient } from '@supabase/supabase-js';
import SubscriptionPlans from '@/components/workspace/SubscriptionPlans';
import launchPlans from '@/lib/saas/launchPlans.json';

export const metadata = { title: 'EPR Compass Plans & Pricing' };
export const revalidate = 300;

export default async function PricingPage() {
  let plans = launchPlans.map(plan => ({ ...plan, monthly_available: false, annual_available: false }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from('saas_plans')
      .select('code,name,monthly_paise,annual_paise,currency,limits').order('sort_order');
    if (!error && data?.length) plans = data.map(plan => ({ ...plan, monthly_available: false, annual_available: false }));
  }
  return <main className="bg-[#fbfdfc] px-4 py-8 text-[#102c32] sm:px-6 lg:py-12">
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">EPR Compass</h1>
      <p className="mt-3 max-w-2xl text-base text-[#607279]">Subscriptions for importers, manufacturers, international businesses, and compliance agencies.</p>
      <SubscriptionPlans plans={plans} />
    </div>
  </main>;
}

