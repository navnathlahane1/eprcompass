/**
 * GET    /api/taskmanager/automation  — list all automation rules + recent log
 * POST   /api/taskmanager/automation  — create a new rule
 * PATCH  /api/taskmanager/automation  — toggle active or update a rule
 * DELETE /api/taskmanager/automation  — delete a rule
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

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

async function resolveActor(db: ReturnType<typeof getServiceClient>) {
  const cookieStore = await cookies();
  const raw   = cookieStore.getAll().find(c => c.name.endsWith('-access-token') || c.name === 'sb-access-token');
  const token = tryParseToken(raw?.value);
  if (!token) return null;
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await db.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  if (!['task_manager', 'admin'].includes(profile?.role ?? '')) return null;
  return { id: user.id, name: profile?.full_name ?? null };
}

export async function GET(_req: NextRequest) {
  const db = getServiceClient();
  const actor = await resolveActor(db);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rulesRes, logRes] = await Promise.all([
    db.from('automation_rules').select('*').order('created_at', { ascending: false }),
    db.from('automation_log').select('*').order('triggered_at', { ascending: false }).limit(50),
  ]);

  const rules = rulesRes.data ?? [];
  const log   = logRes.data   ?? [];

  // Enrich rules with creator names
  const creatorIds = [...new Set(rules.map(r => r.created_by).filter(Boolean))];
  const { data: profiles } = creatorIds.length
    ? await db.from('profiles').select('id, full_name').in('id', creatorIds)
    : { data: [] };
  const pMap: Record<string, string> = {};
  for (const p of profiles ?? []) pMap[p.id] = p.full_name ?? 'Unknown';

  const enrichedRules = rules.map(r => ({
    ...r,
    created_by_name: r.created_by ? (pMap[r.created_by] ?? 'Unknown') : null,
  }));

  const summary = {
    total:  rules.length,
    active: rules.filter(r => r.is_active).length,
    triggered_today: log.filter(l => {
      const d = new Date(l.triggered_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return NextResponse.json({ rules: enrichedRules, log, summary });
}

export async function POST(req: NextRequest) {
  const db    = getServiceClient();
  const actor = await resolveActor(db);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, trigger_source, trigger_event, trigger_params, action_type, action_params } = body;

  if (!name || !trigger_source || !trigger_event || !action_type) {
    return NextResponse.json({ error: 'name, trigger_source, trigger_event, action_type required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('automation_rules')
    .insert({
      name:           name.trim(),
      description:    description?.trim() || null,
      trigger_source,
      trigger_event,
      trigger_params: trigger_params ?? {},
      action_type,
      action_params:  action_params ?? {},
      is_active:      false,
      created_by:     actor.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, rule: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const db    = getServiceClient();
  const actor = await resolveActor(db);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, is_active, name, description, trigger_params, action_params } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (is_active !== undefined)  updates.is_active      = is_active;
  if (name)                     updates.name           = name.trim();
  if (description !== undefined) updates.description   = description?.trim() || null;
  if (trigger_params)           updates.trigger_params = trigger_params;
  if (action_params)            updates.action_params  = action_params;

  const { error } = await db.from('automation_rules').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const db    = getServiceClient();
  const actor = await resolveActor(db);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await db.from('automation_rules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
