import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import RecyclerDashboardClient from './RecyclerDashboardClient';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildRecyclerSetupSteps } from '@/components/setup/setupSteps';

export default async function RecyclerDashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Link by email since recyclers table has email but no profile_id
  const { data: recycler } = await (supabase as any)
    .from('recyclers')
    .select('id, company_name, status, state, city, capacity_mt_pa, cpcb_cert_expiry, risk_flag, contact_person, email, phone, waste_categories')
    .eq('email', user.email)
    .maybeSingle();

  if (!recycler) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Account Setup Pending</h1>
          <p className="text-sm text-slate-600">Your recycler profile is not yet linked to this account. Please contact EPR Compass support.</p>
        </div>
      </div>
    );
  }

  const [
    { data: documents },
    { data: credits },
    { data: capacityLogs },
    { data: priceAlerts },
    { data: priceHistory },
    { data: checklist },
  ] = await Promise.all([
    (supabase as any)
      .from('recycler_documents')
      .select('id, doc_type, file_path, expiry_date, status, uploaded_at')
      .eq('recycler_id', recycler.id)
      .order('uploaded_at', { ascending: false }),
    (supabase as any)
      .from('epr_credits')
      .select('id, waste_category, credit_type, quantity_kg, quantity_mt, rate_per_kg_inr, rate_per_mt_inr, total_value_inr, transaction_ref, status, created_at')
      .eq('recycler_id', recycler.id)
      .order('created_at', { ascending: false })
      .limit(50),
    (supabase as any)
      .from('recycler_capacity_log')
      .select('id, month, capacity_mt, utilized_mt, utilization_pct')
      .eq('recycler_id', recycler.id)
      .order('month', { ascending: true })
      .limit(12),
    (supabase as any)
      .from('credit_price_alerts')
      .select('id, waste_category, target_rate_inr, alert_type, channel, status, triggered_at, created_at')
      .eq('client_id', recycler.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('credit_price_history')
      .select('waste_category, rate_inr, recorded_date')
      .order('recorded_date', { ascending: false })
      .limit(100),
    (supabase as any)
      .from('onboarding_checklists')
      .select('id, steps, completion_pct, updated_at')
      .eq('entity_type', 'recycler')
      .eq('entity_id', recycler.id)
      .maybeSingle(),
  ]);

  // Latest price per category
  const latestPrices: Record<string, number> = {};
  for (const ph of (priceHistory || [])) {
    if (!latestPrices[ph.waste_category]) {
      latestPrices[ph.waste_category] = Number(ph.rate_inr);
    }
  }

  const recyclerDocs = documents || [];
  const recyclerSetupSteps = buildRecyclerSetupSteps({
    hasProfile: !!(recycler.company_name && recycler.contact_person && recycler.phone),
    hasCpcbCert: recyclerDocs.some((d: any) => ['CPCB Certificate', 'Authorisation Certificate', 'Recycler Certificate'].includes(d.doc_type)),
    hasCapacity: !!(recycler.capacity_mt_pa),
    hasWasteCategories: Array.isArray(recycler.waste_categories) && recycler.waste_categories.length > 0,
    hasDocuments: recyclerDocs.length > 0,
    hasBankDetails: false, // not in current schema; extend when bank details table is added
  });

  return (
    <div className="space-y-4">
      <SetupGuideWidget
        steps={recyclerSetupSteps}
        portalKey={`recycler-${recycler.id}`}
        accentColor="emerald"
      />
      <RecyclerDashboardClient
      recycler={recycler}
      documents={documents || []}
      credits={credits || []}
      capacityLogs={capacityLogs || []}
      priceAlerts={priceAlerts || []}
      latestPrices={latestPrices}
      checklist={checklist || null}
    />
    </div>
  );
}

