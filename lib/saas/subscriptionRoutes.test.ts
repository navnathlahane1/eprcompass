import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { rejectUnsafeWorkspaceWrite } from './requestGuard';

const { rpc, owner } = vi.hoisted(() => ({ rpc: vi.fn(), owner: vi.fn() }));
vi.mock('./server', () => ({ workspaceAdmin: () => ({ rpc }), workspaceOwner: owner }));
import { POST as webhook } from '../../app/api/workspaces/subscription-webhook/route';
import { POST as subscribe } from '../../app/api/workspaces/subscribe/route';
import { POST as cancel } from '../../app/api/workspaces/cancel-subscription/route';

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('RAZORPAY_SUBSCRIPTION_WEBHOOK_SECRET', 'test-secret'); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('workspace write protection', () => {
  it('accepts same-origin JSON and rejects cross-site and non-JSON writes', () => {
    const request = (headers: Record<string,string>) => new NextRequest('http://localhost:3000/api/workspaces', { method: 'POST', headers });
    expect(rejectUnsafeWorkspaceWrite(request({ origin: 'http://localhost:3000', 'content-type': 'application/json; charset=utf-8' }))).toBeNull();
    expect(rejectUnsafeWorkspaceWrite(request({ origin: 'https://untrusted.example', 'content-type': 'application/json' }))?.status).toBe(403);
    expect(rejectUnsafeWorkspaceWrite(request({ 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' }))?.status).toBe(403);
    expect(rejectUnsafeWorkspaceWrite(request({ 'content-type': 'text/plain' }))?.status).toBe(415);
  });
  it('requires owner access for checkout and cancellation', async () => {
    owner.mockResolvedValue(null);
    const request = () => new NextRequest('http://localhost:3000/api/workspaces/subscribe', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: 'workspace', planCode: 'importer', cycle: 'monthly', requestId: '12345678-1234-1234-1234-123456789012' }),
    });
    expect((await subscribe(request())).status).toBe(403);
    expect((await cancel(request())).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('subscription webhook', () => {
  const body = JSON.stringify({ event: 'subscription.activated', created_at: 1800000000, payload: { subscription: { entity: {
    id: 'sub_test', plan_id: 'plan_test', status: 'active', current_start: 1800000000, current_end: 1802592000,
  } } } });
  const request = (signature = createHmac('sha256', 'test-secret').update(body).digest('hex'), eventId = 'evt_test') =>
    new NextRequest('http://localhost:3000/api/workspaces/subscription-webhook', {
      method: 'POST', body, headers: { 'x-razorpay-signature': signature, 'x-razorpay-event-id': eventId },
    });
  it('rejects an invalid signature before persistence', async () => {
    expect((await webhook(request('invalid'))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('requires the event identity', async () => {
    expect((await webhook(request(undefined, ''))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('commits signed events through the transactional RPC', async () => {
    rpc.mockResolvedValue({ error: null });
    expect((await webhook(request())).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('apply_workspace_subscription_event', expect.objectContaining({ p_subscription_id: 'sub_test', p_event_id: 'evt_test', p_status: 'active' }));
  });
  it('returns a retryable error instead of acknowledging a failed commit', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    rpc.mockResolvedValue({ error: { message: 'Unavailable' } });
    expect((await webhook(request())).status).toBe(500);
  });
});
