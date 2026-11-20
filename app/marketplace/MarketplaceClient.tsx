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

function firstName(contact?: string, fallback?: string) {
  const base = (contact || '').trim();
  if (base) return base.split(/\s+/)[0];
  return (fallback || 'Recycler').split(/\s+/)[0];
}

function statusClass(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Sold') return 'bg-slate-100 text-slate-700';
  if (status === 'Expired') return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

export default function MarketplaceClient({
  role,
  buyerClientId,
  initialListings,
  initialMonthTransactions
}: {
  role: string;
  buyerClientId: string | null;
  initialListings: any[];
  initialMonthTransactions: any[];
}) {
  const [listings, setListings] = useState(initialListings || []);
  const [filters, setFilters] = useState({ waste_category: 'All', credit_type: 'All', min_qty: '', max_rate: '' });
  const [qtyById, setQtyById] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => {
    const categories = Array.from(new Set((listings || []).map((r) => r.waste_category).filter(Boolean))).sort();
    const creditTypes = Array.from(new Set((listings || []).map((r) => r.credit_type).filter(Boolean))).sort();
    return { categories, creditTypes };
  }, [listings]);

  const filtered = useMemo(() => {
    return (listings || []).filter((row) => {
      const categoryOk = filters.waste_category === 'All' || row.waste_category === filters.waste_category;
      const typeOk = filters.credit_type === 'All' || row.credit_type === filters.credit_type;
      const rowQtyKg = Number(row.quantity_available_kg || (Number(row.quantity_available_mt || 0) * 1000));
      const rowRatePerKg = Number(row.rate_per_kg_inr || (Number(row.rate_per_mt_inr || 0) / 1000));
      const minQtyOk = !filters.min_qty || rowQtyKg >= Number(filters.min_qty);
      const maxRateOk = !filters.max_rate || rowRatePerKg <= Number(filters.max_rate);
      return categoryOk && typeOk && minQtyOk && maxRateOk;
    });
  }, [listings, filters]);

  const kpis = useMemo(() => {
    const active = (listings || []).filter((row) => row.status === 'Active');
    const availableCreditsKg = active.reduce((sum, row) => sum + Number(row.quantity_available_kg || (Number(row.quantity_available_mt || 0) * 1000)), 0);
    const avgRate = active.length
      ? active.reduce((sum, row) => sum + Number(row.rate_per_kg_inr || (Number(row.rate_per_mt_inr || 0) / 1000)), 0) / active.length
      : 0;
    return {
      availableCreditsKg,
      activeListings: active.length,
      avgRate,
      txThisMonth: (initialMonthTransactions || []).length
    };
  }, [listings, initialMonthTransactions]);

  async function requestBuy(row: any) {
    if (!buyerClientId) {
      setError('No client profile linked to this account.');
      return;
    }

    const minOrderKg = Number(row.min_order_kg || (Number(row.min_order_mt || 0) * 1000) || 1);
    const availableKg = Number(row.quantity_available_kg || (Number(row.quantity_available_mt || 0) * 1000));
    const qty = Number(qtyById[row.id] || minOrderKg);
    if (qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (qty < minOrderKg) {
      setError(`Minimum order for this listing is ${minOrderKg} KG.`);
      return;
    }

    if (qty > availableKg) {
      setError('Requested quantity exceeds available quantity.');
      return;
    }

    setWorkingId(row.id);
    setError(null);
    setMessage(null);

    try {
      const ratePerKg = Number(row.rate_per_kg_inr || (Number(row.rate_per_mt_inr || 0) / 1000));
      const ratePerMt = ratePerKg * 1000;
      const total = Number((qty * ratePerKg).toFixed(2));
      const fee = Number((total * 0.02).toFixed(2));

      const { error: insertError } = await (supabase as any)
        .from('credit_transactions')
        .insert({
          listing_id: row.id,
          buyer_client_id: buyerClientId,
          seller_recycler_id: row.recycler_id,
          waste_category: row.waste_category,
          quantity_kg: qty,
          quantity_mt: qty / 1000,
          agreed_rate_per_kg_inr: ratePerKg,
          agreed_rate_inr: ratePerMt,
          total_value_inr: total,
          platform_fee_inr: fee,
          status: 'Requested',
          notes: 'Requested from marketplace'
        });

      if (insertError) throw insertError;
      setMessage('Buy request submitted successfully.');
    } catch (err: any) {
      setError(err?.message || 'Could not submit request.');
    } finally {
      setWorkingId(null);
    }
  }

  async function approveRequest(row: any) {
    setWorkingId(row.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/marketplace/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transactionId: row.requested_tx_id })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Could not approve request');

      setListings((prev) => prev.map((item) => {
        if (item.id !== row.id) return item;
        const requestedKg = Number(item.requested_qty_kg || 0);
        const currentKg = Number(item.quantity_available_kg || (Number(item.quantity_available_mt || 0) * 1000));
        const nextQty = currentKg - requestedKg;
        return {
          ...item,
          quantity_available_kg: Math.max(nextQty, 0),
          quantity_available_mt: Math.max(nextQty, 0) / 1000,
          status: nextQty <= 0 ? 'Sold' : item.status,
          requested_tx_id: null,
          requested_qty_kg: null
        };
      }));

      setMessage(`Transaction approved and completed. Alerts triggered: ${Number(payload?.alertsTriggered || 0)}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not approve request.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">EPR Credit Marketplace</h1>
            <p className="mt-1 text-sm text-gray-600">Browse listings and request/approve trades.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace/requirements" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Requirements Board</Link>
            <Link href="/marketplace/price-history" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Price History</Link>
            {['admin', 'manager'].includes(role) ? <Link href="/marketplace/transactions" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Transactions</Link> : null}
            {['admin', 'manager'].includes(role) ? <Link href="/marketplace/listings" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Listings</Link> : null}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Available Credits KG</p><p className="mt-2 text-2xl font-semibold text-gray-900">{Number(kpis.availableCreditsKg || 0).toLocaleString('en-IN')}</p></article>
        <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Active Listings</p><p className="mt-2 text-2xl font-semibold text-gray-900">{kpis.activeListings}</p></article>
        <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Avg Rate ₹/KG</p><p className="mt-2 text-2xl font-semibold text-gray-900">{formatINR(kpis.avgRate)}</p></article>
        <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Transactions This Month</p><p className="mt-2 text-2xl font-semibold text-gray-900">{kpis.txThisMonth}</p></article>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <select value={filters.waste_category} onChange={(e) => setFilters((p) => ({ ...p, waste_category: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Category: All</option>
          {options.categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={filters.credit_type} onChange={(e) => setFilters((p) => ({ ...p, credit_type: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Credit Type: All</option>
          {options.creditTypes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={filters.min_qty} onChange={(e) => setFilters((p) => ({ ...p, min_qty: e.target.value }))} placeholder="Min Qty (KG)" type="number" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input value={filters.max_rate} onChange={(e) => setFilters((p) => ({ ...p, max_rate: e.target.value }))} placeholder="Max Rate (₹/KG)" type="number" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </section>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row) => {
          const recyclerName = row.recyclers?.company_name || 'Recycler';
          const recyclerDisplay = ['admin', 'manager'].includes(role)
            ? recyclerName
            : firstName(row.recyclers?.contact_person, recyclerName);

          return (
            <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{row.waste_category}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(row.status)}`}>{row.status}</span>
              </div>

              <p className="mt-2 text-sm font-semibold text-gray-900">{row.credit_type}</p>
              <p className="mt-1 text-sm text-gray-700">Quantity: {Number(row.quantity_available_kg || (Number(row.quantity_available_mt || 0) * 1000)).toLocaleString('en-IN')} KG</p>
              <p className="text-sm text-gray-700">Rate: {formatINR(Number(row.rate_per_kg_inr || (Number(row.rate_per_mt_inr || 0) / 1000)))} / KG</p>
              <p className="text-sm text-gray-700">Recycler: {recyclerDisplay}</p>
              <p className="text-xs text-gray-600">Validity: {row.validity_date || '-'}</p>

              {role === 'client' ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    min={Number(row.min_order_kg || (Number(row.min_order_mt || 0) * 1000) || 1)}
                    step="0.001"
                    value={qtyById[row.id] || ''}
                    onChange={(e) => setQtyById((p) => ({ ...p, [row.id]: e.target.value }))}
                    placeholder={`Qty (min ${Number(row.min_order_kg || (Number(row.min_order_mt || 0) * 1000) || 1)} KG)`}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    disabled={workingId === row.id || row.status !== 'Active'}
                    onClick={() => requestBuy(row)}
                    className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {workingId === row.id ? 'Submitting...' : 'Request to Buy'}
                  </button>
                </div>
              ) : null}

              {['admin', 'manager'].includes(role) && row.requested_tx_id ? (
                <button
                  disabled={workingId === row.id}
                  onClick={() => approveRequest(row)}
                  className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {workingId === row.id ? 'Approving...' : 'Approve'}
                </button>
              ) : null}
            </article>
          );
        })}
      </section>

      {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No listings found for current filters.</p> : null}
    </main>
  );
}
