/**
 * GET /api/taskmanager/recyclers
 * Recycler network tracker — profiles with role = 'recycler'.
 * Enriches with last-login activity and portal task completion.
 *
 * Query params:
 *   search         = name / email substring
 *   responsiveness = active | occasional | inactive | dormant | never_logged_in | banned
 *   category       = waste category slug (informational filter, if categories stored)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get('search')         ?? '';
  const respFilter = searchParams.get('responsiveness') ?? '';

  // ── 1. Recycler profiles only ─────────────────────────────────────────────
  const { data: recyclers } = await db
    .from('profiles')
    .select('id, full_name, company_name, phone, created_at, is_banned')
    .eq('role', 'recycler')
    .order('company_name');

  if (!recyclers?.length) {
    return NextResponse.json({
      vendors: [],
      summary: { total: 0, active: 0, occasional: 0, inactive: 0, dormant: 0, never_logged_in: 0, banned: 0 },
    });
  }

  // ── 2. Auth emails + last sign-in ─────────────────────────────────────────
  const { data: authData } = await db.auth.admin.listUsers({ page: 1, perPage: 500 });
  const emailMap: Record<string, string>   = {};
  const lastSignInMap: Record<string, string> = {};
  for (const u of authData?.users ?? []) {
    emailMap[u.id]      = u.email ?? '';
    lastSignInMap[u.id] = u.last_sign_in_at ?? '';
  }

  // ── 3. Portal tasks assigned to recyclers ─────────────────────────────────
  const ids = recyclers.map(r => r.id);
  const { data: vendorTasks } = await db
    .from('portal_tasks')
    .select('assigned_to, status, due_at')
    .in('assigned_to', ids);

  // ── 4. Enrich ─────────────────────────────────────────────────────────────
  const enriched = recyclers.map(v => {
    const myTasks = (vendorTasks ?? []).filter(t => t.assigned_to === v.id);
    const done    = myTasks.filter(t => ['done','completed','resolved'].includes(t.status)).length;
    const overdue = myTasks.filter(t =>
      t.due_at && new Date(t.due_at) < now && !['done','completed','resolved'].includes(t.status)
    ).length;

    const last_seen      = lastSignInMap[v.id] || null;
    const days_inactive  = last_seen
      ? Math.floor((now.getTime() - new Date(last_seen).getTime()) / 86_400_000)
      : null;

    const responsiveness =
      v.is_banned          ? 'banned'
      : days_inactive === null ? 'never_logged_in'
      : days_inactive <= 7   ? 'active'
      : days_inactive <= 30  ? 'occasional'
      : days_inactive <= 90  ? 'inactive'
      : 'dormant';

    return {
      id:               v.id,
      name:             v.full_name ?? v.company_name ?? 'Unknown',
      company_name:     v.company_name,
      email:            emailMap[v.id] ?? null,
      phone:            (v as any).phone ?? null,
      categories:       [] as string[],
      is_banned:        v.is_banned,
      created_at:       v.created_at,
      last_sign_in:     last_seen,
      days_since_login: days_inactive,
      responsiveness,
      tasks: {
        total:          myTasks.length,
        done,
        overdue,
        completion_pct: myTasks.length ? Math.round((done / myTasks.length) * 100) : 0,
      },
    };
  });

  // ── 5. Filters ────────────────────────────────────────────────────────────
  let filtered = enriched;
  if (respFilter) filtered = filtered.filter(v => v.responsiveness === respFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.company_name ?? '').toLowerCase().includes(q) ||
      (v.email ?? '').toLowerCase().includes(q)
    );
  }

  const summary = {
    total:           enriched.length,
    active:          enriched.filter(v => v.responsiveness === 'active').length,
    occasional:      enriched.filter(v => v.responsiveness === 'occasional').length,
    inactive:        enriched.filter(v => v.responsiveness === 'inactive').length,
    dormant:         enriched.filter(v => v.responsiveness === 'dormant').length,
    never_logged_in: enriched.filter(v => v.responsiveness === 'never_logged_in').length,
    banned:          enriched.filter(v => v.is_banned).length,
  };

  return NextResponse.json({ vendors: filtered, summary });
}
