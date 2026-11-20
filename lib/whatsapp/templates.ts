export const TEMPLATES = {
  LEAD_REPLY:       'lead_reply',
  RENEWAL_7D:       'renewal_7d',
  RENEWAL_30D:      'renewal_30d',
  RENEWAL_60D:      'renewal_60d',
  RENEWAL_90D:      'renewal_90d',
  WELCOME_CLIENT:   'welcome_client',
  CERT_READY:       'cert_ready',
  PAYMENT_REMINDER: 'payment_reminder',
  DOCUMENT_REQUEST: 'document_request',
} as const;

export type TemplateName = (typeof TEMPLATES)[keyof typeof TEMPLATES];
