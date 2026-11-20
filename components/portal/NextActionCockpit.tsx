import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, FileWarning, Wallet } from 'lucide-react';

export type NextAction = {
  title: string;
  detail: string;
  href: string;
  cta: string;
  tone: 'danger' | 'warning' | 'ok';
};

export default function NextActionCockpit({
  action,
  overdueCount,
  upcomingCount,
  pendingDocs,
  score,
}: {
  action: NextAction;
  overdueCount: number;
  upcomingCount: number;
  pendingDocs: number;
  score: number | null;
}) {
  const tone =
    action.tone === 'danger'
      ? 'border-red-200 bg-red-50'
      : action.tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-emerald-200 bg-emerald-50';
  const Icon = action.tone === 'ok' ? CalendarClock : action.tone === 'danger' ? AlertTriangle : FileWarning;

  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#07875f] shadow-sm">
            <Icon size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next action</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{action.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">{action.detail}</p>
          </div>
        </div>
        <Link
          href={action.href}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#07875f] px-4 text-sm font-bold text-white hover:bg-[#066e4e]"
        >
          {action.cta} <ArrowRight size={16} />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Overdue filings" value={String(overdueCount)} warn={overdueCount > 0} />
        <Stat label="Due in 30 days" value={String(upcomingCount)} />
        <Stat label="Pending documents" value={String(pendingDocs)} warn={pendingDocs > 0} />
        <Stat
          label="Recorded readiness"
          value={score == null ? 'Not assessed' : `${Math.round(score)}%`}
          icon={<Wallet size={14} className="text-slate-400" />}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  warn,
  icon,
}: {
  label: string;
  value: string;
  warn?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-extrabold tabular-nums ${warn ? 'text-red-700' : 'text-slate-900'}`}>
        {icon ? <span className="mr-1 inline-flex align-middle">{icon}</span> : null}
        {value}
      </p>
    </div>
  );
}
