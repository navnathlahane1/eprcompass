import { describe, it, expect } from 'vitest';
import {
  matchRecyclerToTender,
  isTenderExpired,
  daysUntilTenderDeadline,
  tenderDeadlineUrgency,
  type RecyclerProfile,
  type TenderMatchInput,
} from './tenderService';

const baseRecycler: RecyclerProfile = {
  eprCategories: ['Plastic', 'E-Waste'],
  authorizedStates: ['Maharashtra', 'Delhi'],
  verificationStatus: 'VERIFIED',
  certifications: ['ISO 14001', 'CPCB Auth'],
  capacityPerMonth: 100,
  overallRating: 4.2,
};

const baseTender: TenderMatchInput = {
  eprType: 'Plastic',
  statesCovered: ['Maharashtra'],
  eligibilityCriteria: {},
};

describe('matchRecyclerToTender', () => {
  it('matches a fully eligible recycler and gives high score', () => {
    const result = matchRecyclerToTender(baseRecycler, baseTender);
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it('disqualifies recycler with wrong EPR category', () => {
    const result = matchRecyclerToTender(
      { ...baseRecycler, eprCategories: ['Battery'] },
      baseTender
    );
    expect(result.matched).toBe(false);
    expect(result.disqualifiers.some((d) => d.includes('Plastic'))).toBe(true);
  });

  it('disqualifies recycler with no state overlap', () => {
    const result = matchRecyclerToTender(
      { ...baseRecycler, authorizedStates: ['Kerala'] },
      baseTender
    );
    expect(result.matched).toBe(false);
    expect(result.disqualifiers.some((d) => d.includes('states'))).toBe(true);
  });

  it('disqualifies unverified recycler when verification required', () => {
    const result = matchRecyclerToTender(
      { ...baseRecycler, verificationStatus: 'PENDING' },
      { ...baseTender, eligibilityCriteria: { mustBeVerified: true } }
    );
    expect(result.matched).toBe(false);
  });

  it('disqualifies recycler below minimum rating', () => {
    const result = matchRecyclerToTender(
      { ...baseRecycler, overallRating: 2.5 },
      { ...baseTender, eligibilityCriteria: { minRating: 4.0 } }
    );
    expect(result.matched).toBe(false);
    expect(result.disqualifiers.some((d) => d.includes('Rating'))).toBe(true);
  });

  it('disqualifies recycler below minimum capacity', () => {
    const result = matchRecyclerToTender(
      { ...baseRecycler, capacityPerMonth: 5 },
      { ...baseTender, eligibilityCriteria: { minCapacityPerMonth: 100 } }
    );
    expect(result.matched).toBe(false);
  });

  it('disqualifies recycler missing certifications', () => {
    const result = matchRecyclerToTender(
      { ...baseRecycler, certifications: [] },
      { ...baseTender, eligibilityCriteria: { requiredCertifications: ['ISO 14001'] } }
    );
    expect(result.matched).toBe(false);
    expect(result.disqualifiers.some((d) => d.includes('ISO 14001'))).toBe(true);
  });

  it('scores partial state coverage less than full coverage', () => {
    const partial = matchRecyclerToTender(
      { ...baseRecycler, authorizedStates: ['Maharashtra'] },
      { ...baseTender, statesCovered: ['Maharashtra', 'Delhi', 'Gujarat'] }
    );
    const full = matchRecyclerToTender(
      { ...baseRecycler, authorizedStates: ['Maharashtra', 'Delhi', 'Gujarat'] },
      { ...baseTender, statesCovered: ['Maharashtra', 'Delhi', 'Gujarat'] }
    );
    expect(full.score).toBeGreaterThan(partial.score);
  });

  it('does not exceed score of 100', () => {
    const result = matchRecyclerToTender(baseRecycler, {
      ...baseTender,
      eligibilityCriteria: { requiredCertifications: ['ISO 14001', 'CPCB Auth'] },
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('isTenderExpired', () => {
  it('returns true for past deadline', () => {
    expect(isTenderExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
  });

  it('returns false for future deadline', () => {
    expect(isTenderExpired(new Date(Date.now() + 86_400_000).toISOString())).toBe(false);
  });
});

describe('daysUntilTenderDeadline', () => {
  it('returns negative value for expired tender', () => {
    const past = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(daysUntilTenderDeadline(past)).toBeLessThan(0);
  });

  it('returns positive value for future tender', () => {
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(daysUntilTenderDeadline(future)).toBeGreaterThan(0);
  });
});

describe('tenderDeadlineUrgency', () => {
  it('returns expired for past deadline', () => {
    expect(tenderDeadlineUrgency(new Date(Date.now() - 1000).toISOString())).toBe('expired');
  });

  it('returns critical within 24h', () => {
    expect(tenderDeadlineUrgency(new Date(Date.now() + 12 * 3_600_000).toISOString())).toBe('critical');
  });

  it('returns warning within 7 days (but beyond critical)', () => {
    expect(tenderDeadlineUrgency(new Date(Date.now() + 5 * 86_400_000).toISOString())).toBe('warning');
  });

  it('returns normal for distant deadline', () => {
    expect(tenderDeadlineUrgency(new Date(Date.now() + 14 * 86_400_000).toISOString())).toBe('normal');
  });
});
