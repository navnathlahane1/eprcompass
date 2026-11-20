/**
 * POST /api/notifications/subscribe
 * Subscribe to EPR notification alerts via email
 *
 * Body: { email, name?, eprTypes[], frequency }
 * Sends confirmation email before activating subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const VALID_FREQUENCIES = ['instant', 'daily', 'weekly'];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const email       = (body.email || '').trim();
  const name        = (body.name || '').slice(0, 100) || undefined;
  const eprTypes    = Array.isArray(body.eprTypes)   ? body.eprTypes   : [];
  const authorities = Array.isArray(body.authorities) ? body.authorities : [];
  const frequency   = VALID_FREQUENCIES.includes(body.frequency) ? body.frequency : 'weekly';

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Upsert subscription record
  const { data: sub, error } = await sb
    .from('notification_subscriptions')
    .upsert(
      {
        email,
        name:        name || null,
        epr_types:   eprTypes,
        authorities: authorities,
        frequency,
        is_active:   true,
        confirmed:   false,    // requires email confirmation
      },
      { onConflict: 'email' }
    )
    .select('id, confirm_token, confirmed')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send confirmation email via backend SMTP (best-effort)
  if (!sub.confirmed) {
    await sendConfirmationEmail(email, name, sub.confirm_token, eprTypes, frequency);
  }

  return NextResponse.json({
    ok: true,
    message: sub.confirmed
      ? 'Your subscription preferences have been updated.'
      : 'Please check your email to confirm your subscription.',
  });
}

async function sendConfirmationEmail(
  email:    string,
  name:     string | undefined,
  token:    string,
  eprTypes: string[],
  frequency: string
) {
  const baseUrl      = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const confirmUrl   = `${baseUrl}/api/notifications/confirm?token=${token}`;
  const unsubUrl     = `${baseUrl}/api/notifications/unsubscribe?token=${token}`;
  const eprLabel     = eprTypes.length > 0 ? eprTypes.join(', ') : 'All EPR Types';

  try {
    // Use backend SMTP via fetch if available
    const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl) {
      await fetch(`${backendUrl}/api/email/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          to:      email,
          subject: '✅ Confirm your EPR Notification subscription',
          html: `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
              <div style="background:#1d4ed8;padding:24px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0;font-size:20px">EPR Notification Alerts</h2>
              </div>
              <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
                <p style="color:#334155">Hi ${name || 'there'},</p>
                <p style="color:#334155">
                  You've subscribed to receive <strong>${frequency}</strong> alerts for:
                  <strong style="color:#1d4ed8">${eprLabel}</strong>
                </p>
                <p style="color:#334155">Please confirm your subscription by clicking the button below:</p>
                <a href="${confirmUrl}"
                   style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0">
                  ✅ Confirm Subscription
                </a>
                <p style="color:#94a3b8;font-size:12px;margin-top:24px">
                  If you didn't request this, you can safely ignore this email.
                  <a href="${unsubUrl}" style="color:#94a3b8">Unsubscribe</a>
                </p>
              </div>
            </div>
          `,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }
}
