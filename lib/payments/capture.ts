import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export function validSignature(body: string, signature: string, secret: string): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export type CapturedPayment = {
  id: string; order_id: string; amount: number; currency: string; status: string;
};

export function isCapturedPayment(value: unknown): value is CapturedPayment {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<CapturedPayment>;
  return typeof p.id === 'string' && p.id.startsWith('pay_')
    && typeof p.order_id === 'string' && p.order_id.startsWith('order_')
    && Number.isSafeInteger(p.amount) && p.amount > 0
    && p.currency === 'INR' && p.status === 'captured';
}

export async function recordCapture(db: SupabaseClient, eventId: string, payment: CapturedPayment) {
  const { error } = await db.rpc('record_captured_payment', {
    p_event_id: eventId, p_order_id: payment.order_id, p_payment_id: payment.id,
    p_amount_paise: payment.amount, p_currency: payment.currency,
  });
  if (error) throw new Error('Payment persistence failed', { cause: error });
}
