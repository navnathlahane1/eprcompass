'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getAllowedCreditTypes, normalizeCreditType } from '../../../lib/marketplace/creditTaxonomy.js';

export default function ListingsClient({ initialRows, recyclerOptions }: { initialRows: any[]; recyclerOptions: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [form, setForm] = useState({
    recycler_id: recyclerOptions?.[0]?.id || '',
    waste_category: 'Plastic',
    credit_type: 'CAT1',
    quantity_available_kg: 1000,
    rate_per_kg_inr: 12,
    min_order_kg: 100,
    validity_date: '',
    cpcb_cert_ref: '',
    status: 'Active'
  });

  const recyclerMap = useMemo(() => new Map((recyclerOptions || []).map((r) => [r.id, r])), [recyclerOptions]);

  async function addListing(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const normalizedCreditType = normalizeCreditType(form.waste_category, form.credit_type);
      const payload = {
        recycler_id: form.recycler_id,
        waste_category: form.waste_category,
        credit_type: normalizedCreditType,
        quantity_available_kg: Number(form.quantity_available_kg || 0),
        quantity_available_mt: Number(form.quantity_available_kg || 0) / 1000,
        rate_per_kg_inr: Number(form.rate_per_kg_inr || 0),
        rate_per_mt_inr: Number(form.rate_per_kg_inr || 0) * 1000,
        min_order_kg: Number(form.min_order_kg || 1),
        min_order_mt: Number(form.min_order_kg || 1) / 1000,
        validity_date: form.validity_date || null,
        cpcb_cert_ref: form.cpcb_cert_ref || null,
        status: form.status
      };

      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create listing');
      setRows((prev) => [json.listing, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Could not create listing');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: any) {
    setEditingId(row.id);
    setEditForm({
      quantity_available_kg: row.quantity_available_kg,
      rate_per_kg_inr: row.rate_per_kg_inr,
      min_order_kg: row.min_order_kg,
      validity_date: row.validity_date || '',
      cpcb_cert_ref: row.cpcb_cert_ref || '',
      status: row.status
    });
  }

  async function saveEdit(rowId: string) {
    const { error } = await (supabase as any)
      .from('credit_listings')
      .update({
        quantity_available_kg: Number(editForm.quantity_available_kg || 0),
        quantity_available_mt: Number(editForm.quantity_available_kg || 0) / 1000,
        rate_per_kg_inr: Number(editForm.rate_per_kg_inr || 0),
        rate_per_mt_inr: Number(editForm.rate_per_kg_inr || 0) * 1000,
        min_order_kg: Number(editForm.min_order_kg || 1),
        min_order_mt: Number(editForm.min_order_kg || 1) / 1000,
        validity_date: editForm.validity_date || null,
        cpcb_cert_ref: editForm.cpcb_cert_ref || null,
        status: editForm.status
      })
      .eq('id', rowId);

    if (error) return;

    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...editForm } : row)));
    setEditingId(null);
    setEditForm({});
  }

  async function withdraw(id: string) {
    const { error } = await (supabase as any)
      .from('credit_listings')
      .update({ status: 'Withdrawn' })
      .eq('id', id);

    if (error) return;
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'Withdrawn' } : row)));
  }

  return (
    <main className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Marketplace Listings</h1>
            <p className="mt-1 text-sm text-gray-600">Create and manage recycler credit listings.</p>
          </div>
          <Link href="/marketplace" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back to Marketplace</Link>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Add Listing</h2>
        <form onSubmit={addListing} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <select value={form.recycler_id} onChange={(e) => setForm((p) => ({ ...p, recycler_id: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            {(recyclerOptions || []).map((r) => <option key={r.id} value={r.id}>{r.company_name || r.contact_person || r.id}</option>)}
          </select>
          <select
            value={form.waste_category}
            onChange={(e) => {
              const wasteCategory = e.target.value;
              setForm((p) => ({
                ...p,
                waste_category: wasteCategory,
                credit_type: normalizeCreditType(wasteCategory, p.credit_type)
              }));
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={form.credit_type} onChange={(e) => setForm((p) => ({ ...p, credit_type: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            {getAllowedCreditTypes(form.waste_category).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" step="0.001" value={form.quantity_available_kg} onChange={(e) => setForm((p) => ({ ...p, quantity_available_kg: Number(e.target.value) }))} placeholder="Total Available (KG)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" step="0.0001" value={form.rate_per_kg_inr} onChange={(e) => setForm((p) => ({ ...p, rate_per_kg_inr: Number(e.target.value) }))} placeholder="Rate ₹/KG" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" step="0.001" value={form.min_order_kg} onChange={(e) => setForm((p) => ({ ...p, min_order_kg: Number(e.target.value) }))} placeholder="Min Chunk (KG)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" value={form.validity_date} onChange={(e) => setForm((p) => ({ ...p, validity_date: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.cpcb_cert_ref} onChange={(e) => setForm((p) => ({ ...p, cpcb_cert_ref: e.target.value }))} placeholder="CPCB Cert Ref" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <button disabled={saving} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 md:col-span-4">{saving ? 'Saving...' : 'Add Listing'}</button>
        </form>
        <p className="mt-3 text-xs text-gray-500">List each category inventory in KG and let buyers purchase chunk quantities based on your minimum chunk setting.</p>
      </section>

      <section className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3">Recycler</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-700">{recyclerMap.get(row.recycler_id)?.company_name || recyclerMap.get(row.recycler_id)?.contact_person || row.recycler_id}</td>
                <td className="px-4 py-3 text-gray-700">{row.waste_category}</td>
                <td className="px-4 py-3 text-gray-700">{row.credit_type}</td>
                {editingId === row.id ? (
                  <>
                    <td className="px-4 py-3"><input type="number" step="0.001" value={editForm.quantity_available_kg || 0} onChange={(e) => setEditForm((p: any) => ({ ...p, quantity_available_kg: Number(e.target.value) }))} className="w-28 rounded border border-gray-300 px-2 py-1" /></td>
                    <td className="px-4 py-3"><input type="number" step="0.0001" value={editForm.rate_per_kg_inr || 0} onChange={(e) => setEditForm((p: any) => ({ ...p, rate_per_kg_inr: Number(e.target.value) }))} className="w-24 rounded border border-gray-300 px-2 py-1" /></td>
                    <td className="px-4 py-3"><input type="date" value={editForm.validity_date || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, validity_date: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" /></td>
                    <td className="px-4 py-3">
                      <select value={editForm.status || 'Active'} onChange={(e) => setEditForm((p: any) => ({ ...p, status: e.target.value }))} className="rounded border border-gray-300 px-2 py-1">
                        {['Active', 'Sold', 'Expired', 'Withdrawn'].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(row.id)} className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Save</button>
                        <button onClick={() => setEditingId(null)} className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-700">{Number(row.quantity_available_kg || 0).toLocaleString('en-IN')} KG</td>
                    <td className="px-4 py-3 text-gray-700">₹{Number(row.rate_per_kg_inr || 0).toLocaleString('en-IN')}/KG</td>
                    <td className="px-4 py-3 text-gray-700">{row.validity_date || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(row)} className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700">Edit</button>
                        {row.status === 'Active' ? <button onClick={() => withdraw(row.id)} className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700">Withdraw</button> : null}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
