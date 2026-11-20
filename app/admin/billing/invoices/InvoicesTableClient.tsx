'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

export default function InvoicesTableClient({ initialRows }: { initialRows: any[] }) {
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (initialRows || []).filter((row) => {
      const matchStatus = status === 'All' || row.status === status;
      const matchSearch =
        !q ||
        String(row.invoice_no || '').toLowerCase().includes(q) ||
        String(row.client_name || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [initialRows, status, search]);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoice/client"
          className="input"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input"
        >
          {['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="py-2 pr-3">Invoice</th>
              <th className="py-2 pr-3">Client</th>
              <th className="py-2 pr-3">Service</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Due</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-slate-800/60">
                <td className="py-2 pr-3 font-medium text-slate-100">{row.invoice_no}</td>
                <td className="py-2 pr-3 text-slate-200">{row.client_name}</td>
                <td className="py-2 pr-3 text-slate-200">{row.service_name}</td>
                <td className="py-2 pr-3 text-slate-200">{formatINR(Number(row.total_inr || 0))}</td>
                <td className="py-2 pr-3 text-slate-200">{row.due_date}</td>
                <td className="py-2 pr-3">
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200">{row.status}</span>
                </td>
                <td className="py-2">
                  <Link href={`/admin/billing/${row.id}`} className="text-blue-300 hover:text-blue-300">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {filtered.map((row) => (
          <article key={row.id} className="rounded-lg border border-slate-800 p-3">
            <p className="text-sm font-semibold text-slate-100">{row.invoice_no}</p>
            <p className="text-xs text-slate-400">{row.client_name} • {row.service_name}</p>
            <p className="mt-1 text-xs text-slate-400">Total: {formatINR(Number(row.total_inr || 0))}</p>
            <p className="text-xs text-slate-400">Due: {row.due_date}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200">{row.status}</span>
              <Link href={`/admin/billing/${row.id}`} className="text-xs font-semibold text-blue-300">Open</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
