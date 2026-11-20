import { describe, expect, it } from 'vitest';
import { activeNavigationId } from './navigation';
import { inCurrentFinancialYear } from './dashboardPeriods';

describe('admin navigation selection', () => {
  const items = [
    { id: 'tasks', href: '/admin/tasks' },
    { id: 'projects', href: '/admin/tasks/projects' },
    { id: 'my-tasks', href: '/admin/tasks/projects/my-tasks' },
    { id: 'notifications', href: '/admin/notifications' },
    { id: 'duplicate', href: '/admin/notifications' },
    { id: 'review', href: '/admin/notifications?status=draft' },
  ];
  it('selects the most specific matching route', () => {
    expect(activeNavigationId('/admin/tasks/projects/my-tasks', '', items)).toBe('my-tasks');
    expect(activeNavigationId('/admin/tasks/projects/abc', '', items)).toBe('projects');
  });
  it('does not match a partial route segment', () => {
    expect(activeNavigationId('/admin/tasks-extra', '', items)).toBeUndefined();
  });
  it('selects query-specific entries only when their filters match', () => {
    expect(activeNavigationId('/admin/notifications', 'status=draft', items)).toBe('review');
    expect(activeNavigationId('/admin/notifications', 'status=published', items)).toBe('notifications');
  });
  it('selects only the first canonical entry for duplicate URLs', () => {
    expect(activeNavigationId('/admin/notifications', '', items)).toBe('notifications');
  });
});

describe('dashboard financial-year period', () => {
  const rows = ['2025-03', '2025-04', '2026-03', '2026-04', '2027-03', '2027-04'].map(month => ({ month }));
  it('includes April through March and excludes adjacent years', () => {
    expect(inCurrentFinancialYear(rows, new Date(2026, 8, 12))).toEqual([{ month: '2026-04' }, { month: '2027-03' }]);
  });
  it('uses the previous April before the rollover', () => {
    expect(inCurrentFinancialYear(rows, new Date(2026, 2, 31))).toEqual([{ month: '2025-04' }, { month: '2026-03' }]);
  });
});
