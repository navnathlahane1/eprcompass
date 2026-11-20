import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import CreateInvoiceClient from './CreateInvoiceClient';

export default async function CreateInvoicePage() {
  const supabase = await createServerComponentClient();

  const [{ data: clients }, { data: services }, { data: latest }] = await Promise.all([
    supabase.from('clients').select('id, profile_id'),
    supabase.from('services').select('id, client_id, service_type, waste_category'),
    (supabase as any)
      .from('invoices')
      .select('invoice_no')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const profileIds = [...new Set((clients || []).map((c: any) => c.profile_id).filter(Boolean))];
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, company_name, full_name').in('id', profileIds)
    : { data: [] as any[] };

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const clientOptions = (clients || []).map((c: any) => {
    const p = profileMap.get(c.profile_id);
    return { id: c.id, name: p?.company_name || p?.full_name || 'Client' };
  });

  // Deduplicate by display name — keep first occurrence per name
  const seenNames = new Set<string>();
  const dedupedClientOptions = clientOptions.filter((c: any) => {
    if (seenNames.has(c.name)) return false;
    seenNames.add(c.name);
    return true;
  });

  const serviceOptions = (services || []).map((s: any) => ({
    id: s.id,
    client_id: s.client_id,
    label: `${s.service_type} (${s.waste_category})`
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Create Invoice</h1>
          <p className="mt-1 text-sm text-slate-400">Client and service details auto-loaded from existing records.</p>
        </div>
        <Link href="/admin/billing/invoices" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">
          Back to Invoices
        </Link>
      </div>

      <CreateInvoiceClient
        clients={dedupedClientOptions}
        services={serviceOptions}
        latestInvoiceNo={latest?.invoice_no || null}
      />
    </div>
  );
}
