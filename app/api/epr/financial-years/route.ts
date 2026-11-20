/**
 * GET  /api/epr/financial-years  – public list (needed for client dropdowns)
 * POST /api/epr/financial-years  – admin: add a new FY
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getActorId(): Promise<{ userId: string; isAdmin: boolean } | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdminUser =
    ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);

  return { userId: user.id, isAdmin: isAdminUser };
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const actor = await getActorId();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();
    const { data, error } = await (db as any)
      .from('epr_financial_years')
      .select('id, label, is_active, is_locked, created_at')
      .order('label', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ financialYears: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const actor = await getActorId();
    if (!actor?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const label: string = (body.label ?? '').trim();

    if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 });

    // Basic label format validation to prevent injection
    if (!/^FY \d{4}-\d{2,4}$/.test(label)) {
      return NextResponse.json(
        { error: 'Label must match format: FY YYYY-YY (e.g. FY 2025-26)' },
        { status: 400 }
      );
    }

    const db = adminClient();
    const { data, error } = await (db as any)
      .from('epr_financial_years')
      .insert({ label, is_active: false, created_by: actor.userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ year: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
