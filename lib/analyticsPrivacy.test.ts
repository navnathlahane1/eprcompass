import { expect, it } from 'vitest';
import { safeAnalyticsProperties, analyticsAllowed } from './analyticsPrivacy';

it('does not assume analytics consent outside a browser', () => { expect(analyticsAllowed()).toBe(false); });
it('keeps bounded operational properties and removes contact details, payloads and tokens', () => {
  expect(safeAnalyticsProperties({ email: 'person@example.com', full_name: 'Name', document: { body: 'private' }, source: '/signup?token=secret', purpose: 'company', status: 'pending', count: 2, amount: Infinity })).toEqual({ purpose: 'company', status: 'pending', count: 2 });
});
