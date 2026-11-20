'use client';

import { useMemo, useState } from 'react';
import type { ProductBreakdown, EprType } from '@/lib/epr/eprDashboardService';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

interface Props {
  rows: ProductBreakdown[];
  canExport?: boolean;
}

export default function ProductBreakdownTable({ rows, canExport = true }: Props) {
  const [filterType, setFilterType] = useState<EprType | ''>('');

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.epr_type))).sort(),
    [rows]
  );

  const filtered = useMemo(
    () => (filterType ? rows.filter((r) => r.epr_type === filterType) : rows),
    [rows, filterType]
  );

  function exportCSV() {
    const header = 'EPR Type,Product Type,Liability,Fulfilled,Gap,% Fulfilled,Unit';
    const csvRows = filtered.map((r) =>
      [
        r.epr_type,
        r.product_type,
        r.liability,
        r.fulfilled,
        r.gap,
        r.pct_fulfilled,
        r.unit,
      ].join(',')
    );
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epr_product_breakdown.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Product-wise Breakdown
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EprType | '')}
            className="rounded-md border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-label="Filter by EPR category"
          >
            <option value="">All Categories</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {canExport && FEATURE_FLAGS.EPR_DASHBOARD_EXPORT_ENABLED && (
            <button
              onClick={exportCSV}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              aria-label="Download CSV"
            >
              ↓ CSV
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-400">No product data available.</p>
          <p className="mt-1 text-xs text-gray-400">Upload your EPR data to see product breakdown.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-3 font-medium">Category</th>
                <th className="pb-2 pr-3 font-medium">Product Type</th>
                <th className="pb-2 pr-3 font-medium text-right">Liability</th>
                <th className="pb-2 pr-3 font-medium text-right">Fulfilled</th>
                <th className="pb-2 pr-3 font-medium text-right">Gap</th>
                <th className="pb-2 pr-3 font-medium">Unit</th>
                <th className="pb-2 font-medium">% Done</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={`${row.epr_type}-${row.product_type}`}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{row.epr_type}</td>
                  <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">
                    {row.product_type}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-700 dark:text-gray-300">
                    {row.liability.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 pr-3 text-right text-emerald-700">
                    {row.fulfilled.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 pr-3 text-right text-red-600">
                    {row.gap.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{row.unit}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className={`h-1.5 rounded-full ${
                            row.pct_fulfilled >= 90
                              ? 'bg-emerald-500'
                              : row.pct_fulfilled >= 60
                              ? 'bg-amber-400'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, row.pct_fulfilled)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {row.pct_fulfilled}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
