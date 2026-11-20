'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

function formatINR(value: number) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

export default function TransactionsClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [filters, setFilters] = useState({ status: 'All', category: 'All', fromDate: '', toDate: '' });
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (rows || []).filter((row) => {
      const statusOk = filters.status === 'All' || row.status === filters.status;
      const categoryOk = filters.category === 'All' || row.waste_category === filters.category;
      const fromOk = !filters.fromDate || new Date(row.requested_at) >= new Date(`${filters.fromDate}T00:00:00Z`);
      const toOk = !filters.toDate || new Date(row.requested_at) <= new Date(`${filters.toDate}T23:59:59Z`);
      return statusOk && categoryOk && fromOk && toOk;
    });
  }, [rows, filters]);

  const statusOptions = Array.from(new Set((rows || []).map((row) => row.status).filter(Boolean))).sort();

  async function approve(id: string) {
    setWorkingId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/marketplace/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transactionId: id })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Could not approve transaction');

      setRows((prev) => prev.map((row) => (
        row.id === id
          ? { ...row, status: 'Completed', approved_at: new Date().toISOString(), completed_at: new Date().toISOString() }
          : row
      )));
      setMessage(`Transaction approved and completed successfully. Alerts triggered: ${Number(payload?.alertsTriggered || 0)}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not approve transaction.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Marketplace Transactions</h1>
            <p className="mt-1 text-sm text-gray-600">Manual approval workflow for requested trades.</p>
          </div>
          <Link href="/marketplace" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back to Marketplace</Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Status: All</option>
          {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Category: All</option>
          {['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="date" value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </section>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Recycler</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Qty (KG)</th>
              <th className="px-4 py-3">Rate (₹/KG)</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-700">{row.buyer_name}</td>
                <td className="px-4 py-3 text-gray-700">{row.recycler_name}</td>
                <td className="px-4 py-3 text-gray-700">{row.waste_category}</td>
                <td className="px-4 py-3 text-gray-700">{Number(row.quantity_kg || (Number(row.quantity_mt || 0) * 1000)).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-gray-700">{formatINR(Number(row.agreed_rate_per_kg_inr || (Number(row.agreed_rate_inr || 0) / 1000)))}</td>
                <td className="px-4 py-3 text-gray-700">{formatINR(Number(row.total_value_inr || 0))}</td>
                <td className="px-4 py-3 text-gray-700">{formatINR(Number(row.platform_fee_inr || 0))}</td>
                <td className="px-4 py-3 text-gray-700">{row.status}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(row.requested_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  {row.status === 'Requested' ? (
                    <button
                      onClick={() => approve(row.id)}
                      disabled={workingId === row.id}
                      className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {workingId === row.id ? 'Approving...' : 'Approve'}
                    </button>
                  ) : <span className="text-xs text-gray-500">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2 sm:hidden">
        {filtered.map((row) => (
          <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
            <p className="font-semibold text-gray-900">{row.waste_category} | {Number(row.quantity_kg || (Number(row.quantity_mt || 0) * 1000)).toLocaleString('en-IN')} KG</p>
            <p className="text-xs text-gray-600">Buyer: {row.buyer_name}</p>
            <p className="text-xs text-gray-600">Recycler: {row.recycler_name}</p>
            <p className="text-xs text-gray-600">Rate: {formatINR(Number(row.agreed_rate_per_kg_inr || (Number(row.agreed_rate_inr || 0) / 1000)))}/KG</p>
            <p className="text-xs text-gray-600">Total: {formatINR(Number(row.total_value_inr || 0))}</p>
            <p className="text-xs text-gray-600">Fee: {formatINR(Number(row.platform_fee_inr || 0))}</p>
            <p className="text-xs text-gray-600">Status: {row.status}</p>
            <p className="text-xs text-gray-600">Date: {new Date(row.requested_at).toLocaleDateString('en-IN')}</p>
            {row.status === 'Requested' ? (
              <button onClick={() => approve(row.id)} disabled={workingId === row.id} className="mt-2 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{workingId === row.id ? 'Approving...' : 'Approve'}</button>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
