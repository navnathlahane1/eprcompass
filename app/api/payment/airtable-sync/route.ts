/**
 * Supabase Database Webhook → Airtable real-time sync
 *
 * Set up in Supabase: Database → Webhooks → Create Webhook
 *   Table: payments
 *   Events: UPDATE
 *   URL: http://localhost:3000/api/payment/airtable-sync
 *   HTTP Method: POST
 *   Headers: { "x-webhook-secret": "<SUPABASE_WEBHOOK_SECRET>" }
 *
 * When the team updates Status, Assigned To, Priority, etc. in Supabase,
 * this endpoint automatically reflects those changes in Airtable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncCrmFields, syncPaymentToAirtable } from '@/lib/airtable';

export const runtime = 'nodejs';

const CRM_FIELD_MAP: Record<string, string> = {
  assigned_to:         'Assigned To',
  follow_up_date:      'Follow-up Date',
  priority:            'Priority',
  registration_status: 'Registration Status',
  remarks:             'Remarks',
};

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (process.env.SUPABASE_WEBHOOK_SECRET && secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false }, { status: 400 });

    const record    = body.record    ?? body.new ?? {};
    const oldRecord = body.old_record ?? body.old ?? {};

    const phone = record.customer_phone as string | undefined;
    const email = record.customer_email as string | undefined;

    if (!email) return NextResponse.json({ success: true, message: 'No email — skipped' });

    // If payment just captured, sync payment fields
    if (record.status === 'captured' && oldRecord.status !== 'captured') {
      await syncPaymentToAirtable(phone, email, {
        paymentStatus:     'Paid',
        paymentAmount:     record.amount_inr,
        razorpayPaymentId: record.razorpay_payment_id,
        razorpayOrderId:   record.razorpay_order_id,
        paymentDate:       record.updated_at,
      });
      return NextResponse.json({ success: true, action: 'payment-synced' });
    }

    // Sync only fields that changed
    const changedFields: Record<string, unknown> = {};
    for (const [dbField, airtableField] of Object.entries(CRM_FIELD_MAP)) {
      if (record[dbField] !== undefined && record[dbField] !== oldRecord[dbField]) {
        changedFields[airtableField] = record[dbField];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      return NextResponse.json({ success: true, message: 'No relevant changes' });
    }

    await syncCrmFields(phone, email, changedFields);
    return NextResponse.json({ success: true, fieldsUpdated: Object.keys(changedFields) });
  } catch (err) {
    console.error('[airtable-sync webhook]', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
