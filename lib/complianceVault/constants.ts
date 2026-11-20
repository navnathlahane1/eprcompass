/** Shared constants for the Compliance Credential Vault */

export const ACCOUNT_STATUSES = [
  'Active',
  'Inactive',
  'Expired',
  'Locked',
  'Pending Setup',
  'Unknown',
] as const;

export const OTP_OWNER_TYPES = [
  'Client',
  'Consultant',
  'Director',
  'Admin',
  'Shared',
  'Other',
] as const;

export const OTP_STATUSES = [
  'Active',
  'Inaccessible',
  'Changed',
  'Requires Update',
  'Unknown',
] as const;

export const ACTIVITY_ACTIONS = {
  ACCOUNT_CREATED:      'account_created',
  ACCOUNT_UPDATED:      'account_updated',
  ACCOUNT_DELETED:      'account_deleted',
  CREDENTIALS_CREATED:  'credentials_created',
  CREDENTIALS_UPDATED:  'credentials_updated',
  PASSWORD_REVEALED:    'password_revealed',
  PASSWORD_COPIED:      'password_copied',
  ACCOUNT_ACCESSED:     'account_accessed',
  PORTAL_OPENED:        'portal_opened',
} as const;

export type AccountStatus  = typeof ACCOUNT_STATUSES[number];
export type OtpOwnerType   = typeof OTP_OWNER_TYPES[number];
export type OtpStatus      = typeof OTP_STATUSES[number];

export const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  'Active':        'bg-emerald-100 text-emerald-700',
  'Inactive':      'bg-gray-100 text-gray-500',
  'Expired':       'bg-red-100 text-red-700',
  'Locked':        'bg-orange-100 text-orange-700',
  'Pending Setup': 'bg-amber-100 text-amber-700',
  'Unknown':       'bg-gray-100 text-gray-400',
};

export const OTP_STATUS_COLORS: Record<OtpStatus, string> = {
  'Active':          'bg-emerald-100 text-emerald-700',
  'Inaccessible':    'bg-red-100 text-red-700',
  'Changed':         'bg-amber-100 text-amber-700',
  'Requires Update': 'bg-orange-100 text-orange-700',
  'Unknown':         'bg-gray-100 text-gray-400',
};

/** Days before renewal date to show warning */
export const RENEWAL_WARN_DAYS = 60;
export const RENEWAL_CRITICAL_DAYS = 30;
