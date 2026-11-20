import { describe, expect, it } from 'vitest';
import { getSessionToken } from './sessionToken';

describe('session cookies', () => {
  const url = 'https://project.supabase.co';
  it('supports the existing explicit JWT cookie', () => {
    expect(getSessionToken([{ name: 'sb-access-token', value: 'abc.def.ghi' }], url)).toBe('abc.def.ghi');
  });
  it('reassembles and decodes project-specific SSR chunks', () => {
    const encoded = 'base64-' + Buffer.from(JSON.stringify({ access_token: 'token' })).toString('base64url');
    expect(getSessionToken([
      { name: 'sb-project-auth-token.1', value: encoded.slice(15) },
      { name: 'sb-other-auth-token.0', value: 'unrelated' },
      { name: 'sb-project-auth-token.0', value: encoded.slice(0, 15) },
    ], url)).toBe('token');
  });
  it('rejects missing chunks and ambiguous projects', () => {
    expect(getSessionToken([{ name: 'sb-project-auth-token.1', value: 'abc.def.ghi' }], url)).toBeUndefined();
    expect(getSessionToken([
      { name: 'sb-a-auth-token', value: 'abc.def.ghi' },
      { name: 'sb-b-auth-token', value: 'abc.def.ghi' },
    ])).toBeUndefined();
  });
  it('rejects malformed cookies', () => {
    expect(getSessionToken([{ name: 'sb-access-token', value: '{broken' }], url)).toBeUndefined();
  });
});
