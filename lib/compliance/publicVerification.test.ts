import { describe, expect, it } from 'vitest';
import { publicStatus, publicVerification } from './publicVerification';

describe('public verification', () => {
  const row = (status: string, due_date = '2025-01-01') => ({ status, due_date, waste_category: 'plastic' });
  it('does not let historical approvals mask overdue work', () => {
    expect(publicStatus([row('Approved'), row('Overdue')])).toBe('Overdue');
    expect(publicStatus([row('Approved'), row('Pending')], '2026-01-01')).toBe('Overdue');
  });
  it('does not equate a workflow approval with verified compliance', () => {
    expect(publicStatus([row('Approved')])).toBe('Recorded filings');
    expect(publicStatus([])).toBe('Not verified');
  });
  it('never substitutes deadlines for certificate or completion dates', () => {
    expect(publicVerification([row('Filed')])).toMatchObject({ certificate_valid_until: null, last_compliance_date: null });
  });
});
