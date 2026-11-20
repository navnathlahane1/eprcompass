/**
 * GET /api/notifications/confirm?token=...
 * Confirms an email subscription via magic token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/notifications?sub=invalid', req.url));
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await sb
    .from('notification_subscriptions')
    .update({ confirmed: true })
    .eq('confirm_token', token)
    .eq('is_active', true);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  if (error) return NextResponse.redirect(`${baseUrl}/notifications?sub=error`);

  return NextResponse.redirect(`${baseUrl}/notifications?sub=confirmed`);
}
