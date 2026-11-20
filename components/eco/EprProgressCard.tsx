import Link from 'next/link';
import { ArrowRight, BatteryCharging, Cpu, Recycle, ShieldCheck } from 'lucide-react';

export type WasteCategory = 'plastic' | 'e-waste' | 'battery' | 'tyre';

interface EprProgressCardProps {
  category: WasteCategory;
  filingYear: string;
  actualKg: number;
  targetKg: number;
  href: string;
  ctaLabel: string;
}

const CATEGORY_CONFIG: Record<WasteCategory, { label: string; Icon: typeof Recycle; accent: string }> = {
  plastic: { label: 'Plastic', Icon: Recycle, accent: 'text-[#07875f]' },
  'e-waste': { label: 'E-Waste', Icon: Cpu, accent: 'text-[#0f4c75]' },
  battery: { label: 'Battery', Icon: BatteryCharging, accent: 'text-[#b45309]' },
  tyre: { label: 'Tyre', Icon: ShieldCheck, accent: 'text-[#374151]' }
};

function formatKg(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(value, 0));
}

/**
 * Progress card for waste-category EPR compliance tracking.
 */
export function EprProgressCard({ category, filingYear, actualKg, targetKg, href, ctaLabel }: EprProgressCardProps) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.Icon;
  const safeTarget = targetKg <= 0 ? 1 : targetKg;
  const progress = Math.min(100, Math.round((Math.max(actualKg, 0) / safeTarget) * 100));

  return (
    <article className="rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${cfg.accent}`} aria-hidden="true" />
          <p className="text-sm font-semibold text-[var(--brand-text)] dark:text-gray-100">{cfg.label}</p>
        </div>
        <span className="rounded-full bg-[var(--brand-surface)] px-2 py-1 font-mono text-[11px] text-[var(--brand-muted)] dark:bg-gray-800 dark:text-gray-300">
          {filingYear}
        </span>
      </div>

      <p className="mt-3 text-xs text-[var(--brand-muted)] dark:text-gray-400">
        {formatKg(actualKg)} kg of {formatKg(targetKg)} kg target
      </p>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e7efe9] dark:bg-gray-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${cfg.label} compliance progress`}>
        <div className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--brand-text)] dark:text-gray-200">{progress}% complete</p>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-secondary)] hover:text-[var(--brand-primary)]" aria-label={ctaLabel}>
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
