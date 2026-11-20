'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

export default function InvoiceDetailClient({ invoice, clientName, serviceName }: { invoice: any; clientName: string; serviceName: string }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function markPaid() {
    setSaving(true);
    try {
      const paid_date = new Date().toISOString().slice(0, 10);
      const { error } = await (supabase as any)
        .from('invoices')
        .update({ status: 'Paid', paid_date })
        .eq('id', invoice.id);
      if (error) throw error;
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Invoice:</span> {invoice.invoice_no}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Status:</span> {invoice.status}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Client:</span> {clientName}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Service:</span> {serviceName}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Amount:</span> {formatINR(Number(invoice.amount_inr || 0))}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Tax:</span> {formatINR(Number(invoice.tax_inr || 0))}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Total:</span> {formatINR(Number(invoice.total_inr || 0))}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Issued:</span> {invoice.issued_date}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Due:</span> {invoice.due_date}</p>
        <p className="text-sm text-slate-200"><span className="font-semibold text-slate-100">Paid:</span> {invoice.paid_date || '-'}</p>
      </div>

      {invoice.notes ? (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
          <p className="font-semibold text-slate-100">Notes</p>
          <p className="mt-1">{invoice.notes}</p>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          onClick={markPaid}
          disabled={saving || invoice.status === 'Paid'}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Updating...' : invoice.status === 'Paid' ? 'Already Paid' : 'Mark as Paid'}
        </button>

        <button
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950"
          onClick={() => window.print()}
        >
          Download PDF
        </button>
      </div>
    </section>
  );
}
