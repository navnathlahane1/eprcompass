'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface PaymentRow {
  id: string;
  invoice_no: string;
  client_id: string;
  client_name: string;
  total_inr: number;
  status: string;
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  days_overdue: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-slate-700/60 text-slate-400',
  sent:     'bg-blue-500/20 text-blue-300',
  paid:     'bg-emerald-500/20 text-emerald-300',
  overdue:  'bg-rose-500/20 text-rose-300',
  cancelled:'bg-slate-600/30 text-slate-500',
};

function fmt(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function PaymentsPage() {
  const [rows,    setRows]    = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('active');
  const [marking, setMarking] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/finance/payments?status=${filter}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setRows(d.payments ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function markPaid(id: string) {
    if (!confirm('Mark this invoice as paid? This will trigger IAM to create the client portal login.')) return;
    setMarking(id);
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setMarking(null);
    }
  }

  const overdueRows = rows.filter(r => r.status === 'overdue');
  const sentRows    = rows.filter(r => r.status === 'sent');
  const totalOutstanding = rows
    .filter(r => !['paid', 'cancelled'].includes(r.status))
    .reduce((s, r) => s + r.total_inr, 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Payment Tracker</h1>
        <p className="mt-0.5 text-sm text-slate-500">Track outstanding and overdue payments</p>
      </div>

      {/* Summary strip */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Outstanding', value: fmt(totalOutstanding),       color: 'text-amber-400',   bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Sent (Awaiting)',   value: String(sentRows.length),     color: 'text-blue-400',    bg: 'bg-blue-500/10',  border: 'border-blue-500/20' },
            { label: 'Overdue',           value: String(overdueRows.length),  color: overdueRows.length ? 'text-rose-400' : 'text-slate-500', bg: overdueRows.length ? 'bg-rose-500/10' : 'bg-slate-800/30', border: overdueRows.length ? 'border-rose-500/20' : 'border-slate-800/40' },
            { label: 'Invoices Shown',    value: String(rows.length),         color: 'text-slate-300',   bg: 'bg-slate-800/30', border: 'border-slate-800/40' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-3`}>
              <p className="text-[10px] text-slate-600">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 p-1 w-fit flex-wrap">
        {[
          { key: 'active', label: 'Active' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'paid',   label: 'Paid' },
          { key: 'all',    label: 'All' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${filter === f.key ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Overdue alert */}
      {filter !== 'paid' && overdueRows.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-rose-400">
            <span className="font-bold">{overdueRows.length} invoice{overdueRows.length !== 1 ? 's are' : ' is'} overdue.</span>
            {' '}Follow up with clients and mark as paid once payment is received.
          </p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-16 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto mb-3 h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm text-slate-500">No {filter === 'active' ? 'active' : filter} payments</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Invoice</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Client</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Due / Paid</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Overdue</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {rows.map(row => (
                  <tr key={row.id} className={`transition hover:bg-slate-800/20 ${row.status === 'overdue' ? 'bg-rose-500/3' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/finance/invoices/${row.id}`} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition">
                        {row.invoice_no}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{row.client_name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold tabular-nums text-slate-100">{fmt(row.total_inr)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[row.status] || 'bg-slate-700/50 text-slate-400'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.status === 'paid' ? (
                        <span className="text-emerald-400">{fmtDate(row.paid_date)}</span>
                      ) : (
                        <span className={row.status === 'overdue' ? 'text-rose-400 font-semibold' : ''}>
                          {fmtDate(row.due_date)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.days_overdue !== null && row.days_overdue > 0 ? (
                        <span className="text-xs font-bold text-rose-400">{row.days_overdue}d</span>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(row.status === 'sent' || row.status === 'overdue') && (
                          <button
                            onClick={() => markPaid(row.id)}
                            disabled={marking === row.id}
                            className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60">
                            {marking === row.id
                              ? <span className="h-3 w-3 animate-spin rounded-full border border-emerald-300 border-t-transparent" />
                              : '✓'}
                            Paid
                          </button>
                        )}
                        <Link href={`/finance/invoices/${row.id}`}
                          className="rounded-md border border-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-slate-700 hover:text-slate-300">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
