'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { EprTypeSummary } from '@/lib/epr/eprDashboardService';

interface Props {
  summaries: EprTypeSummary[];
  aggregate: { total_liability: number; total_fulfilled: number; gap: number; pct_fulfilled: number };
}

function pctColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function pctText(pct: number) {
  if (pct >= 90) return 'text-emerald-700';
  if (pct >= 60) return 'text-amber-700';
  return 'text-red-700';
}

export default function LiabilityFulfillmentCard({ summaries, aggregate }: Props) {
  const chartData = summaries.map((s) => ({
    name: s.label.replace(' EPR', ''),
    Liability: s.total_liability,
    Fulfilled: s.total_fulfilled,
    Gap: s.gap,
  }));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Liability vs Fulfillment
      </h2>

      {/* Bar chart */}
      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
            <Legend />
            <Bar dataKey="Liability" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Fulfilled" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Gap" fill="#f87171" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-type rows */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-3 font-medium">Category</th>
              <th className="pb-2 pr-3 font-medium text-right">Liability</th>
              <th className="pb-2 pr-3 font-medium text-right">Fulfilled</th>
              <th className="pb-2 pr-3 font-medium text-right">Gap</th>
              <th className="pb-2 font-medium">% Done</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.epr_type} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">
                  {s.label}
                  <span className="ml-1.5 text-gray-400">({s.unit})</span>
                </td>
                <td className="py-2 pr-3 text-right text-gray-700 dark:text-gray-300">
                  {s.total_liability.toLocaleString('en-IN')}
                </td>
                <td className="py-2 pr-3 text-right text-emerald-700">
                  {s.total_fulfilled.toLocaleString('en-IN')}
                </td>
                <td className="py-2 pr-3 text-right text-red-600">
                  {s.gap.toLocaleString('en-IN')}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full ${pctColor(s.pct_fulfilled)}`}
                        style={{ width: `${Math.min(100, s.pct_fulfilled)}%` }}
                      />
                    </div>
                    <span className={`font-semibold ${pctText(s.pct_fulfilled)}`}>
                      {s.pct_fulfilled}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {/* Aggregate row */}
            <tr className="border-t-2 border-gray-300 font-semibold dark:border-gray-600">
              <td className="py-2 pr-3 text-gray-900 dark:text-white">All EPR Types</td>
              <td className="py-2 pr-3 text-right text-gray-800 dark:text-gray-200">
                {aggregate.total_liability.toLocaleString('en-IN')}
              </td>
              <td className="py-2 pr-3 text-right text-emerald-700">
                {aggregate.total_fulfilled.toLocaleString('en-IN')}
              </td>
              <td className="py-2 pr-3 text-right text-red-600">
                {aggregate.gap.toLocaleString('en-IN')}
              </td>
              <td className="py-2">
                <span className={`font-bold ${pctText(aggregate.pct_fulfilled)}`}>
                  {aggregate.pct_fulfilled}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
