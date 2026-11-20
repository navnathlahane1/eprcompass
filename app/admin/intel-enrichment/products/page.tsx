'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type Product = {
  id: string;
  company_id: string;
  product_name: string;
  activity_type: string;
  brand_name: string | null;
  confidence: number;
  extraction_source: string;
  is_verified: boolean;
  is_flagged: boolean;
  source_snippet: string | null;
  created_at: string;
  intel_companies?: { canonical_name: string; state: string | null } | null;
};

type ProductsResponse = {
  products: Product[];
  total: number;
};

export default function IntelProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [unverifiedOnly, setUnverifiedOnly] = useState(true);
  const BASE = getIntelApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: '100' });
      if (activityFilter) params.set('activity_type', activityFilter);
      if (flaggedOnly) params.set('flagged_only', 'true');
      if (unverifiedOnly) params.set('unverified_only', 'true');
      const res = await fetch(`${BASE}/intel/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProductsResponse = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [BASE, activityFilter, flaggedOnly, unverifiedOnly]);

  useEffect(() => { load(); }, [load]);

  async function patchProduct(product: Product, patch: Record<string, unknown>) {
    setActionBusy(product.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in.');
      const res = await fetch(
        `${BASE}/intel/companies/${product.company_id}/products/${product.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, ...patch } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/intel-enrichment" className="text-xs text-teal-400 hover:underline">
            ← Control Center
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-100">Product Intelligence</h1>
          <p className="mt-0.5 text-sm text-slate-400">Review and verify AI-extracted product records</p>
        </div>
        <button onClick={load} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-600">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
        >
          <option value="">All activity types</option>
          {['manufactured','imported','sold','serviced','branded'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={unverifiedOnly}
            onChange={(e) => setUnverifiedOnly(e.target.checked)}
            className="rounded border-slate-600"
          />
          Unverified only
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="rounded border-slate-600"
          />
          Flagged only
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
          {loading ? 'Loading…' : `${total} products`}
        </div>
        {!loading && products.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No products matching filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const company = p.intel_companies as any;
                  const busy = actionBusy === p.id;
                  return (
                    <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                      <td className="px-4 py-2">
                        <Link href={`/intel/companies/${p.company_id}`} className="font-medium text-teal-300 hover:underline text-xs">
                          {company?.canonical_name || p.company_id.slice(0, 8)}
                        </Link>
                        {company?.state && <p className="text-[10px] text-slate-500">{company.state}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-sm text-slate-100">{p.product_name}</p>
                        {p.brand_name && <p className="text-[11px] text-slate-400">{p.brand_name}</p>}
                        {p.is_flagged && (
                          <span className="rounded border border-orange-700/50 bg-orange-500/10 px-1 py-0.5 text-[9px] text-orange-300">Flagged</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs capitalize text-slate-400">{p.activity_type}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className={p.confidence >= 0.8 ? 'text-emerald-300' : p.confidence >= 0.6 ? 'text-amber-300' : 'text-red-300'}>
                          {Math.round(p.confidence * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">{p.extraction_source}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1.5">
                          {!p.is_verified && (
                            <button
                              disabled={busy}
                              onClick={() => patchProduct(p, { is_verified: true })}
                              className="rounded border border-emerald-700/50 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              {busy ? '…' : 'Verify'}
                            </button>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => patchProduct(p, { is_flagged: !p.is_flagged })}
                            className="rounded border border-slate-700 bg-slate-800/50 px-2 py-1 text-[10px] text-slate-400 hover:border-orange-700/50 hover:text-orange-300 disabled:opacity-50"
                          >
                            {p.is_flagged ? 'Unflag' : 'Flag'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
