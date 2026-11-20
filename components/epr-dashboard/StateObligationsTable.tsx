'use client';

import { useMemo, useState } from 'react';
import type { StateObligation, EprType } from '@/lib/epr/eprDashboardService';

interface Props {
  rows: StateObligation[];
}

type SortKey = 'state' | 'gap' | 'pct_fulfilled';

export default function StateObligationsTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('gap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<EprType | ''>('');

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.epr_type))).sort(),
    [rows]
  );

  const sorted = useMemo(() => {
    const filtered = filterType ? rows.filter((r) => r.epr_type === filterType) : rows;
    return [...filtered].sort((a, b) => {
      const av = sortKey === 'state' ? a.state : a[sortKey];
      const bv = sortKey === 'state' ? b.state : b[sortKey];
      const cmp =
        typeof av === 'string'
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, filterType, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          State-wise Obligations
        </h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as EprType | '')}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Filter by EPR category"
        >
          <option value="">All Categories</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No state-wise data for this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th
                  className="cursor-pointer pb-2 pr-3 font-medium"
                  onClick={() => toggleSort('state')}
                >
                  State <SortIcon k="state" />
                </th>
                <th className="pb-2 pr-3 font-medium">Category</th>
                <th className="pb-2 pr-3 font-medium text-right">Liability</th>
                <th className="pb-2 pr-3 font-medium text-right">Fulfilled</th>
                <th
                  className="cursor-pointer pb-2 pr-3 font-medium text-right"
                  onClick={() => toggleSort('gap')}
                >
                  Gap <SortIcon k="gap" />
                </th>
                <th
                  className="cursor-pointer pb-2 font-medium"
                  onClick={() => toggleSort('pct_fulfilled')}
                >
                  % Done <SortIcon k="pct_fulfilled" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={`${row.state}-${row.epr_type}`}
                  className={`border-t border-gray-100 dark:border-gray-800 ${
                    row.critical ? 'bg-red-50 dark:bg-red-950/20' : ''
                  }`}
                >
                  <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">
                    {row.state}
                    {row.critical && (
                      <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        Critical
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{row.epr_type}</td>
                  <td className="py-2 pr-3 text-right text-gray-700 dark:text-gray-300">
                    {row.liability.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 pr-3 text-right text-emerald-700">
                    {row.fulfilled.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 pr-3 text-right text-red-600">
                    {row.gap.toLocaleString('en-IN')}
                  </td>
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
