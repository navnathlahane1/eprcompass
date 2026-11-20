'use client';

import { memo } from 'react';
import { contractExpiryStatus, daysUntilExpiry } from '@/lib/recyclerNetwork/recyclerNetworkService';

type Status = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

interface ContractStatusBadgeProps {
  status: Status;
  endDate?: string | null;
  renewalNoticeDays?: number;
}

const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

const STATUS_STYLES: Record<string, string> = {
  draft:          `${BASE} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`,
  active:         `${BASE} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`,
  expiring_soon:  `${BASE} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`,
  expired:        `${BASE} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`,
  terminated:     `${BASE} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`,
};

const LABELS: Record<string, string> = {
  draft:         'Draft',
  active:        'Active',
  expiring_soon: 'Expiring Soon',
  expired:       'Expired',
  terminated:    'Terminated',
};

export const ContractStatusBadge = memo(function ContractStatusBadge({
  status,
  endDate,
  renewalNoticeDays = 30,
}: ContractStatusBadgeProps) {
  const bucket = contractExpiryStatus({ status, end_date: endDate ?? null, renewal_notice_days: renewalNoticeDays });
  const days = endDate ? daysUntilExpiry(endDate) : null;

  return (
    <span className={STATUS_STYLES[bucket] ?? STATUS_STYLES.draft} role="status">
      {LABELS[bucket]}
      {bucket === 'expiring_soon' && days !== null && ` (${days}d)`}
    </span>
  );
});
