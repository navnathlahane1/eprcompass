// [MODULE] Trading Dashboard (Role-Based)
// [PURPOSE] Displays brand/recycler/admin-focused KPI strips for the trading platform.
// [DEPENDENCIES] react, lucide-react

'use client';

import { BarChart3, BriefcaseBusiness, Gauge, ShieldAlert, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TradingRole } from '@/lib/epr-trading/types';

type Props = {
  role: TradingRole;
};

const roleTiles: Record<TradingRole, Array<{ title: string; value: string; note: string; icon: ReactNode }>> = {
  BRAND: [
    { title: 'Obligation Fulfilled', value: '62%', note: 'Plastic + E-Waste progress', icon: <Gauge className="h-5 w-5" /> },
    { title: 'Active Buy Orders', value: '14', note: 'Across 6 geographies', icon: <BriefcaseBusiness className="h-5 w-5" /> },
    { title: 'Spend Analytics', value: 'INR 2.8Cr', note: 'Last 90 days', icon: <Wallet className="h-5 w-5" /> }
  ],
  RECYCLER: [
    { title: 'Capacity Utilization', value: '74%', note: 'Current booking rate', icon: <Gauge className="h-5 w-5" /> },
    { title: 'Incoming Offers', value: '9', note: 'Awaiting counter', icon: <BriefcaseBusiness className="h-5 w-5" /> },
    { title: 'Revenue', value: 'INR 1.2Cr', note: 'Quarter to date', icon: <Wallet className="h-5 w-5" /> }
  ],
  ADMIN: [
    { title: 'Open Deals', value: '118', note: 'Platform wide', icon: <BarChart3 className="h-5 w-5" /> },
    { title: 'KYC Queue', value: '23', note: 'Pending review', icon: <ShieldAlert className="h-5 w-5" /> },
    { title: 'Platform Fees', value: 'INR 31L', note: 'Realized this month', icon: <Wallet className="h-5 w-5" /> }
  ],
  PRO: [
    { title: 'Managed Traders', value: '46', note: 'Assigned portfolio', icon: <BriefcaseBusiness className="h-5 w-5" /> },
    { title: 'Resolution Tasks', value: '12', note: 'Disputes + KYC follow-up', icon: <ShieldAlert className="h-5 w-5" /> },
    { title: 'Exec Coverage', value: '91%', note: 'SLA within target', icon: <Gauge className="h-5 w-5" /> }
  ]
};

export default function TradingDashboard({ role }: Props) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {roleTiles[role].map((tile) => (
        <article key={tile.title} className="rounded-xl border border-[#1B2640] bg-[#0A0F1E] p-4 text-white">
          <div className="mb-2 inline-flex rounded-lg border border-[#223359] bg-[#0E1529] p-2 text-[#00D4AA]">{tile.icon}</div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{tile.title}</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{tile.value}</p>
          <p className="mt-1 text-xs text-slate-300">{tile.note}</p>
        </article>
      ))}
    </section>
  );
}
