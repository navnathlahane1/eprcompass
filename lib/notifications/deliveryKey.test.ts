import { expect, it } from 'vitest';
import { reminderDeliveryKey } from './deliveryKey';
import { reminderPeriod } from './reminderPeriod';

it('deduplicates retries while separating recipients, resources and reminder days', () => {
  const key = reminderDeliveryKey('client', 'payment', 'invoice-1', '2026-09-12');
  expect(reminderDeliveryKey('client', 'payment', 'invoice-1', '2026-09-12')).toBe(key);
  expect(reminderDeliveryKey('manager', 'payment', 'invoice-1', '2026-09-12')).not.toBe(key);
  expect(reminderDeliveryKey('client', 'payment', 'invoice-2', '2026-09-12')).not.toBe(key);
  expect(reminderDeliveryKey('client', 'payment', 'invoice-1', '2026-09-13')).not.toBe(key);
});

it('uses UTC week boundaries and supports opting out of scheduled reminders', () => {
  expect(reminderPeriod('off',new Date('2026-09-12T01:00:00Z'))).toBeNull();
  expect(reminderPeriod('daily',new Date('2026-09-12T01:00:00Z'))).toBe('day:2026-09-12');
  expect(reminderPeriod('weekly',new Date('2026-09-12T01:00:00Z'))).toBe('week:2026-09-07');
  expect(reminderPeriod('weekly',new Date('2026-09-13T23:59:00Z'))).toBe('week:2026-09-07');
  expect(reminderPeriod('weekly',new Date('2026-09-14T00:00:00Z'))).toBe('week:2026-09-14');
});
