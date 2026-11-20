'use client';

// Feature 7: Intel Sync Status Badge
// Shows whether this lead's company exists in Intel and its enrichment state

interface Props {
  intelCompanyId?: string | null;
  enrichmentLevel?: 'none' | 'partial' | 'full';
  companyName?: string;
  compact?: boolean;
}

export default function IntelSyncBadge({ intelCompanyId, enrichmentLevel = 'none', companyName, compact = false }: Props) {
  if (!intelCompanyId) {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} rounded-full bg-slate-800 border border-slate-700 text-slate-500`}>
        <span>○</span>
        {!compact && <span>Not in Intel</span>}
      </span>
    );
  }

  const config = {
    full: { label: 'Intel: Enriched', icon: '◉', bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-300' },
    partial: { label: 'Intel: Partial', icon: '◎', bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-300' },
    none: { label: 'Intel: Basic', icon: '◌', bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-400' },
  }[enrichmentLevel];

  const href = `/intel/companies/${intelCompanyId}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={companyName ? `View ${companyName} in Intel` : 'View in Intel'}
      className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} rounded-full ${config.bg} border ${config.border} ${config.text} hover:opacity-80 transition-opacity`}
    >
      <span>{config.icon}</span>
      {!compact && <span>{config.label}</span>}
      {!compact && <span className="opacity-60">↗</span>}
    </a>
  );
}
