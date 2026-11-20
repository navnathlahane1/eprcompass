export const CONSENT_KEY = 'eprCompass-usage-analytics';
export const CONSENT_EVENT = 'eprCompass-analytics-consent';

export function analyticsAllowed() {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(CONSENT_KEY) === 'granted'; } catch { return false; }
}

export function safeAnalyticsProperties(properties = {}) {
  const allowed = new Set(['environment', 'source', 'portal', 'role', 'purpose', 'business_activity', 'status', 'step', 'step_name', 'plan', 'plan_code', 'billing_cycle', 'workspace_id', 'event_version', 'sample', 'channel', 'resource', 'count', 'amount', 'currency', 'product', 'form_type', 'result']);
  return Object.fromEntries(Object.entries(properties).filter(([key, value]) =>
    allowed.has(key) && (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.length <= 120 && !/[?@]|https?:\/\//i.test(value)))));
}
