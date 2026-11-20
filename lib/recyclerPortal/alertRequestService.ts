/**
 * Pure functions for CPCB alert matching and request expiry logic.
 * No DB calls — all inputs must be provided.
 * Fully unit-testable.
 */

export interface CpcbAlertInput {
  eprTypes: string[];
  affectedStates: string[];
  affectedCategories: string[];
}

export interface RecyclerAlertProfile {
  eprCategories: string[];
  authorizedStates: string[];
}

/**
 * Returns true if a CPCB alert should be delivered to the given recycler.
 * Match criteria: any eprType OR any state overlap, or alert has no state filter (global).
 */
export function matchAlertToRecycler(
  alert: CpcbAlertInput,
  recycler: RecyclerAlertProfile
): { matched: boolean; matchedTypes: string[]; matchedStates: string[] } {
  // Global alerts (no state or type restriction) match everyone
  const globalAlert = alert.eprTypes.length === 0 && alert.affectedStates.length === 0;
  if (globalAlert) {
    return { matched: true, matchedTypes: [], matchedStates: [] };
  }

  const matchedTypes = alert.eprTypes.filter((t) => recycler.eprCategories.includes(t));
  const matchedStates = alert.affectedStates.filter((s) => recycler.authorizedStates.includes(s));

  // Match if any category OR any state matches
  const matched = matchedTypes.length > 0 || matchedStates.length > 0;

  return { matched, matchedTypes, matchedStates };
}

/**
 * Returns urgency color class for display.
 */
export function urgencyToColor(urgency: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return map[urgency] ?? 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Computes the expiry timestamp for a corporate request.
 */
export function computeRequestExpiry(sentAt: string, expiresInDays: number): string {
  const base = new Date(sentAt).getTime();
  return new Date(base + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Returns true if a request is expired.
 */
export function isRequestExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Returns days until request expires. Negative = already expired.
 */
export function daysUntilRequestExpiry(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Validates if a new negotiation round is allowed.
 */
export function canStartNewRound(
  currentRound: number,
  maxRounds: number,
  requestStatus: string
): { allowed: boolean; reason?: string } {
  if (!['RESPONDED', 'NEGOTIATING'].includes(requestStatus)) {
    return { allowed: false, reason: `Request status ${requestStatus} does not allow further rounds` };
  }
  if (currentRound >= maxRounds) {
    return { allowed: false, reason: `Maximum negotiation rounds (${maxRounds}) reached` };
  }
  return { allowed: true };
}
