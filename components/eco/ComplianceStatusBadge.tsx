import { AlertTriangle, CheckCircle2, CircleDot, Loader2, PauseCircle } from 'lucide-react';

export type ComplianceStatus = 'compliant' | 'pending' | 'overdue' | 'draft' | 'under_review';

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; classes: string; Icon: typeof CheckCircle2 }> = {
  compliant: {
    label: 'Compliant',
    classes: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60 dark:bg-emerald-900/30 dark:text-emerald-200',
    Icon: CheckCircle2
  },
  pending: {
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/70 dark:bg-amber-900/30 dark:text-amber-200',
    Icon: CircleDot
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-red-100 text-red-800 ring-1 ring-red-300/70 dark:bg-red-900/30 dark:text-red-200',
    Icon: AlertTriangle
  },
  draft: {
    label: 'Draft',
    classes: 'bg-gray-100 text-gray-700 ring-1 ring-gray-300/80 dark:bg-gray-800 dark:text-gray-200',
    Icon: PauseCircle
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300/70 dark:bg-sky-900/30 dark:text-sky-200',
    Icon: Loader2
  }
};

/**
 * Compliance status badge wrapper for EPR workflows.
 */
export function ComplianceStatusBadge({ status, className = '' }: ComplianceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.Icon;

  return (
    <span
      role="status"
      aria-label={`Compliance status: ${config.label}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.classes} ${status === 'overdue' ? 'animate-pulse motion-reduce:animate-none' : ''} ${className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${status === 'under_review' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
