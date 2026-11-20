import { describe, expect, it } from 'vitest';
import { operationalInsights } from './operationalInsights';

describe('operational rules fallback', () => {
  it('reports only finite positive alert counts from the current recorded snapshot', () => {
    const rows = operationalInsights({ topAlerts: { overdueFilings: 2, deadlines30d: '3', overdueInvoices: -1, highRiskRecyclers: Number.NaN } });
    expect(rows.map(row => row.title)).toEqual(['Overdue filings', 'Upcoming deadlines']);
    expect(rows[0].detail).toBe('2 recorded in the current dashboard snapshot.');
    expect(rows.every(row => row.priority === 1 && row.type === 'alert')).toBe(true);
  });
  it('labels recorded recycler flags as risks without claiming model analysis', () => {
    expect(operationalInsights({ topAlerts: { highRiskRecyclers: 1 } })).toEqual([{ type: 'risk', priority: 1, title: 'Recycler risk review', detail: '1 recorded in the current dashboard snapshot.', action: 'Review flagged recycler records and supporting evidence.' }]);
  });
  it.each([undefined, null, {}, { topAlerts: { overdueFilings: 0, deadlines30d: 'invalid', overdueInvoices: Infinity, highRiskRecyclers: -2 } }])('does not claim compliance when input is empty or invalid: %j', context => {
    const rows = operationalInsights(context);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: 'trend', priority: 3, title: 'Review dashboard records' });
    expect(rows[0].detail).toContain('does not establish compliance or data completeness');
  });
});
