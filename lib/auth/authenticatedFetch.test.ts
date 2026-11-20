import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: { getSession } } }));
import { authenticatedFetch } from './authenticatedFetch';

describe('authenticated local API requests', () => {
  const request = vi.fn();
  beforeEach(() => { request.mockReset(); getSession.mockReset(); vi.stubGlobal('fetch', request); });
  afterEach(() => vi.unstubAllGlobals());
  it('attaches the current token while preserving request headers and body', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'current-token' } }, error: null });
    request.mockResolvedValue(Response.json({ ok: true }));
    await authenticatedFetch('/api/analytics/dashboard/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const [url, init] = request.mock.calls[0];
    expect(url).toBe('/api/analytics/dashboard/summary');
    expect(init.headers.get('authorization')).toBe('Bearer current-token');
    expect(init.headers.get('content-type')).toBe('application/json');
    expect(init).toMatchObject({ method: 'POST', body: '{}', credentials: 'same-origin', cache: 'no-store' });
  });
  it('never forwards session tokens to external or non-API URLs', async () => {
    for (const url of ['https://other.test/api/data', '//other.test/api/data', '/admin/dashboard']) {
      await expect(authenticatedFetch(url)).rejects.toThrow('local API route');
    }
    expect(getSession).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
  it('fails without a network request on a session error', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: new Error('expired') });
    await expect(authenticatedFetch('/api/data')).rejects.toThrow('sign in again');
    expect(request).not.toHaveBeenCalled();
  });
  it('allows server-side authorization to reject a signed-out request', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    request.mockResolvedValue(Response.json({}, { status: 401 }));
    expect((await authenticatedFetch('/api/data')).status).toBe(401);
    expect(request.mock.calls[0][1].headers.has('authorization')).toBe(false);
  });
});
