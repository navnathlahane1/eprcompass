import Link from 'next/link';
import BillingKpis from '../BillingKpis';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import InvoicesTableClient from './InvoicesTableClient';

export default async function InvoicesPage() {
  const supabase = await createServerComponentClient();
  const { data: invoices } = await (supabase as any)
    .from('invoices')
    .select('id, client_id, service_id, invoice_no, amount_inr, tax_inr, total_inr, issued_date, due_date, paid_date, status, pdf_path, notes, created_at')
    .order('created_at', { ascending: false });

  const clientIds = [...new Set((invoices || []).map((i: any) => String(i.client_id || '')).filter(Boolean))] as string[];
  const serviceIds = [...new Set((invoices || []).map((i: any) => String(i.service_id || '')).filter(Boolean))] as string[];

  const [{ data: clients }, { data: services }] = await Promise.all([
    clientIds.length ? supabase.from('clients').select('id, profile_id').in('id', clientIds) : Promise.resolve({ data: [] }),
    serviceIds.length ? supabase.from('services').select('id, service_type').in('id', serviceIds) : Promise.resolve({ data: [] })
  ]);

  const profileIds = [...new Set((clients || []).map((c: any) => String(c.profile_id || '')).filter(Boolean))] as string[];
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, company_name, full_name').in('id', profileIds)
    : { data: [] as any[] };

  const clientMap = new Map((clients || []).map((c: any) => [c.id, c]));
  const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const rows = (invoices || []).map((inv: any) => {
    const client = clientMap.get(inv.client_id);
    const profile = client ? profileMap.get(client.profile_id) : null;
    return {
      ...inv,
      client_name: profile?.company_name || profile?.full_name || 'Client',
      service_name: serviceMap.get(inv.service_id)?.service_type || 'Service'
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Invoices</h1>
          <p className="mt-1 text-sm text-slate-400">Search and filter by invoice status.</p>
        </div>
        <Link href="/admin/billing/create" className="btn-primary">
          Create Invoice
        </Link>
      </div>

      <BillingKpis />

      <InvoicesTableClient initialRows={rows} />
    </div>
  );
}
