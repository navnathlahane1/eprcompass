import { describe, expect, it } from 'vitest';
import { safeLoginRedirect } from './loginRedirect';

describe('login destinations', () => {
  const home = '/partner/dashboard';
  it('preserves a valid portal destination and query', () => {
    expect(safeLoginRedirect('/partner/clients?filter=active', home)).toBe('/partner/clients?filter=active');
  });
  it.each([null, '', 'https://evil.example', '//evil.example', '/\\evil.example', '/partner/../admin/users', '/partner/login', '/partner/login/', '/admin/users', '/partnerish/clients', '/%2f%2fevil.example', '/partner/%2e%2e/admin'])('rejects unsafe or looping destination %s', value => {
    expect(safeLoginRedirect(value, home)).toBe(home);
  });
});
