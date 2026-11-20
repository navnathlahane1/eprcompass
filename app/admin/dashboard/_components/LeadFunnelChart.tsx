'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  data: {
    funnel: Array<{ stage: string; value: number; conversionPct: number }>;
    sources: Array<{ source: string; count: number; conversionRate: number }>;
  };
};

export default function LeadFunnelChart({ data }: Props) {
  const [tab, setTab] = useState<'funnel' | 'sources'>('funnel');
  const rows = tab === 'funnel'
    ? (data?.funnel || []).map(row => ({ label: row.stage, value: row.value, rate: row.conversionPct }))
    : (data?.sources || []).slice(0, 8).map(row => ({ label: row.source, value: row.count, rate: row.conversionRate }));
  const max = Math.max(1, ...rows.map(row => row.value));
  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Lead conversion</h2>
        <div role="group" aria-label="Lead breakdown" className="flex rounded-md bg-zinc-100 p-1">
          {(['funnel', 'sources'] as const).map(value => (
            <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize ${tab === value ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>{value}</button>
          ))}
        </div>
      </div>
      <div className="min-h-64 space-y-5">
        {!rows.length && <p className="py-12 text-center text-xs text-zinc-500">No lead sources to display.</p>}
        {rows.map((row, index) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium text-zinc-700">{row.label}</span>
              <span className="shrink-0 tabular-nums text-zinc-900">{row.value.toLocaleString('en-IN')}<span className="ml-3 text-zinc-500">{row.rate.toFixed(1)}%</span></span>
            </div>
            <div role="meter" aria-label={row.label} aria-valuenow={row.value} aria-valuemin={0} aria-valuemax={max} className="h-1.5 overflow-hidden rounded-sm bg-zinc-200">
              <div className={`h-full rounded-sm ${index % 2 ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${Math.max(0, row.value) / max * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Link href="/admin/telecalling/leads" className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">Open sales pipeline<ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </section>
  );
}
