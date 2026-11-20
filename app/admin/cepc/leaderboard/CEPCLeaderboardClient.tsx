'use client';

import { useMemo, useState } from 'react';

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function startOfPeriod(period: string): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === 'This Month') return new Date(Date.UTC(y, m, 1));
  if (period === 'This Quarter') return new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1));

  // FY starts Apr 1
  const fyStartYear = m >= 3 ? y : y - 1;
  return new Date(Date.UTC(fyStartYear, 3, 1));
}

export default function CEPCLeaderboardClient({ initialRows }: { initialRows: any[] }) {
  const [period, setPeriod] = useState('This Month');

  const rows = useMemo(() => {
    const start = startOfPeriod(period);

    const mapped = (initialRows || []).map((row) => {
      const leads = (row.leads || []).filter((lead: any) => new Date(lead.submitted_at) >= start);
      const converted = leads.filter((lead: any) => lead.stage === 'Converted').length;
      const clients = converted;

      const earnings = (row.earnings || []).filter((e: any) => new Date(`${e.period_month}T00:00:00Z`) >= start);
      const revenue = earnings.reduce((sum: number, e: any) => sum + Number(e.gross_revenue_inr || 0), 0);
      const commission = earnings.reduce((sum: number, e: any) => sum + Number(e.commission_inr || 0), 0);
      const conversionRate = leads.length ? (converted / leads.length) * 100 : 0;

      return {
        id: row.id,
        name: row.full_name,
        tier: row.certification_tier,
        state: row.state,
        clients,
        revenue,
        commission,
        conversionRate
      };
    });

    return mapped.sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.conversionRate - a.conversionRate;
    });
  }, [initialRows, period]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">CEPC Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-400">Read-only rankings by revenue and conversion performance.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <label className="text-sm text-slate-200">
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="ml-3 rounded-md border border-slate-700 px-3 py-1.5 text-sm">
            {['This Month', 'This Quarter', 'This FY'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Clients</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rank = idx + 1;
              const top3 = rank <= 3;
              const rankBadge = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}`;
              return (
                <tr key={row.id} className={`border-b border-slate-800/60 ${top3 ? 'bg-amber-900/20' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${top3 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-200'}`}>
                      {rankBadge}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-100">{row.name}</td>
                  <td className="px-4 py-3 text-slate-200">{row.tier}</td>
                  <td className="px-4 py-3 text-slate-200">{row.state || '-'}</td>
                  <td className="px-4 py-3 text-slate-200">{row.clients}</td>
                  <td className="px-4 py-3 text-slate-200">{formatINR(row.revenue)}</td>
                  <td className="px-4 py-3 text-slate-200">{formatINR(row.commission)}</td>
                  <td className="px-4 py-3 text-slate-200">{row.conversionRate.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 sm:hidden">
        {rows.map((row, idx) => (
          <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs font-semibold text-slate-400">Rank {idx + 1}</p>
            <p className="text-sm font-semibold text-slate-100">{row.name}</p>
            <p className="text-xs text-slate-400">{row.tier} · {row.state || '-'}</p>
            <p className="mt-1 text-xs text-slate-400">Clients: {row.clients}</p>
            <p className="text-xs text-slate-400">Revenue: {formatINR(row.revenue)}</p>
            <p className="text-xs text-slate-400">Commission: {formatINR(row.commission)}</p>
            <p className="text-xs text-slate-400">Conversion: {row.conversionRate.toFixed(1)}%</p>
          </article>
        ))}
      </section>
    </div>
  );
}
