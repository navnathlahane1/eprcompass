'use client';

import { memo } from 'react';
import { CheckCircle, Circle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { ContractStatus } from '@/lib/recyclerNetwork/recyclerNetworkService';

interface TimelineStep {
  status: ContractStatus;
  label: string;
  date?: string | null;
}

interface ContractTimelineProps {
  currentStatus: ContractStatus;
  createdAt?: string;
  activatedAt?: string;
  endDate?: string;
  terminatedAt?: string;
  terminationReason?: string;
}

function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const ContractTimeline = memo(function ContractTimeline({
  currentStatus,
  createdAt,
  activatedAt,
  endDate,
  terminatedAt,
  terminationReason,
}: ContractTimelineProps) {
  const steps: TimelineStep[] = [
    { status: 'DRAFT',      label: 'Created',    date: createdAt },
    { status: 'ACTIVE',     label: 'Activated',  date: activatedAt },
    { status: currentStatus === 'TERMINATED' ? 'TERMINATED' : 'EXPIRED', label: currentStatus === 'TERMINATED' ? 'Terminated' : 'Expires', date: terminatedAt ?? endDate },
  ];

  const ORDER: Record<ContractStatus, number> = { DRAFT: 0, ACTIVE: 1, EXPIRED: 2, TERMINATED: 2 };
  const currentOrder = ORDER[currentStatus] ?? 0;

  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-1 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
      {steps.map((step, i) => {
        const stepOrder = ORDER[step.status] ?? i;
        const isDone = stepOrder < currentOrder;
        const isCurrent = stepOrder === currentOrder;
        const isBad = step.status === 'TERMINATED' || step.status === 'EXPIRED';

        const Icon = isBad && isCurrent
          ? isBad && step.status === 'TERMINATED' ? XCircle : AlertTriangle
          : isDone
          ? CheckCircle
          : isCurrent
          ? Clock
          : Circle;

        const iconColor = isBad && isCurrent
          ? 'text-red-500'
          : isDone
          ? 'text-green-500'
          : isCurrent
          ? 'text-eco-green-5'
          : 'text-gray-300 dark:text-gray-600';

        return (
          <li key={step.status} className="relative flex items-start gap-3">
            <span className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-900 ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className={`text-sm font-medium ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-gray-400">{formatDate(step.date)}</p>
              )}
              {step.status === 'TERMINATED' && terminationReason && (
                <p className="mt-0.5 text-xs text-red-500">{terminationReason}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
