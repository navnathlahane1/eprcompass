'use client';

import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

function formatINR(value: number) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

const COLORS: Record<string, string> = {
  Plastic: '#2563eb',
  'E-Waste': '#16a34a',
  Battery: '#ca8a04',
  Tyre: '#9333ea',
  Oil: '#dc2626'
};

export default function PriceHistoryClient({ historyRows, completedRows }: { historyRows: any[]; completedRows: any[] }) {
  const allMonths = Array.from(new Set((historyRows || []).map((row) => String(row.recorded_date).slice(0, 7)))).sort();

  const chartRows = allMonths.map((monthKey) => {
    const monthRows = (historyRows || []).filter((row) => String(row.recorded_date).slice(0, 7) === monthKey);
    const values: Record<string, any> = { month: monthKey };

    ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].forEach((category) => {
      const byCategory = monthRows.filter((row) => row.waste_category === category);
      const avg = byCategory.length
        ? byCategory.reduce((sum, row) => sum + Number(row.rate_inr || 0), 0) / byCategory.length
        : null;
      values[category] = avg != null ? Number(avg.toFixed(2)) : null;
    });

    return values;
  });

  return (
    <main className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Credit Price History</h1>
            <p className="mt-1 text-sm text-gray-600">Last 12 months trend by waste category.</p>
          </div>
          <Link href="/marketplace" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back to Marketplace</Link>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(val: any) => formatINR(Number(val || 0))} />
              <Legend />
              {['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].map((category) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={COLORS[category]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Last 10 Completed Transactions</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Qty (KG)</th>
                <th className="py-2 pr-3">Rate (₹/KG)</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {(completedRows || []).map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 text-gray-700">{row.waste_category}</td>
                  <td className="py-2 pr-3 text-gray-700">{Number(row.quantity_kg || (Number(row.quantity_mt || 0) * 1000)).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-3 text-gray-700">{formatINR(Number(row.agreed_rate_per_kg_inr || (Number(row.agreed_rate_inr || 0) / 1000)))}</td>
                  <td className="py-2 pr-3 text-gray-700">{formatINR(Number(row.total_value_inr || 0))}</td>
                  <td className="py-2 text-gray-700">{row.completed_at ? new Date(row.completed_at).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
