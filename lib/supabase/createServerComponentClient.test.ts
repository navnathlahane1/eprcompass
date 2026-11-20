import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { cookies, headers, createClient, getUser } = vi.hoisted(() => ({ cookies: vi.fn(), headers: vi.fn(), createClient: vi.fn(), getUser: vi.fn() }));
vi.mock('next/headers', () => ({ cookies, headers }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
import { createServerComponentClient } from './createServerComponentClient';

describe('server session authentication', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-key');
    cookies.mockResolvedValue({ getAll: () => [{ name: 'sb-access-token', value: 'cookie.jwt.token' }] });
    headers.mockResolvedValue(new Headers());
    getUser.mockReset(); createClient.mockReset();
    createClient.mockImplementation(() => ({ auth: { getUser } }));
  });
  afterEach(() => vi.unstubAllEnvs());
  it('prefers a current bearer token over stale cookies and validates it through Supabase', async () => {
    headers.mockResolvedValue(new Headers({ authorization: 'Bearer current-token' }));
    const client = await createServerComponentClient();
    await client.auth.getUser();
    expect(getUser).toHaveBeenCalledWith('current-token');
    expect(createClient.mock.calls[0][2].global.headers.Authorization).toBe('Bearer current-token');
  });
  it('retains cookie authentication for server-rendered pages', async () => {
    const client = await createServerComponentClient();
    await client.auth.getUser();
    expect(getUser).toHaveBeenCalledWith('cookie.jwt.token');
  });
  it('does not manufacture an authenticated session when credentials are missing', async () => {
    cookies.mockResolvedValue({ getAll: () => [] });
    await createServerComponentClient();
    expect(createClient.mock.calls[0][2].global).toBeUndefined();
    expect(getUser).not.toHaveBeenCalled();
  });
});
