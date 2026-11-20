/**
 * GET  /api/finance/pricing  — list all service prices (finance + telecalling roles)
 * POST /api/finance/pricing  — create a service price entry (CFO only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const TELECALLING_ROLES = [
  'telecaller', 'tc_team_lead', 'tc_senior_agent',
  'tc_quality_analyst', 'tc_campaign_manager', 'tc_trainer',
  'manager', 'admin',
];

async function resolveCaller() {
  // Try finance auth first
  const financeActor = await resolveFinanceUser();
  if (financeActor) return { role: financeActor.role, isCFO: financeActor.isCFO };

  // Fall back to telecalling auth (session cookie)
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.getAll().find(
      c => c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.endsWith('-auth-token')
    )?.value;
    if (!raw) return null;
    let token = raw;
    try {
      const p = JSON.parse(raw);
      if (typeof p === 'string') token = p;
      else if (Array.isArray(p) && typeof p[0] === 'string') token = p[0];
      else if (p?.access_token) token = p.access_token;
    } catch {}

    const db = getServiceClient();
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return null;
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !TELECALLING_ROLES.includes(profile.role)) return null;
    return { role: profile.role as string, isCFO: false };
  } catch {
    return null;
  }
}

export async function GET() {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from('service_pricing')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isCFO && actor.role !== 'admin') {
    return NextResponse.json({ error: 'Only CFO can manage pricing' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, category, description, base_price_inr, gst_rate, unit, is_active, sort_order, notes } = body;

  if (!name || base_price_inr == null) {
    return NextResponse.json({ error: 'name and base_price_inr are required' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from('service_pricing')
    .insert({
      name,
      category:       category || 'General',
      description:    description || null,
      base_price_inr: Number(base_price_inr),
      gst_rate:       Number(gst_rate ?? 18),
      unit:           unit || 'per registration',
      is_active:      is_active !== false,
      sort_order:     Number(sort_order ?? 0),
      notes:          notes || null,
      created_by:     actor.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}
