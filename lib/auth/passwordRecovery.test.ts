import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/auth/forgot-password/route';

const request = (email = 'Person@Example.com', origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/auth/forgot-password', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ email }),
});

describe('password recovery', () => {
  const provider = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', provider);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key');
    provider.mockReset();
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('uses the EPR Compass reset URL and a normalized email without exposing account existence', async () => {
    provider.mockResolvedValue(Response.json({}));
    const response = await POST(request());
    const [url, options] = provider.mock.calls[0];
    expect(url.searchParams.get('redirect_to')).toBe('http://localhost:3000/auth/reset-password');
    expect(JSON.parse(options.body)).toEqual({ email: 'person@example.com' });
    expect((await response.json()).message).toContain('If an account exists');
  });
  it('preserves the email provider retry delay', async () => {
    provider.mockResolvedValue(Response.json({ code: 'over_email_send_rate_limit' }, { status: 429, headers: { 'Retry-After': '125' } }));
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('125');
    expect(await response.json()).toMatchObject({ retryAfter: 125, estimated: false });
  });
  it('labels a fallback wait as an estimate when the provider gives no retry delay', async () => {
    provider.mockResolvedValue(Response.json({ code: 'over_email_send_rate_limit' }, { status: 429 }));
    expect(await (await POST(request())).json()).toMatchObject({ retryAfter: 3600, estimated: true });
  });
  it('rejects cross-origin and invalid requests before contacting the provider', async () => {
    expect((await POST(request('test@example.com', 'https://untrusted.test'))).status).toBe(403);
    expect((await POST(request('invalid'))).status).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });
  it('handles an unavailable provider without leaking its error details', async () => {
    provider.mockRejectedValue(new Error('sensitive provider detail'));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('sensitive');
  });
});

