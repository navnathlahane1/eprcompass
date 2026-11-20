// [MODULE] Pricing and Market Intelligence
// [PURPOSE] Renders anonymized index cards and trend chart placeholders with alert rail.
// [DEPENDENCIES] react, recharts

'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
  trend: Array<{ day: string; plastic: number; ewaste: number; battery: number; tyre: number }>;
};

export default function PriceIntelligencePanel({ trend }: Props) {
  return (
    <section className="rounded-2xl border border-[#1B2640] bg-[#0A0F1E] p-4 text-white">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-base font-semibold">Price Intelligence</h3>
        <span className="rounded-full border border-[#00D4AA]/40 bg-[#00D4AA]/10 px-2 py-1 text-[11px] text-[#8FF7E0]">
          Plastic EPR prices up 12% this week
        </span>
      </div>
      <div className="h-56 w-full rounded-xl border border-[#223359] bg-[#0D1428] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <XAxis dataKey="day" stroke="#8FA3C8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#8FA3C8" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#0A0F1E',
                border: '1px solid #223359',
                color: '#E6ECFF'
              }}
            />
            <Line type="monotone" dataKey="plastic" stroke="#00D4AA" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ewaste" stroke="#2D9CDB" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="battery" stroke="#F2C94C" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tyre" stroke="#EB5757" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-400">TODO: connect to /api/trading/market-intelligence and CSV/PDF export endpoints.</p>
    </section>
  );
}
