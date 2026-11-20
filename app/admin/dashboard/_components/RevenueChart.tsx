'use client';

import { useMemo, useState } from 'react';
import { inCurrentFinancialYear } from '@/lib/admin/dashboardPeriods';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line
} from 'recharts';

type Row = {
  month: string;
  billed: number;
  collected: number;
  leads: number;
};

type Props = {
  data: {
    monthly: Row[];
    forecast: Array<{ month: string; collected: number }>;
  };
};

function formatINR(value: number) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

export default function RevenueChart({ data }: Props) {
  const [period, setPeriod] = useState<'6M' | '12M' | 'FY'>('12M');

  const merged = useMemo(() => {
    const monthly = data?.monthly || [];
    const forecast = data?.forecast || [];

    const out = monthly.map((row) => ({ ...row, forecast: null as number | null }));
    for (const f of forecast) {
      out.push({ month: f.month, billed: 0, collected: 0, leads: 0, forecast: f.collected });
    }
    return out;
  }, [data]);

  const filtered = useMemo(() => {
    const base = merged;
    if (period === '6M') return [...base.filter(row => row.forecast === null).slice(-6), ...base.filter(row => row.forecast !== null)];
    if (period === 'FY') return inCurrentFinancialYear(base);
    return base;
  }, [period, merged]);

  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Revenue Performance</h2>
        <div role="group" aria-label="Revenue period" className="flex items-center rounded-md bg-zinc-100 p-1">
          {(['6M', '12M', 'FY'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={period === item}
              onClick={() => setPeriod(item)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                period === item
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? <div className="flex h-80 items-center justify-center text-xs text-zinc-500">No revenue data for this period.</div> : <div className="h-80 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis yAxisId="left" width={55} tickLine={false} axisLine={false} tickFormatter={(v) => Number(v).toLocaleString('en-IN', { notation: 'compact' })} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value: any, key: any) => {
                key = String(key).toLowerCase();
                if (key === 'leads') return [Number(value || 0).toLocaleString('en-IN'), 'Leads'];
                return [formatINR(Number(value || 0)), key === 'forecast' ? 'Forecast' : key === 'billed' ? 'Billed' : 'Collected'];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="collected" name="Collected" fill="#059669" maxBarSize={28} radius={[3, 3, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="billed" name="Billed" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
            <Line yAxisId="left" type="monotone" dataKey="forecast" name="Forecast" stroke="#71717a" strokeDasharray="6 6" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
            <Line yAxisId="right" type="monotone" dataKey="leads" name="Leads" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>}
    </section>
  );
}
