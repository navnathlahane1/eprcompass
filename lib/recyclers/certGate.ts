/** CPCB registration must be present and unexpired to list or trade credits. */

export function isCpcbCertLive(
  certNo?: string | null,
  expiry?: string | null,
  now: Date = new Date()
): boolean {
  if (!String(certNo || '').trim()) return false;
  if (!expiry) return false;
  const exp = new Date(expiry);
  if (Number.isNaN(exp.getTime())) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return exp.getTime() >= start.getTime();
}

export function cpcbCertBlockReason(certNo?: string | null, expiry?: string | null): string | null {
  if (!String(certNo || '').trim()) {
    return 'CPCB certificate number is required before listing EPR credits.';
  }
  if (!expiry) {
    return 'CPCB certificate expiry date is required before listing EPR credits.';
  }
  const exp = new Date(expiry);
  if (Number.isNaN(exp.getTime()) || exp.getTime() < Date.now()) {
    return 'This recycler’s CPCB certificate has expired. Renew it before listing or trading credits.';
  }
  return null;
}
