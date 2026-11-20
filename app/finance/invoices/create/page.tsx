'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Client {
  id: string;
  client_name: string;
}

function CreateInvoiceForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preClientId  = searchParams.get('client_id') || '';
  const preTaskId    = searchParams.get('task_id')   || '';

  const [clients,    setClients]    = useState<Client[]>([]);
  const [clientId,   setClientId]   = useState(preClientId);
  const [invoiceNo,  setInvoiceNo]  = useState('');
  const [amountInr,  setAmountInr]  = useState('');
  const [taxInr,     setTaxInr]     = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');

  // Compute totals
  const amount = parseFloat(amountInr) || 0;
  const tax    = parseFloat(taxInr)    || 0;
  const total  = amount + tax;

  useEffect(() => {
    // Fetch clients list via invoices summary (use profiles query)
    fetch('/api/finance/invoices?status=draft&search=')
      .then(r => r.ok ? r.json() : { invoices: [] })
      .then(() => {
        // Fetch clients from a lightweight endpoint
        fetch('/api/finance/clients')
          .then(r => r.ok ? r.json() : { clients: [] })
          .then(d => setClients(d.clients ?? []))
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setErr('Please select a client'); return; }
    if (!amount)   { setErr('Amount is required'); return; }
    setSaving(true); setErr('');

    try {
      const res = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:  clientId,
          invoice_no: invoiceNo || undefined,
          amount_inr: amount,
          tax_inr:    tax || undefined,
          due_date:   dueDate || undefined,
          notes:      notes   || undefined,
          task_id:    preTaskId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      router.push(`/finance/invoices/${data.invoice.id}`);
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/finance/invoices"
          className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Invoices
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-400">Create</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-100">New Invoice</h1>
        <p className="mt-0.5 text-sm text-slate-500">Create and send an invoice to a client</p>
      </div>

      {preTaskId && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This invoice will be linked to a finance task. The task will be updated to &quot;In Progress&quot; when the invoice is created.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Invoice Details</p>

          {/* Client */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Client <span className="text-rose-500">*</span>
            </label>
            {clients.length > 0 ? (
              <select
                value={clientId} onChange={e => setClientId(e.target.value)} required
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition">
                <option value="">Select client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.client_name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text" placeholder="Client ID (paste from client record)"
                value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
              />
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Invoice Number <span className="text-slate-600">(auto-generated if blank)</span>
            </label>
            <input
              type="text" placeholder="INV-0001"
              value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
            />
          </div>

          {/* Amount + Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={amountInr} onChange={e => setAmountInr(e.target.value)} required
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Tax / GST (₹)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={taxInr} onChange={e => setTaxInr(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          {/* Total display */}
          {total > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="text-xs text-slate-400">Total Amount</span>
              <span className="text-base font-bold tabular-nums text-emerald-400">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Due Date</label>
            <input
              type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition [color-scheme:dark]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Notes</label>
            <textarea
              rows={3} placeholder="Additional notes or terms…"
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition"
            />
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {err}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link href="/finance/invoices"
            className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <CreateInvoiceForm />
    </Suspense>
  );
}
