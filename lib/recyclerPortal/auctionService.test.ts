import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateAuctionBid,
  shouldExtendAuction,
  computeExtendedEndTime,
  computeMyRank,
  formatCountdown,
  auctionCountdownUrgency,
  type AuctionState,
} from './auctionService';

const now = () => Date.now();

function makeAuction(overrides: Partial<AuctionState> = {}): AuctionState {
  return {
    id: 'test-auction',
    auctionType: 'REVERSE',
    status: 'LIVE',
    startTime: new Date(now() - 3_600_000).toISOString(),
    endTime: new Date(now() + 3_600_000).toISOString(),
    extensionMinutes: 5,
    ...overrides,
  };
}

describe('validateAuctionBid — REVERSE', () => {
  it('accepts valid lower bid', () => {
    const result = validateAuctionBid(90, makeAuction(), 100);
    expect(result.valid).toBe(true);
  });

  it('rejects bid equal to current best', () => {
    const result = validateAuctionBid(100, makeAuction(), 100);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/lower/i);
  });

  it('rejects bid higher than current best', () => {
    const result = validateAuctionBid(110, makeAuction(), 100);
    expect(result.valid).toBe(false);
  });

  it('rejects bid below reserve price', () => {
    const result = validateAuctionBid(5, makeAuction({ reservePrice: 10 }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/reserve/i);
  });

  it('rejects zero bid', () => {
    const result = validateAuctionBid(0, makeAuction());
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/positive/i);
  });

  it('rejects negative bid', () => {
    const result = validateAuctionBid(-5, makeAuction());
    expect(result.valid).toBe(false);
  });
});

describe('validateAuctionBid — FORWARD', () => {
  it('accepts valid higher bid', () => {
    const result = validateAuctionBid(110, makeAuction({ auctionType: 'FORWARD' }), 100);
    expect(result.valid).toBe(true);
  });

  it('rejects lower bid in FORWARD auction', () => {
    const result = validateAuctionBid(90, makeAuction({ auctionType: 'FORWARD' }), 100);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/higher/i);
  });
});

describe('validateAuctionBid — terminal statuses', () => {
  for (const status of ['SCHEDULED', 'CLOSED', 'AWARDED', 'CANCELLED'] as const) {
    it(`rejects bid when status is ${status}`, () => {
      const result = validateAuctionBid(50, makeAuction({ status }));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(new RegExp(status, 'i'));
    });
  }
});

describe('validateAuctionBid — no current best bid', () => {
  it('accepts first bid in REVERSE auction without current best', () => {
    const result = validateAuctionBid(100, makeAuction());
    expect(result.valid).toBe(true);
  });

  it('accepts first bid in FORWARD auction without current best', () => {
    const result = validateAuctionBid(100, makeAuction({ auctionType: 'FORWARD' }));
    expect(result.valid).toBe(true);
  });
});

describe('shouldExtendAuction', () => {
  it('returns true when bid is placed within trigger window', () => {
    const endSoon = new Date(now() + 3 * 60_000).toISOString(); // 3 min from now
    expect(shouldExtendAuction(endSoon, 5)).toBe(true);
  });

  it('returns false when bid is placed outside trigger window', () => {
    const endLater = new Date(now() + 20 * 60_000).toISOString(); // 20 min from now
    expect(shouldExtendAuction(endLater, 5)).toBe(false);
  });

  it('returns false when auction already ended', () => {
    const ended = new Date(now() - 1000).toISOString();
    expect(shouldExtendAuction(ended, 5)).toBe(false);
  });
});

describe('computeExtendedEndTime', () => {
  it('adds the specified minutes', () => {
    const base = new Date(now()).toISOString();
    const extended = computeExtendedEndTime(base, 10);
    const diff = new Date(extended).getTime() - new Date(base).getTime();
    expect(diff).toBe(10 * 60 * 1000);
  });
});

describe('computeMyRank', () => {
  it('returns rank 1 for best bid in REVERSE', () => {
    expect(computeMyRank(50, [50, 80, 100], 'REVERSE')).toBe(1);
  });

  it('returns rank 3 for worst bid in REVERSE', () => {
    expect(computeMyRank(100, [50, 80, 100], 'REVERSE')).toBe(3);
  });

  it('returns rank 1 for best bid in FORWARD', () => {
    expect(computeMyRank(100, [50, 80, 100], 'FORWARD')).toBe(1);
  });

  it('returns rank 3 for worst bid in FORWARD', () => {
    expect(computeMyRank(50, [50, 80, 100], 'FORWARD')).toBe(3);
  });

  it('returns length+1 if bid not found', () => {
    expect(computeMyRank(999, [50, 80], 'REVERSE')).toBe(3);
  });
});

describe('auctionCountdownUrgency', () => {
  it('returns ended when time is past', () => {
    expect(auctionCountdownUrgency(new Date(now() - 1000).toISOString())).toBe('ended');
  });

  it('returns critical within last 5 minutes', () => {
    expect(auctionCountdownUrgency(new Date(now() + 3 * 60_000).toISOString())).toBe('critical');
  });

  it('returns warning within 30 minutes', () => {
    expect(auctionCountdownUrgency(new Date(now() + 20 * 60_000).toISOString())).toBe('warning');
  });

  it('returns normal for distant end', () => {
    expect(auctionCountdownUrgency(new Date(now() + 2 * 3_600_000).toISOString())).toBe('normal');
  });
});

describe('formatCountdown', () => {
  it('returns 00:00:00 for past end time', () => {
    expect(formatCountdown(new Date(now() - 1000).toISOString())).toBe('00:00:00');
  });

  it('formats exactly 1 hour as 01:00:00', () => {
    const future = new Date(now() + 3_600_000).toISOString();
    // Allow ±1 second tolerance for test execution time
    const result = formatCountdown(future);
    expect(result).toMatch(/^00:59:|^01:00:00/);
  });
});
