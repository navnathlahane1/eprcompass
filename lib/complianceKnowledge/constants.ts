import type { FilingType, CycleType, TaskType, TaskStatus, TaskPriority, FilingStatus, DocumentStatus } from './types';

export const FILING_TYPE_LABELS: Record<FilingType, string> = {
  registration: 'Registration',
  renewal: 'Renewal',
  quarterly_return: 'Quarterly Return',
  half_yearly_return: 'Half-Yearly Return',
  annual_return: 'Annual Return',
  data_submission: 'Data Submission',
  fee_payment: 'Fee Payment',
  audit_submission: 'Audit Submission',
  one_time: 'One-Time Filing',
};

export const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-Yearly',
  annual: 'Annual',
  multi_year: 'Multi-Year',
  one_time: 'One-Time',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  filing: 'Filing',
  document_upload: 'Document Upload',
  renewal: 'Renewal',
  registration: 'Registration',
  data_submission: 'Data Submission',
  fee_payment: 'Fee Payment',
  audit: 'Audit',
  review: 'Review',
  other: 'Other',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  waived: 'Waived',
  blocked: 'Blocked',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  waived: 'bg-gray-100 text-gray-600',
  blocked: 'bg-orange-100 text-orange-800',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-800 border border-red-200',
  high: 'bg-orange-100 text-orange-800 border border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border border-blue-200',
  low: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  overdue: 'Overdue',
  waived: 'Waived',
};

export const FILING_STATUS_COLORS: Record<FilingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-teal-100 text-teal-800',
  under_review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  overdue: 'bg-red-200 text-red-900',
  waived: 'bg-gray-100 text-gray-600',
};

export const DOC_STATUS_COLORS: Record<DocumentStatus, string> = {
  uploaded: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  superseded: 'bg-gray-100 text-gray-600',
};

export const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-700 bg-red-50 border-red-200', dotColor: 'bg-red-500', days: 7 },
  high:     { label: 'High',     color: 'text-orange-700 bg-orange-50 border-orange-200', dotColor: 'bg-orange-500', days: 15 },
  medium:   { label: 'Medium',   color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dotColor: 'bg-yellow-500', days: 30 },
  low:      { label: 'Low',      color: 'text-green-700 bg-green-50 border-green-200', dotColor: 'bg-green-500', days: 9999 },
};

export function getUrgency(daysRemaining: number): 'critical' | 'high' | 'medium' | 'low' {
  if (daysRemaining < 0) return 'critical';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 15) return 'high';
  if (daysRemaining <= 30) return 'medium';
  return 'low';
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 30) return `${days}d remaining`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks}w remaining`;
  const months = Math.round(days / 30);
  return `${months}mo remaining`;
}

export const ENTITY_TYPES = [
  'PIBO',
  'Producer',
  'Importer',
  'Brand Owner',
  'Recycler',
  'PRO',
  'Refurbisher',
  'Dismantler',
  'Retreader',
  'Assembler',
  'Other',
];

export const COMPLIANCE_CATEGORIES = [
  { value: 'EPR', label: 'EPR' },
  { value: 'Environmental', label: 'Environmental' },
  { value: 'Import/Export', label: 'Import/Export' },
  { value: 'Carbon', label: 'Carbon' },
  { value: 'Regulatory', label: 'Regulatory' },
  { value: 'Other', label: 'Other' },
];
