import Link from 'next/link';
import BillingKpis from './BillingKpis';

export default async function BillingModulePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Billing Module</h1>
          <p className="mt-1 text-sm text-slate-400">Manage invoices, collections, and overdue follow-ups.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/billing/invoices" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">
            View Invoices
          </Link>
          <Link href="/admin/billing/create" className="btn-primary">
            Create Invoice
          </Link>
        </div>
      </div>

      <BillingKpis />
    </div>
  );
}
