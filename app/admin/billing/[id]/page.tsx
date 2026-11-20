import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import InvoiceDetailClient from './InvoiceDetailClient';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: invoice } = await (supabase as any)
    .from('invoices')
    .select('id, client_id, service_id, invoice_no, amount_inr, tax_inr, total_inr, issued_date, due_date, paid_date, status, pdf_path, notes')
    .eq('id', id)
    .maybeSingle();

  if (!invoice) return notFound();

  const db = supabase as any;

  const [{ data: client }, { data: service }] = await Promise.all([
    db.from('clients').select('id, profile_id').eq('id', invoice.client_id).maybeSingle(),
    db.from('services').select('id, service_type, waste_category').eq('id', invoice.service_id).maybeSingle()
  ]);

  const { data: profile } = client?.profile_id
    ? await db.from('profiles').select('id, company_name, full_name').eq('id', client.profile_id).maybeSingle()
    : { data: null };

  const clientName = profile?.company_name || profile?.full_name || 'Client';
  const serviceName = service ? `${service.service_type} (${service.waste_category})` : 'Service';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Invoice Detail</h1>
          <p className="mt-1 text-sm text-slate-400">Review payment status and update manually.</p>
        </div>
        <Link href="/admin/billing/invoices" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">
          Back to Invoices
        </Link>
      </div>

      <InvoiceDetailClient invoice={invoice} clientName={clientName} serviceName={serviceName} />
    </div>
  );
}
