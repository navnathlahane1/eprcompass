/**
 * GET /api/notifications/unsubscribe?token=...
 * One-click unsubscribe from notification alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  await sb
    .from('notification_subscriptions')
    .update({ is_active: false })
    .eq('confirm_token', token);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/notifications?sub=unsubscribed`);
}
