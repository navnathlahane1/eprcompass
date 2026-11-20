import Link from 'next/link';
import { Users, Wallet, UserPlus, FileWarning, CalendarClock, ArrowLeftRight, ArrowUpRight } from 'lucide-react';

type KpiProps = {
  kpis: Record<string, number | string | null | undefined>;
  deltas: Record<string, number | string | null | undefined>;
  unavailable?: boolean;
};

export default function KpiBar({ kpis, deltas, unavailable }: KpiProps) {
  const metrics = [
    { key: 'active_clients', label: 'Active clients', href: '/admin/crm/clients', icon: Users, currency: false },
    { key: 'revenue_this_month', label: 'Revenue this month', href: '/admin/billing', icon: Wallet, currency: true },
    { key: 'leads_this_month', label: 'Leads this month', href: '/admin/telecalling/leads', icon: UserPlus, currency: false },
    { key: 'overdue_filings', label: 'Overdue filings', href: '/admin/compliance', icon: FileWarning, currency: false },
    { key: 'deadlines_30d', label: 'Deadlines in 30 days', href: '/admin/compliance', icon: CalendarClock, currency: false },
    { key: 'marketplace_volume', label: 'Marketplace volume', href: '/admin/marketplace', icon: ArrowLeftRight, currency: true },
  ];
  return (
    <section aria-label="Business metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map(metric => {
        const value = Number(kpis[metric.key] || 0);
        const delta = Number(deltas[metric.key] || 0);
        const missing = unavailable || kpis[metric.key] == null || !Number.isFinite(value);
        const hasComparison = deltas[metric.key] != null && Number.isFinite(delta);
        const adverse = metric.key === 'overdue_filings' && value > 0;
        const trendColor = metric.key === 'deadlines_30d' || delta === 0 ? 'text-zinc-500'
          : (metric.key === 'overdue_filings' ? delta < 0 : delta > 0) ? 'text-emerald-700' : 'text-rose-700';
        return (
          <Link key={metric.key} href={metric.href} className="group min-w-0 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600">
            <div className="mb-4 flex items-center justify-between">
              <metric.icon className={`h-4 w-4 ${adverse ? 'text-rose-600' : 'text-zinc-500'}`} />
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
            <p className={`mt-1 break-words text-2xl font-semibold tabular-nums ${adverse ? 'text-rose-700' : 'text-zinc-950'}`}>
              {missing ? '--' : value.toLocaleString('en-IN', metric.currency ? { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' } : {})}
            </p>
            <p className={`mt-3 text-[11px] tabular-nums ${trendColor}`}>
              {missing ? 'Data unavailable' : hasComparison ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs previous month` : 'Current snapshot'}
            </p>
          </Link>
        );
      })}
    </section>
  );
}
