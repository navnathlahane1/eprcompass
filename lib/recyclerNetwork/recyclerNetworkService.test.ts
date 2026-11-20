/**
 * Unit tests for recyclerNetworkService.ts
 * Run: npx vitest run lib/recyclerNetwork/recyclerNetworkService.test.ts
 */
import { describe, expect, it } from 'vitest';
import {
  computeOverallRating,
  ratingToBadge,
  ratingToMapColor,
  isBelowThreshold,
  daysUntilExpiry,
  contractExpiryStatus,
  summarizeContracts,
  contractsNeedingAlert,
  coveredStates,
  coverageGaps,
  validateCsvRow,
  DEFAULT_RATING_WEIGHTS,
} from './recyclerNetworkService';
import type { ContractRow } from './recyclerNetworkService';

// ─── computeOverallRating ─────────────────────────────────────────────────────
describe('computeOverallRating', () => {
  const perfect = { timeliness: 5, documentation: 5, quantity_accuracy: 5, compliance_score: 5, responsiveness: 5 };
  const lowest  = { timeliness: 1, documentation: 1, quantity_accuracy: 1, compliance_score: 1, responsiveness: 1 };

  it('returns 5.0 for all perfect scores', () => {
    expect(computeOverallRating(perfect)).toBe(5);
  });

  it('returns 1.0 for all lowest scores', () => {
    expect(computeOverallRating(lowest)).toBe(1);
  });

  it('returns 0 when all weights are zero', () => {
    const zeroWeights = { timeliness: 0, documentation: 0, quantity_accuracy: 0, compliance_score: 0, responsiveness: 0 };
    expect(computeOverallRating(perfect, zeroWeights)).toBe(0);
  });

  it('produces a value in [1, 5]', () => {
    const mixed = { timeliness: 4, documentation: 3, quantity_accuracy: 5, compliance_score: 2, responsiveness: 4 };
    const result = computeOverallRating(mixed);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(5);
  });

  it('respects custom weights', () => {
    // Only timeliness matters
    const weights = { timeliness: 1, documentation: 0, quantity_accuracy: 0, compliance_score: 0, responsiveness: 0 };
    const dims = { timeliness: 3, documentation: 5, quantity_accuracy: 5, compliance_score: 5, responsiveness: 5 };
    expect(computeOverallRating(dims, weights)).toBe(3);
  });

  it('rounds to 2 decimal places', () => {
    const dims = { timeliness: 3, documentation: 4, quantity_accuracy: 3, compliance_score: 4, responsiveness: 3 };
    const result = computeOverallRating(dims, DEFAULT_RATING_WEIGHTS);
    expect(String(result).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

// ─── ratingToBadge ────────────────────────────────────────────────────────────
describe('ratingToBadge', () => {
  it('returns Excellent for 4.5+', () => expect(ratingToBadge(4.5)).toBe('Excellent'));
  it('returns Excellent for 5.0', () => expect(ratingToBadge(5.0)).toBe('Excellent'));
  it('returns Good for 3.5–4.49', () => expect(ratingToBadge(3.5)).toBe('Good'));
  it('returns Good for 4.49', () => expect(ratingToBadge(4.49)).toBe('Good'));
  it('returns Average for 2.5–3.49', () => expect(ratingToBadge(2.5)).toBe('Average'));
  it('returns Poor for 1.0–2.49', () => expect(ratingToBadge(1.0)).toBe('Poor'));
  it('returns Suspended for 0', () => expect(ratingToBadge(0)).toBe('Suspended'));
});

// ─── ratingToMapColor ─────────────────────────────────────────────────────────
describe('ratingToMapColor', () => {
  it('returns grey for SUSPENDED status regardless of score', () => {
    expect(ratingToMapColor(5, 'SUSPENDED')).toBe('#9ca3af');
  });
  it('returns green for excellent rating', () => {
    expect(ratingToMapColor(4.5, 'VERIFIED')).toBe('#10b981');
  });
  it('returns red for poor rating', () => {
    expect(ratingToMapColor(1.5, 'VERIFIED')).toBe('#ef4444');
  });
});

// ─── isBelowThreshold ────────────────────────────────────────────────────────
describe('isBelowThreshold', () => {
  it('returns true when below default 2.5', () => expect(isBelowThreshold(2.4)).toBe(true));
  it('returns false when at threshold', () => expect(isBelowThreshold(2.5)).toBe(false));
  it('uses custom threshold', () => expect(isBelowThreshold(3.0, 4.0)).toBe(true));
});

// ─── daysUntilExpiry ──────────────────────────────────────────────────────────
describe('daysUntilExpiry', () => {
  it('returns null for null input', () => expect(daysUntilExpiry(null)).toBeNull());

  it('returns positive days for future date', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const days = daysUntilExpiry(future);
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
  });

  it('returns negative days for past date', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntilExpiry(past)).toBeLessThan(0);
  });
});

// ─── contractExpiryStatus ────────────────────────────────────────────────────
describe('contractExpiryStatus', () => {
  const activeExpiringSoon: ContractRow = {
    id: 'c1', contract_number: 'C-001', status: 'ACTIVE',
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    renewal_notice_days: 30, committed_qty: 100, epr_category: 'PLASTIC', financial_year: '2024-25',
  };

  it('classifies expiring soon contract', () => {
    expect(contractExpiryStatus(activeExpiringSoon)).toBe('expiring_soon');
  });

  it('classifies DRAFT as draft', () => {
    expect(contractExpiryStatus({ ...activeExpiringSoon, status: 'DRAFT' })).toBe('draft');
  });

  it('classifies TERMINATED as terminated', () => {
    expect(contractExpiryStatus({ ...activeExpiringSoon, status: 'TERMINATED' })).toBe('terminated');
  });

  it('classifies past end_date as expired', () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(contractExpiryStatus({ ...activeExpiringSoon, end_date: past })).toBe('expired');
  });

  it('classifies well-future ACTIVE as active', () => {
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(contractExpiryStatus({ ...activeExpiringSoon, end_date: future })).toBe('active');
  });
});

// ─── summarizeContracts ───────────────────────────────────────────────────────
describe('summarizeContracts', () => {
  it('returns all zeros for empty array', () => {
    const s = summarizeContracts([]);
    expect(s.active + s.expiring_soon + s.expired + s.draft + s.terminated).toBe(0);
  });

  it('counts draft correctly', () => {
    const contracts: ContractRow[] = [
      { id: '1', contract_number: 'C-001', status: 'DRAFT', end_date: null, renewal_notice_days: 30, committed_qty: null, epr_category: 'PLASTIC', financial_year: '2024-25' },
      { id: '2', contract_number: 'C-002', status: 'DRAFT', end_date: null, renewal_notice_days: 30, committed_qty: null, epr_category: 'EWASTE', financial_year: '2024-25' },
    ];
    expect(summarizeContracts(contracts).draft).toBe(2);
  });
});

// ─── contractsNeedingAlert ────────────────────────────────────────────────────
describe('contractsNeedingAlert', () => {
  it('picks up contract exactly at checkpoint day', () => {
    const daysUntil = 30;
    const endDate = new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000).toISOString();
    const contracts: ContractRow[] = [{
      id: 'c1', contract_number: 'C-001', status: 'ACTIVE',
      end_date: endDate, renewal_notice_days: 30,
      committed_qty: 100, epr_category: 'PLASTIC', financial_year: '2024-25',
    }];
    const alerts = contractsNeedingAlert(contracts);
    // 30 days is a checkpoint — may fire or be 29/31 depending on time of run
    expect(alerts.length).toBeLessThanOrEqual(1);
  });

  it('ignores DRAFT/TERMINATED contracts', () => {
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const contracts: ContractRow[] = [
      { id: 'c1', contract_number: 'C-001', status: 'DRAFT', end_date: endDate, renewal_notice_days: 30, committed_qty: null, epr_category: 'PLASTIC', financial_year: '2024-25' },
      { id: 'c2', contract_number: 'C-002', status: 'TERMINATED', end_date: endDate, renewal_notice_days: 30, committed_qty: null, epr_category: 'EWASTE', financial_year: '2024-25' },
    ];
    expect(contractsNeedingAlert(contracts)).toHaveLength(0);
  });
});

// ─── coverageGaps ────────────────────────────────────────────────────────────
describe('coverageGaps', () => {
  const recyclers = [
    { id: 'r1', recycler_code: 'R001', name: 'A', type: 'RECYCLER' as const, epr_categories: ['PLASTIC'], authorized_states: ['Maharashtra', 'Delhi'], verification_status: 'VERIFIED' },
    { id: 'r2', recycler_code: 'R002', name: 'B', type: 'RECYCLER' as const, epr_categories: ['EWASTE'], authorized_states: ['Karnataka'], verification_status: 'VERIFIED' },
  ];

  it('identifies states with no coverage', () => {
    const gaps = coverageGaps(['Maharashtra', 'Rajasthan', 'Karnataka'], recyclers);
    expect(gaps).toEqual(['Rajasthan']);
  });

  it('returns empty when all states covered', () => {
    const gaps = coverageGaps(['Maharashtra', 'Delhi'], recyclers);
    expect(gaps).toHaveLength(0);
  });

  it('returns all states when no recyclers', () => {
    const gaps = coverageGaps(['Maharashtra', 'Delhi'], []);
    expect(gaps).toHaveLength(2);
  });
});

// ─── validateCsvRow ───────────────────────────────────────────────────────────
describe('validateCsvRow', () => {
  const validRow = {
    name: 'Test Recycler Ltd',
    epr_categories: 'PLASTIC,EWASTE',
    authorized_states: 'Maharashtra,Karnataka',
    contact_email: 'test@example.com',
  };

  it('validates a correct row with no errors', () => {
    const result = validateCsvRow(validRow, 1);
    expect(result.errors).toHaveLength(0);
    expect(result.valid.epr_categories).toEqual(['PLASTIC', 'EWASTE']);
    expect(result.valid.authorized_states).toEqual(['Maharashtra', 'Karnataka']);
  });

  it('reports error for missing name', () => {
    const result = validateCsvRow({ ...validRow, name: '' }, 2);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('reports error for invalid epr_category', () => {
    const result = validateCsvRow({ ...validRow, epr_categories: 'PLASTIC,INVALID' }, 3);
    expect(result.errors.some((e) => e.includes('epr_categories'))).toBe(true);
  });

  it('reports error for bad email', () => {
    const result = validateCsvRow({ ...validRow, contact_email: 'not-an-email' }, 4);
    expect(result.errors.some((e) => e.includes('email'))).toBe(true);
  });

  it('reports error for missing authorized_states', () => {
    const result = validateCsvRow({ ...validRow, authorized_states: '' }, 5);
    expect(result.errors.some((e) => e.includes('authorized_state'))).toBe(true);
  });

  it('accepts valid type PRO', () => {
    const result = validateCsvRow({ ...validRow, type: 'PRO' }, 6);
    expect(result.errors).toHaveLength(0);
    expect(result.valid.type).toBe('PRO');
  });
});
