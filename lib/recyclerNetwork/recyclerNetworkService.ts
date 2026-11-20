/**
 * recyclerNetworkService.ts
 *
 * Pure service-layer functions for the Recycler / PRO Network module.
 * No direct DB calls — operates on pre-fetched data arrays.
 * Fully unit-testable without a database connection.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'BLACKLISTED';
export type LinkStatus = 'ACTIVE' | 'PAUSED' | 'REMOVED';
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type RecyclerType = 'RECYCLER' | 'PRO';

export interface RatingDimensions {
  timeliness: number;
  documentation: number;
  quantity_accuracy: number;
  compliance_score: number;
  responsiveness: number;
}

export interface RatingWeights {
  timeliness: number;
  documentation: number;
  quantity_accuracy: number;
  compliance_score: number;
  responsiveness: number;
}

export const DEFAULT_RATING_WEIGHTS: RatingWeights = {
  timeliness: 0.25,
  documentation: 0.20,
  quantity_accuracy: 0.25,
  compliance_score: 0.20,
  responsiveness: 0.10,
};

export interface RecyclerRow {
  id: string;
  recycler_code: string;
  name: string;
  type: RecyclerType;
  epr_categories: string[];
  authorized_states: string[];
  verification_status: VerificationStatus;
  lat?: number | null;
  lng?: number | null;
}

export interface ContractRow {
  id: string;
  contract_number: string;
  client_id: string;
  recycler_id: string;
  status: ContractStatus;
  end_date: string | null;
  renewal_notice_days: number;
  committed_qty: number | null;
  epr_category: string;
  financial_year: string;
}

export interface RatingRow {
  recycler_id: string;
  client_id: string;
  financial_year: string;
  month: number;
  timeliness: number;
  documentation: number;
  quantity_accuracy: number;
  compliance_score: number;
  responsiveness: number;
  overall_score: number;
  is_manual_override: boolean;
}

// ─── RATING CALCULATION ───────────────────────────────────────────────────────

/**
 * Compute weighted overall rating from 5 dimensions.
 * Returns value in [1, 5] rounded to 2 decimal places.
 */
export function computeOverallRating(
  dims: RatingDimensions,
  weights: RatingWeights = DEFAULT_RATING_WEIGHTS
): number {
  const totalWeight =
    weights.timeliness +
    weights.documentation +
    weights.quantity_accuracy +
    weights.compliance_score +
    weights.responsiveness;

  if (totalWeight === 0) return 0;

  const weighted =
    dims.timeliness        * weights.timeliness +
    dims.documentation     * weights.documentation +
    dims.quantity_accuracy * weights.quantity_accuracy +
    dims.compliance_score  * weights.compliance_score +
    dims.responsiveness    * weights.responsiveness;

  const raw = weighted / totalWeight;
  return Math.round(raw * 100) / 100;
}

/** Rating badge from overall score. */
export function ratingToBadge(
  score: number
): 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Suspended' {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Average';
  if (score >= 1.0) return 'Poor';
  return 'Suspended';
}

/** Pin color for map based on rating. */
export function ratingToMapColor(score: number | null, status: VerificationStatus): string {
  if (status === 'SUSPENDED' || status === 'BLACKLISTED') return '#9ca3af'; // grey
  if (score === null) return '#6b7280';
  if (score >= 4.5) return '#10b981';  // green
  if (score >= 3.5) return '#a3e635';  // lime
  if (score >= 2.5) return '#f59e0b';  // amber
  return '#ef4444';                    // red
}

/**
 * Check whether a recycler's rating is below a threshold.
 * Used to trigger client alerts.
 */
export function isBelowThreshold(
  score: number,
  threshold: number = 2.5
): boolean {
  return score < threshold;
}

// ─── CONTRACT LOGIC ───────────────────────────────────────────────────────────

/**
 * Returns number of days until contract expires.
 * Negative = already expired.
 */
export function daysUntilExpiry(endDateStr: string | null): number | null {
  if (!endDateStr) return null;
  const now = Date.now();
  const end = new Date(endDateStr).getTime();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

/**
 * Classify a contract by its expiry status.
 */
export function contractExpiryStatus(
  contract: Pick<ContractRow, 'status' | 'end_date' | 'renewal_notice_days'>
): 'active' | 'expiring_soon' | 'expired' | 'draft' | 'terminated' {
  if (contract.status === 'DRAFT') return 'draft';
  if (contract.status === 'TERMINATED') return 'terminated';
  if (contract.status === 'EXPIRED') return 'expired';

  const days = daysUntilExpiry(contract.end_date);
  if (days === null) return 'active';
  if (days < 0) return 'expired';
  if (days <= (contract.renewal_notice_days ?? 30)) return 'expiring_soon';
  return 'active';
}

/**
 * Count contracts by expiry-status bucket for the dashboard cards.
 */
export function summarizeContracts(contracts: ContractRow[]): {
  active: number;
  expiring_soon: number;
  expired: number;
  draft: number;
  terminated: number;
} {
  const counts = { active: 0, expiring_soon: 0, expired: 0, draft: 0, terminated: 0 };
  for (const c of contracts) {
    const bucket = contractExpiryStatus(c);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }
  return counts;
}

/**
 * Returns contracts that need an expiry alert (within notice window).
 * Used to feed notification queue.
 */
export function contractsNeedingAlert(
  contracts: ContractRow[],
  checkpoints: number[] = [30, 15, 7]
): { contract: ContractRow; days: number }[] {
  const alerts: { contract: ContractRow; days: number }[] = [];
  for (const c of contracts) {
    if (c.status !== 'ACTIVE') continue;
    const days = daysUntilExpiry(c.end_date);
    if (days === null) continue;
    if (checkpoints.includes(days)) {
      alerts.push({ contract: c, days });
    }
  }
  return alerts;
}

// ─── GEO HELPERS ─────────────────────────────────────────────────────────────

/**
 * Returns a deduplicated list of states from all recyclers in a network.
 * Used to identify coverage gaps vs client liability states.
 */
export function coveredStates(recyclers: RecyclerRow[]): Set<string> {
  const states = new Set<string>();
  for (const r of recyclers) {
    for (const s of r.authorized_states) {
      states.add(s);
    }
  }
  return states;
}

/**
 * Returns liability states that have NO recycler in the client's network.
 */
export function coverageGaps(
  liabilityStates: string[],
  recyclers: RecyclerRow[]
): string[] {
  const covered = coveredStates(recyclers);
  return liabilityStates.filter((s) => !covered.has(s));
}

// ─── CSV IMPORT HELPERS ───────────────────────────────────────────────────────

export interface CsvImportRow {
  name: string;
  registration_number?: string;
  epr_categories: string;       // comma-separated
  authorized_states: string;    // comma-separated
  certifications?: string;      // comma-separated
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_pincode?: string;
  type?: string;
}

export interface CsvImportResult {
  valid: Omit<CsvImportRow, 'epr_categories' | 'authorized_states' | 'certifications'> & {
    epr_categories: string[];
    authorized_states: string[];
    certifications: string[];
  };
  rowIndex: number;
  errors: string[];
}

const VALID_EPR_TYPES = ['PLASTIC', 'EWASTE', 'BATTERY', 'USED_OIL', 'TYRE'];
const VALID_TYPES = ['RECYCLER', 'PRO'];

export function validateCsvRow(row: CsvImportRow, rowIndex: number): CsvImportResult {
  const errors: string[] = [];

  if (!row.name?.trim()) errors.push('name is required');

  const eprCats = (row.epr_categories ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const invalidCats = eprCats.filter((c) => !VALID_EPR_TYPES.includes(c));
  if (invalidCats.length) errors.push(`Invalid epr_categories: ${invalidCats.join(', ')}`);
  if (!eprCats.length) errors.push('At least one epr_category required');

  const states = (row.authorized_states ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!states.length) errors.push('At least one authorized_state required');

  const type = (row.type ?? 'RECYCLER').trim().toUpperCase();
  if (!VALID_TYPES.includes(type)) errors.push(`Invalid type: ${type}`);

  if (row.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) {
    errors.push('Invalid contact_email format');
  }

  return {
    rowIndex,
    errors,
    valid: {
      name: row.name?.trim() ?? '',
      registration_number: row.registration_number?.trim(),
      epr_categories: eprCats,
      authorized_states: states,
      certifications: (row.certifications ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      contact_email: row.contact_email?.trim(),
      contact_phone: row.contact_phone?.trim(),
      contact_address: row.contact_address?.trim(),
      contact_pincode: row.contact_pincode?.trim(),
      type,
    },
  };
}
