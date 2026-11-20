import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

export default async function BillingKpis() {
  const supabase = await createServerComponentClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthDate = startOfMonth.toISOString().slice(0, 10);

  const [{ data: allInvoices }, { data: thisMonthInvoices }] = await Promise.all([
    (supabase as any)
      .from('invoices')
      .select('total_inr, status, due_date, paid_date'),
    (supabase as any)
      .from('invoices')
      .select('total_inr')
      .gte('issued_date', monthDate)
  ]);

  const now = new Date();
  const rows = allInvoices || [];

  const totalBilled = rows.reduce((sum: number, row: any) => sum + Number(row.total_inr || 0), 0);
  const collected = rows
    .filter((row: any) => row.status === 'Paid')
    .reduce((sum: number, row: any) => sum + Number(row.total_inr || 0), 0);
  const overdue = rows
    .filter((row: any) => row.status !== 'Paid' && row.due_date && new Date(`${row.due_date}T00:00:00Z`) < now)
    .reduce((sum: number, row: any) => sum + Number(row.total_inr || 0), 0);
  const thisMonth = (thisMonthInvoices || []).reduce((sum: number, row: any) => sum + Number(row.total_inr || 0), 0);

  const items = [
    { label: 'Total Billed', value: formatINR(totalBilled) },
    { label: 'Collected', value: formatINR(collected) },
    { label: 'Overdue', value: formatINR(overdue) },
    { label: 'This Month', value: formatINR(thisMonth) }
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-2 text-xl font-bold text-slate-100">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
