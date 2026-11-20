import { describe, expect, it } from 'vitest';
import { dashboardBaseline } from './dashboardState';

describe('dashboard baseline', () => {
  it('does not treat empty records as a completed assessment', () => {
    expect(dashboardBaseline({ scheduled: 0, targets: 0, failed: false })).toBe('unassessed');
  });
  it('never reports success for failed reads', () => {
    expect(dashboardBaseline({ scheduled: 2, targets: 1, failed: true })).toBe('unavailable');
  });
  it('recognizes recorded schedules and targets', () => {
    expect(dashboardBaseline({ scheduled: 1, targets: 0, failed: false })).toBe('recorded');
    expect(dashboardBaseline({ scheduled: 0, targets: 1, failed: false })).toBe('recorded');
  });
});
