/**
 * GET  /api/taskmanager/escalations  — all escalations with enriched context
 * PATCH /api/taskmanager/escalations — resolve an escalation
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
  if (!['task_manager', 'admin', 'manager'].includes(profile?.role ?? '')) return null;
  return { id: user.id, fullName: profile?.full_name ?? null };
}

export async function GET(req: NextRequest) {
  const db = getServiceClient();
  const actor = await resolveActor(db);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get('resolved');   // 'true' | 'false' | null = all
  const severity = searchParams.get('severity');   // 'critical' | 'high' | 'medium' | null
  const source   = searchParams.get('source');     // portal_task | epr_task | filing | null

  let query = db
    .from('task_escalations')
    .select('*')
    .order('escalated_at', { ascending: false })
    .limit(300);

  if (resolved === 'false') query = query.eq('resolved', false);
  if (resolved === 'true')  query = query.eq('resolved', true);
  if (severity)             query = query.eq('severity', severity);
  if (source)               query = query.eq('task_source', source);

  const { data: escalations, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const esc = escalations ?? [];

  // ── Enrich with author / resolver names ────────────────────────────────────
  const personIds = [...new Set([
    ...esc.map(e => e.escalated_by),
    ...esc.map(e => e.resolved_by).filter(Boolean),
  ])];
  const { data: profiles } = personIds.length
    ? await db.from('profiles').select('id, full_name, role').in('id', personIds)
    : { data: [] };
  const pMap: Record<string, { name: string; role: string }> = {};
  for (const p of profiles ?? []) pMap[p.id] = { name: p.full_name ?? 'Unknown', role: p.role };

  // ── Enrich portal task titles ──────────────────────────────────────────────
  const ptIds  = esc.filter(e => e.task_source === 'portal_task').map(e => e.task_id);
  const eprIds = esc.filter(e => e.task_source === 'epr_task').map(e => e.task_id);

  const [ptRes, eprRes] = await Promise.all([
    ptIds.length  ? db.from('portal_tasks').select('id, title, type, priority').in('id', ptIds)         : Promise.resolve({ data: [] }),
    eprIds.length ? db.from('client_epr_tasks').select('id, task_name, waste_category').in('id', eprIds) : Promise.resolve({ data: [] }),
  ]);

  const ptMap: Record<string, { title: string; subtitle: string }> = {};
  for (const t of ptRes.data ?? [])  ptMap[t.id]  = { title: t.title,     subtitle: t.type ?? '' };
  for (const t of eprRes.data ?? []) ptMap[t.id]  = { title: t.task_name, subtitle: t.waste_category };

  const enriched = esc.map(e => ({
    ...e,
    escalated_by_name:  pMap[e.escalated_by]?.name  ?? 'Unknown',
    escalated_by_role:  pMap[e.escalated_by]?.role  ?? '',
    resolved_by_name:   e.resolved_by ? (pMap[e.resolved_by]?.name ?? 'Unknown') : null,
    task_title:    ptMap[e.task_id]?.title    ?? null,
    task_subtitle: ptMap[e.task_id]?.subtitle ?? null,
  }));

  const now = new Date();
  const todayStr = now.toDateString();

  const summary = {
    total:          enriched.length,
    active:         enriched.filter(e => !e.resolved).length,
    critical:       enriched.filter(e => !e.resolved && e.severity === 'critical').length,
    high:           enriched.filter(e => !e.resolved && e.severity === 'high').length,
    medium:         enriched.filter(e => !e.resolved && e.severity === 'medium').length,
    resolved_today: enriched.filter(e => e.resolved && e.resolved_at && new Date(e.resolved_at).toDateString() === todayStr).length,
    avg_age_hours:  enriched.filter(e => !e.resolved).length
      ? Math.round(
          enriched.filter(e => !e.resolved).reduce((s, e) =>
            s + (now.getTime() - new Date(e.escalated_at).getTime()) / 3_600_000, 0
          ) / enriched.filter(e => !e.resolved).length
        )
      : 0,
  };

  return NextResponse.json({ escalations: enriched, summary });
}

export async function PATCH(req: NextRequest) {
  const db    = getServiceClient();
  const actor = await resolveActor(db);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, resolution_note } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await db
    .from('task_escalations')
    .update({
      resolved:         true,
      resolved_at:      new Date().toISOString(),
      resolved_by:      actor.id,
      resolution_note:  resolution_note?.trim() || null,
    })
    .eq('id', id)
    .eq('resolved', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
