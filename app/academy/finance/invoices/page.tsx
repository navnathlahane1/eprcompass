'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type PayStatus = 'paid' | 'created' | 'failed' | 'refunded';

interface Payment {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  participant_name: string;
  participant_email: string;
  organization: string | null;
  program_title: string;
  subtotal_inr: number;
  gst_amount_inr: number;
  total_inr: number;
  discount_inr: number;
  promo_code: string | null;
  partner_code: string | null;
  status: PayStatus;
  created_at: string;
  paid_at: string | null;
}

const STATUS_STYLE: Record<PayStatus, string> = {
  paid:     'bg-emerald-500/15 text-emerald-300',
  created:  'bg-amber-500/15 text-amber-300',
  failed:   'bg-rose-500/15 text-rose-400',
  refunded: 'bg-slate-500/15 text-slate-400',
};

const STATUS_LABEL: Record<PayStatus, string> = {
  paid:     'Paid',
  created:  'Pending',
  failed:   'Failed',
  refunded: 'Refunded',
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function InvoicePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'All' | PayStatus>('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/academy/payment/list');
      const data = await res.json();
      if (data.success) setPayments(data.payments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === 'All' ? payments : payments.filter(p => p.status === filter);

  const paidPayments = payments.filter(p => p.status === 'paid');
  const grossRev     = paidPayments.reduce((s, p) => s + p.total_inr, 0);
  const pendingRev   = payments.filter(p => p.status === 'created').reduce((s, p) => s + p.total_inr, 0);

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Records</h1>
          <p className="text-sm text-slate-400 mt-0.5">EPR Academy · Razorpay Transactions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/academy/enroll"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">
            + New Enrolment
          </Link>
          <Link href="/academy/finance" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">← Finance</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: String(payments.length),        color: 'text-slate-200' },
          { label: 'Gross Revenue',      value: fmt(grossRev),                  color: 'text-emerald-400' },
          { label: 'Pending',            value: fmt(pendingRev),                color: 'text-amber-400' },
          { label: 'Failed',             value: String(payments.filter(p => p.status === 'failed').length), color: 'text-rose-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {(['All', 'paid', 'created', 'failed', 'refunded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] font-medium transition capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {f === 'All' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{visible.length} records</span>
        <button onClick={load} className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition">↻ Refresh</button>
      </div>

      {/* Table */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Order ID', 'Participant', 'Programme', 'Subtotal', 'GST', 'Total', 'Promo', 'Partner', 'Date', 'Status', 'Razorpay ID'].map(h => (
                  <th key={h} className="text-left text-[11px] text-slate-500 uppercase py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={11} className="py-12 text-center text-slate-500 text-sm">Loading…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={11} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              ) : visible.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4 text-indigo-400 text-xs font-mono whitespace-nowrap">{p.razorpay_order_id.slice(-10)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="text-xs font-medium text-slate-200">{p.participant_name}</p>
                    <p className="text-[11px] text-slate-500">{p.participant_email}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 max-w-[160px] truncate">{p.program_title}</td>
                  <td className="py-3 px-4 text-slate-300 text-xs whitespace-nowrap">{fmt(p.subtotal_inr)}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{fmt(p.gst_amount_inr)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200 text-xs whitespace-nowrap">{fmt(p.total_inr)}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{p.promo_code || '—'}</td>
                  <td className="py-3 px-4 text-xs text-violet-400">{p.partner_code || '—'}</td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {p.paid_at ? fmtDate(p.paid_at) : fmtDate(p.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {p.razorpay_payment_id ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
