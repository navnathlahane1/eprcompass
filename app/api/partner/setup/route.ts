/**
 * POST /api/partner/setup
 * Creates the missing `partners` row for an authenticated user whose
 * profile role is 'partner' but who has no partners record yet.
 * Safe to call multiple times (no-ops if the row already exists).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const p = JSON.parse(raw);
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    // Supabase v2: [{access_token: "...", ...}]
    if (Array.isArray(p) && p[0]?.access_token) return p[0].access_token;
    if (p?.access_token) return p.access_token;
  } catch {}
  return raw;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST() {
  const cookieStore = await cookies();
  // Match standard and chunked Supabase auth cookie names (e.g. sb-<ref>-auth-token, sb-<ref>-auth-token.0)
  const allCookies = cookieStore.getAll();
  const raw = allCookies.find(
    c => c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.includes('-auth-token')
  );
  const token = tryParseToken(raw?.value);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the profile has role=partner
  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, company_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'partner') {
    return NextResponse.json({ error: 'Not a partner account' }, { status: 403 });
  }

  // Check if already exists — idempotent
  const { data: existing } = await db
    .from('partners')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, partnerId: existing.id });
  }

  const emailName = (user.email || '').split('@')[0];
  const { data: created, error } = await db.from('partners').insert({
    profile_id: user.id,
    company_name: (profile.company_name?.trim() || profile.full_name?.trim() || emailName),
    partner_type: 'Env Consultant',
    contact_person: profile.full_name?.trim() || null,
    email: user.email?.toLowerCase() || null,
    phone: profile.phone?.trim() || null,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, partnerId: created.id }, { status: 201 });
}
