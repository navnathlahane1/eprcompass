import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect, notFound } from 'next/navigation';
import ClientDetailClient, { type Opportunity } from './ClientDetailClient';

export const metadata = { title: 'Client Details | Partner Portal' };

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Static reference catalog for the 5 core EPR waste categories — fixed
// descriptions, not per-client data, so this is a plain lookup, not a
// dynamic computation.
const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  Plastic: {
    label: 'Plastic Waste EPR',
    description: 'Producers, importers, and brand owners of plastic packaging must register and file Extended Producer Responsibility returns for plastic waste under the Plastic Waste Management Rules.',
  },
  'E-Waste': {
    label: 'E-Waste EPR',
    description: 'Manufacturers, producers, and importers of electrical and electronic equipment must register and meet annual e-waste collection and recycling targets under the E-Waste Management Rules.',
  },
  Battery: {
    label: 'Battery Waste EPR',
    description: 'Producers of batteries (including lithium-ion and lead-acid) must register and ensure end-of-life batteries are collected and recycled under the Battery Waste Management Rules.',
  },
  Tyre: {
    label: 'Tyre Waste EPR',
    description: 'Producers and importers of tyres must register and meet recycling obligations for end-of-life tyres under the Tyre Waste Management Rules.',
  },
  Oil: {
    label: 'Used Oil EPR',
    description: 'Producers and bulk consumers of lubricating oil must register and ensure proper collection and re-refining of used/waste oil under hazardous waste regulations.',
  },
};

function normalizeKey(v: string) {
  return v.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners').select('id').eq('profile_id', user.id).maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  // Security: verify this client belongs to this partner
  const { data: pcRow } = await (supabase as any)
    .from('partner_clients')
    .select('client_id')
    .eq('partner_id', partner.id)
    .eq('client_id', id)
    .maybeSingle();

  if (!pcRow) notFound();

  let clientData: any = null;
  try {
    const { data } = await (supabase as any)
      .from('clients')
      .select('id, status, waste_categories, intel_company_id, renewal_date, ltv_inr, onboarding_complete, profiles:profile_id(company_name, full_name, email)')
      .eq('id', id)
      .maybeSingle();
    clientData = data;
  } catch { clientData = null; }

  if (!clientData) notFound();

  let services: any[] = [];
  try {
    const { data } = await (supabase as any)
      .from('services')
      .select('id, service_type, waste_category, status, filed_at, approved_at, certificate_number, certificate_expiry, due_date')
      .eq('client_id', id)
      .order('due_date', { ascending: true, nullsFirst: false });
    services = data || [];
  } catch { services = []; }

  const client = {
    id: clientData.id,
    companyName: clientData.profiles?.company_name || clientData.profiles?.full_name || 'Unknown',
    email: clientData.profiles?.email || null,
    status: clientData.status || 'Onboarding',
    wasteCategories: clientData.waste_categories || [],
    ltv: Number(clientData.ltv_inr || 0),
    renewalDate: clientData.renewal_date || null,
    onboardingComplete: !!clientData.onboarding_complete,
  };

  const servicedCategories = new Set(
    (services || []).map((s: any) => normalizeKey(s.waste_category || ''))
  );

  const opportunities: Opportunity[] = [];
  const seenKeys = new Set<string>();

  // Intel path: richer, admin/AI-curated applicability data — only present
  // when this client has been linked to an Intel company record.
  if (clientData.intel_company_id) {
    try {
      const svc = getServiceClient();
      const { data: intelRows } = await svc
        .from('intel_compliance_applicability')
        .select('compliance_type_key, compliance_type_name, applicability, risk_level, notes')
        .eq('company_id', clientData.intel_company_id)
        .in('applicability', ['applicable', 'probable']);

      for (const row of intelRows || []) {
        const key = normalizeKey(row.compliance_type_key || row.compliance_type_name || '');
        if (!key || servicedCategories.has(key) || seenKeys.has(key)) continue;
        seenKeys.add(key);
        opportunities.push({
          key,
          name: row.compliance_type_name,
          description: row.notes || `Based on our intelligence data, ${row.compliance_type_name} is applicable to this client.`,
          riskLevel: row.risk_level || null,
          source: 'intel',
        });
      }
    } catch {
      // Intel table unreachable (e.g. RLS/service-role misconfig) — fall through to category-based opportunities.
    }
  }

  // Fallback path: gap between recorded applicable categories and services actually sold.
  for (const cat of client.wasteCategories) {
    const key = normalizeKey(cat);
    if (!key || servicedCategories.has(key) || seenKeys.has(key)) continue;
    seenKeys.add(key);
    const info = CATEGORY_INFO[cat];
    opportunities.push({
      key,
      name: info?.label || cat,
      description: info?.description || `${cat} is recorded as applicable to this client but has not been sold yet.`,
      riskLevel: null,
      source: 'category',
    });
  }

  return <ClientDetailClient client={client} services={services} opportunities={opportunities} />;
}
