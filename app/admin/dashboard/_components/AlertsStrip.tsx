import Link from 'next/link';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

type Props = {
  overdueFilings: number;
  deadlines7d: number;
  overdueInvoices30d: number;
  highRiskRecyclers: number;
};

export default function AlertsStrip({ overdueFilings, deadlines7d, overdueInvoices30d, highRiskRecyclers }: Props) {
  const alerts = [
    { count: overdueFilings, label: `${overdueFilings} overdue filings`, href: '/admin/compliance' },
    { count: deadlines7d, label: `${deadlines7d} deadlines this week`, href: '/admin/service-requests' },
    { count: overdueInvoices30d, label: `${overdueInvoices30d.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} overdue`, href: '/admin/billing' },
    { count: highRiskRecyclers, label: `${highRiskRecyclers} high-risk recyclers`, href: '/admin/recyclers' },
  ].filter(alert => alert.count > 0);
  if (!alerts.length) return null;
  return (
    <section aria-label="Requires attention" className="flex flex-wrap items-center gap-x-5 gap-y-2 border-l-2 border-amber-500 bg-amber-50 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-900"><AlertCircle className="h-4 w-4" />Requires attention</span>
      {alerts.map(alert => <Link key={alert.href} href={alert.href} className="inline-flex items-center gap-1 text-xs font-medium text-amber-900 underline-offset-4 hover:underline">{alert.label}<ArrowUpRight className="h-3 w-3" /></Link>)}
    </section>
  );
}
