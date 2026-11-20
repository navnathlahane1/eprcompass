import { describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { isCapturedPayment, validSignature } from './capture';

const { rpc, fetchPayment, maybeSingle } = vi.hoisted(() => ({ rpc: vi.fn(), fetchPayment: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  rpc, from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
}) }));
vi.mock('razorpay', () => ({ default: class { payments = { fetch: fetchPayment }; } }));
vi.mock('../airtable', () => ({ syncPaymentToAirtable: vi.fn().mockResolvedValue(undefined) }));
import { POST as webhook } from '../../app/api/payment/webhook/route';
import { POST as verify } from '../../app/api/payment/verify/route';

const payment = { id: 'pay_test', order_id: 'order_test', amount: 10000, currency: 'INR', status: 'captured' };
const signature = (body: string) => crypto.createHmac('sha256', 'test-secret').update(body).digest('hex');

describe('payment delivery failures', () => {
  it('validates signatures and captured payment shape', () => {
    expect(validSignature('body', signature('body'), 'test-secret')).toBe(true);
    expect(validSignature('altered', signature('body'), 'test-secret')).toBe(false);
    expect(validSignature('body', 'broken', 'test-secret')).toBe(false);
    expect(isCapturedPayment({ ...payment, status: 'authorized' })).toBe(false);
  });
  it('returns a retryable failure when persistence fails', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'test-secret');
    rpc.mockResolvedValue({ error: { message: 'database unavailable' } });
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: payment } } });
    const response = await webhook(new NextRequest('http://localhost/api/payment/webhook', {
      method: 'POST', body, headers: { 'x-razorpay-signature': signature(body), 'x-razorpay-event-id': 'evt_test' },
    }));
    expect(response.status).toBe(500);
    expect(rpc).toHaveBeenCalledWith('record_captured_payment', expect.objectContaining({ p_event_id: 'evt_test' }));
    vi.unstubAllEnvs();
  });
  it('does not acknowledge a signed checkout for an unknown order', async () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test-secret');
    vi.stubEnv('RAZORPAY_KEY_ID', 'key');
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await verify(new NextRequest('http://localhost/api/payment/verify', {
      method: 'POST', body: JSON.stringify({ razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: signature('order_test|pay_test') }),
    }));
    expect(response.status).toBe(404);
    vi.unstubAllEnvs();
  });
  it('does not mark an authorized payment captured', async () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test-secret');
    vi.stubEnv('RAZORPAY_KEY_ID', 'key');
    maybeSingle.mockResolvedValue({ data: { id: 'id', amount_inr: 100 }, error: null });
    fetchPayment.mockResolvedValue({ ...payment, status: 'authorized' });
    rpc.mockClear();
    const response = await verify(new NextRequest('http://localhost/api/payment/verify', {
      method: 'POST', body: JSON.stringify({ razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: signature('order_test|pay_test') }),
    }));
    expect(response.status).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
