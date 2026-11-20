import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeVariant(value: unknown) {
  const normalized = String(value || 'a').trim().toLowerCase();
  return normalized === 'b' ? 'b' : 'a';
}

function normalizeIntent(value: unknown) {
  return String(value || 'general').trim().toLowerCase() || 'general';
}

function getClientIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || '';
  return xf.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const intent = normalizeIntent(body?.intent);
    const ctaVariant = normalizeVariant(body?.cta_variant || body?.cta);
    const industry = String(body?.industry || '').trim() || null;
    const ctaLabel = String(body?.cta_label || '').trim() || null;
    const surface = String(body?.surface || '').trim() || null;

    const db = adminClient() as any;
    const payload = {
      event_type: 'industry_cta_click',
      intent,
      cta_variant: ctaVariant,
      industry,
      cta_label: ctaLabel,
      surface,
      page_path: String(body?.page_path || '').trim() || null,
      utm_source: body?.utm_source || null,
      utm_medium: body?.utm_medium || null,
      utm_campaign: body?.utm_campaign || null,
      utm_term: body?.utm_term || null,
      utm_content: body?.utm_content || null,
      gclid: body?.gclid || null,
      fbclid: body?.fbclid || null,
      captured_at: new Date().toISOString(),
    };

    const metadata = {
      user_agent: request.headers.get('user-agent') || null,
      ip_address: getClientIp(request),
      received_at: new Date().toISOString(),
    };

    const { error } = await db
      .from('form_submissions')
      .insert({
        module_key: 'contact_form',
        source: 'website',
        status: 'event',
        submission_data: payload,
        metadata,
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Failed to ingest CTA click') },
      { status: 500 }
    );
  }
}
