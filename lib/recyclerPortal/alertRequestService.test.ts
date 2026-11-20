import { describe, it, expect } from 'vitest';
import {
  matchAlertToRecycler,
  urgencyToColor,
  computeRequestExpiry,
  isRequestExpired,
  daysUntilRequestExpiry,
  canStartNewRound,
  type CpcbAlertInput,
  type RecyclerAlertProfile,
} from './alertRequestService';

const baseRecycler: RecyclerAlertProfile = {
  eprCategories: ['Plastic', 'E-Waste'],
  authorizedStates: ['Maharashtra', 'Delhi'],
};

describe('matchAlertToRecycler', () => {
  it('matches global alert (no eprTypes or states)', () => {
    const alert: CpcbAlertInput = { eprTypes: [], affectedStates: [], affectedCategories: [] };
    const result = matchAlertToRecycler(alert, baseRecycler);
    expect(result.matched).toBe(true);
    expect(result.matchedTypes).toEqual([]);
    expect(result.matchedStates).toEqual([]);
  });

  it('matches when eprType overlaps', () => {
    const alert: CpcbAlertInput = { eprTypes: ['Plastic'], affectedStates: [], affectedCategories: [] };
    const result = matchAlertToRecycler(alert, baseRecycler);
    expect(result.matched).toBe(true);
    expect(result.matchedTypes).toContain('Plastic');
  });

  it('matches when state overlaps (even if no type match)', () => {
    const alert: CpcbAlertInput = { eprTypes: ['Battery'], affectedStates: ['Maharashtra'], affectedCategories: [] };
    const result = matchAlertToRecycler(alert, baseRecycler);
    expect(result.matched).toBe(true);
    expect(result.matchedStates).toContain('Maharashtra');
  });

  it('does not match when neither type nor state overlaps', () => {
    const alert: CpcbAlertInput = { eprTypes: ['Tyre'], affectedStates: ['Gujarat'], affectedCategories: [] };
    const result = matchAlertToRecycler(alert, baseRecycler);
    expect(result.matched).toBe(false);
  });

  it('returns only overlapping types and states', () => {
    const alert: CpcbAlertInput = {
      eprTypes: ['Plastic', 'Battery'],
      affectedStates: ['Maharashtra', 'Gujarat'],
      affectedCategories: [],
    };
    const result = matchAlertToRecycler(alert, baseRecycler);
    expect(result.matchedTypes).toEqual(['Plastic']);
    expect(result.matchedStates).toEqual(['Maharashtra']);
  });
});

describe('urgencyToColor', () => {
  it('returns red classes for CRITICAL', () => {
    expect(urgencyToColor('CRITICAL')).toMatch(/red/);
  });

  it('returns orange classes for HIGH', () => {
    expect(urgencyToColor('HIGH')).toMatch(/orange/);
  });

  it('returns yellow classes for MEDIUM', () => {
    expect(urgencyToColor('MEDIUM')).toMatch(/yellow/);
  });

  it('returns blue classes for LOW', () => {
    expect(urgencyToColor('LOW')).toMatch(/blue/);
  });

  it('returns gray for unknown urgency', () => {
    expect(urgencyToColor('UNKNOWN')).toMatch(/gray/);
  });
});

describe('computeRequestExpiry', () => {
  it('adds the correct number of days', () => {
    const base = '2024-01-01T00:00:00.000Z';
    const result = computeRequestExpiry(base, 7);
    expect(result).toBe('2024-01-08T00:00:00.000Z');
  });

  it('works for 0 days', () => {
    const base = '2024-06-01T12:00:00.000Z';
    expect(computeRequestExpiry(base, 0)).toBe(base);
  });
});

describe('isRequestExpired', () => {
  it('returns true for past timestamp', () => {
    expect(isRequestExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
  });

  it('returns false for future timestamp', () => {
    expect(isRequestExpired(new Date(Date.now() + 86_400_000).toISOString())).toBe(false);
  });
});

describe('daysUntilRequestExpiry', () => {
  it('returns negative value for past expiry', () => {
    const past = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(daysUntilRequestExpiry(past)).toBeLessThan(0);
  });

  it('returns approximately correct days for future expiry', () => {
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(daysUntilRequestExpiry(future)).toBe(5);
  });
});

describe('canStartNewRound', () => {
  it('allows new round when RESPONDED and under limit', () => {
    const result = canStartNewRound(2, 5, 'RESPONDED');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('allows new round when NEGOTIATING', () => {
    const result = canStartNewRound(1, 5, 'NEGOTIATING');
    expect(result.allowed).toBe(true);
  });

  it('blocks when max rounds reached', () => {
    const result = canStartNewRound(5, 5, 'NEGOTIATING');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Maximum/);
  });

  it('blocks when status is SENT (not yet responded)', () => {
    const result = canStartNewRound(0, 5, 'SENT');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/SENT/);
  });

  it('blocks when status is ACCEPTED', () => {
    const result = canStartNewRound(2, 5, 'ACCEPTED');
    expect(result.allowed).toBe(false);
  });

  it('blocks when status is DECLINED', () => {
    const result = canStartNewRound(2, 5, 'DECLINED');
    expect(result.allowed).toBe(false);
  });

  it('blocks when status is EXPIRED', () => {
    const result = canStartNewRound(1, 5, 'EXPIRED');
    expect(result.allowed).toBe(false);
  });

  it('round 0 is allowed under limit', () => {
    const result = canStartNewRound(0, 5, 'RESPONDED');
    expect(result.allowed).toBe(true);
  });
});
