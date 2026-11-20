'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function pad(num: number) {
  return String(num).padStart(4, '0');
}

export default function CreateInvoiceClient({ clients, services, latestInvoiceNo }: { clients: any[]; services: any[]; latestInvoiceNo: string | null }) {
  const router = useRouter();
  const year = new Date().getFullYear();

  const nextSequence = useMemo(() => {
    if (!latestInvoiceNo) return 1;
    const m = latestInvoiceNo.match(/INV-\d{4}-(\d{4})/);
    return m ? Number(m[1]) + 1 : 1;
  }, [latestInvoiceNo]);

  const [form, setForm] = useState({
    client_id: clients[0]?.id || '',
    service_id: '',
    amount_inr: 0,
    tax_inr: 0,
    issued_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const filteredServices = useMemo(() => {
    return (services || []).filter((s) => s.client_id === form.client_id);
  }, [services, form.client_id]);

  const invoiceNo = `INV-${year}-${pad(nextSequence)}`;
  const total_inr = Number(form.amount_inr || 0) + Number(form.tax_inr || 0);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        client_id: form.client_id,
        service_id: form.service_id,
        invoice_no: invoiceNo,
        amount_inr: Number(form.amount_inr || 0),
        tax_inr: Number(form.tax_inr || 0),
        total_inr,
        issued_date: form.issued_date,
        due_date: form.due_date,
        status: 'Sent',
        notes: form.notes || null
      };

      const { data, error } = await (supabase as any)
        .from('invoices')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      router.push(`/admin/billing/${data.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-200">
          Client
          <select
            required
            value={form.client_id}
            onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value, service_id: '' }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-200">
          Service
          <select
            required
            value={form.service_id}
            onChange={(e) => setForm((p) => ({ ...p, service_id: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="">Select service</option>
            {filteredServices.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-200">
          Amount (INR)
          <input
            type="number"
            min={0}
            required
            value={form.amount_inr}
            onChange={(e) => setForm((p) => ({ ...p, amount_inr: Number(e.target.value || 0) }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-200">
          Tax (INR)
          <input
            type="number"
            min={0}
            value={form.tax_inr}
            onChange={(e) => setForm((p) => ({ ...p, tax_inr: Number(e.target.value || 0) }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-200">
          Issued Date
          <input
            type="date"
            required
            value={form.issued_date}
            onChange={(e) => setForm((p) => ({ ...p, issued_date: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-200">
          Due Date
          <input
            type="date"
            required
            value={form.due_date}
            onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-200">
        Notes
        <textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="mt-1 min-h-24 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
      </label>

      <div className="rounded-lg border border-blue-800/40 bg-blue-950/30 p-3 text-sm">
        <p className="font-semibold text-blue-900">Generated Invoice No: {invoiceNo}</p>
        <p className="mt-1 text-blue-300">Total: INR {total_inr.toLocaleString('en-IN')}</p>
      </div>

      <button
        type="submit"
        disabled={saving || !form.service_id}
        className="btn-primary"
      >
        {saving ? 'Saving...' : 'Create Invoice'}
      </button>
    </form>
  );
}
