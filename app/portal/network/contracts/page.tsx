'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { ContractStatusBadge } from '@/components/recycler-network/ContractStatusBadge';
import { summarizeContracts } from '@/lib/recyclerNetwork/recyclerNetworkService';
import type { ContractRow } from '@/lib/recyclerNetwork/recyclerNetworkService';

interface Contract extends ContractRow {
  recyclers?: { name: string; recycler_code: string };
}

const STAT_COLORS: Record<string, string> = {
  active:        'bg-green-100 text-green-700',
  expiring_soon: 'bg-amber-100 text-amber-700',
  expired:       'bg-red-100 text-red-700',
  draft:         'bg-slate-100 text-slate-600',
  terminated:    'bg-red-50 text-red-500',
};

export default function NetworkContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/network/contracts?${params}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const { contracts: data } = await res.json();
      setContracts(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const summary = summarizeContracts(contracts);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(summary).filter(([k]) => ['active', 'expiring_soon', 'draft', 'expired'].includes(k)).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className={`text-xs font-semibold uppercase tracking-wide ${(STAT_COLORS[key] ?? '').split(' ')[1]}`}>
              {key.replace('_', ' ')}
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{count}</p>
          </div>
        ))}
      </div>

      {/* Filter + new */}
      <div className="flex items-center justify-between gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="TERMINATED">Terminated</option>
        </select>

        <Link
          href="/portal/network/contracts/new"
          className="flex items-center gap-1.5 rounded-lg bg-eco-green-5 px-4 py-2 text-sm font-medium text-white hover:bg-eco-green-4 focus:outline-none focus:ring-2 focus:ring-eco-green-5"
        >
          <Plus className="h-4 w-4" /> New Contract
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {error}
          <button onClick={load} className="ml-2 underline">Retry</button>
        </div>
      )}

      {loading && !contracts.length && (
        <div className="flex items-center gap-2 py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading contracts…
        </div>
      )}

      {!loading && !contracts.length && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 font-semibold text-slate-600">No contracts yet</p>
          <p className="mt-1 text-sm text-slate-400">Create your first contract with a linked recycler.</p>
        </div>
      )}

      {/* Table */}
      {contracts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="px-4 py-3">Contract #</th>
                <th className="px-4 py-3">Recycler</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700">
                  <td className="px-4 py-3 font-mono text-xs">{c.contract_number}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {c.recyclers?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.epr_category}</td>
                  <td className="px-4 py-3">
                    <ContractStatusBadge status={c.status} endDate={c.end_date} renewalNoticeDays={c.renewal_notice_days} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {c.end_date ? new Date(c.end_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/portal/network/contracts/${c.id}`} className="text-eco-green-5 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
