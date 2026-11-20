/**
 * GET /api/iam/intel-companies?q=<search>
 * Search intel_companies by name for the IAM recycler onboarding picker.
 * Only accessible to user_manager / admin / manager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const p = JSON.parse(raw);
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    if (p?.access_token) return p.access_token;
  } catch {}
  return raw;
}

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveActor() {
  const cookieStore = await cookies();
  const raw = cookieStore.getAll().find(
    c => c.name.endsWith('-access-token') || c.name === 'sb-access-token'
  );
  const token = tryParseToken(raw?.value);
  if (!token) return null;

  const db = adminDb();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).maybeSingle();

  const isSuperAdmin = emailIsSuperAdmin(user.email);
  const role = profile?.role || (isSuperAdmin ? 'admin' : '');

  if (!['user_manager', 'admin', 'manager'].includes(role)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (q.length < 2) return NextResponse.json({ companies: [] });

  const db = adminDb();

  const { data, error } = await (db as any)
    .from('intel_companies')
    .select('id, canonical_name, gstin, state, district, company_type, website')
    .ilike('canonical_name', `%${q}%`)
    .order('canonical_name', { ascending: true })
    .limit(15);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    companies: (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.canonical_name,
      gstin: c.gstin ?? null,
      state: c.state ?? null,
      city: c.district ?? null,
      company_type: c.company_type ?? null,
      website: c.website ?? null,
    })),
  });
}
