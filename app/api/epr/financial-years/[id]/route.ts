/**
 * PATCH /api/epr/financial-years/[id]
 * Admin: set as active, lock/unlock, or update label.
 * Setting is_active=true automatically clears any other active row first.
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

async function getAdminActor() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const ok = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return ok ? user.id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await getAdminActor();
    if (!actorId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const db = adminClient();

    // If setting as active, first clear existing active row
    if (body.is_active === true) {
      await (db as any)
        .from('epr_financial_years')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('id', id);
    }

    // If locking, record who locked and when
    const patch: Record<string, unknown> = {};
    if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
    if (typeof body.is_locked === 'boolean') {
      patch.is_locked = body.is_locked;
      patch.locked_by = actorId;
      patch.locked_at = body.is_locked ? new Date().toISOString() : null;
    }
    if (body.label) {
      const label = String(body.label).trim();
      if (!/^FY \d{4}-\d{2,4}$/.test(label)) {
        return NextResponse.json({ error: 'Invalid label format' }, { status: 400 });
      }
      patch.label = label;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await (db as any)
      .from('epr_financial_years')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ year: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
