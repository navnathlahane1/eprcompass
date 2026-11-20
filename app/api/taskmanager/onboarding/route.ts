/**
 * GET /api/taskmanager/onboarding
 * Client Onboarding Pipeline Tracker.
 * A "new client" = created in the last 60 days with incomplete setup.
 * Checklist: manager assigned, waste_categories set, first EPR tasks generated, portal access given.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

function onboardingStage(checks: Record<string, boolean>): string {
  const done = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  if (done === total)       return 'complete';
  if (done >= total * 0.75) return 'almost';
  if (done >= total * 0.5)  return 'in_progress';
  if (done >= total * 0.25) return 'started';
  return 'pending';
}

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const { searchParams } = new URL(req.url);
  const stage  = searchParams.get('stage')  ?? '';
  const search = searchParams.get('search') ?? '';

  // ── 1. All clients (not just recent — CCOO wants full onboarding pipeline) ─
  const { data: clients } = await db
    .from('clients')
    .select('id, name, assigned_manager_id, waste_categories, created_at')
    .order('created_at', { ascending: false });

  if (!clients?.length) {
    return NextResponse.json({ clients: [], summary: { total: 0, complete: 0, almost: 0, in_progress: 0, started: 0, pending: 0, stalled: 0, avg_days_to_complete: null } });
  }

  const clientIds = clients.map(c => c.id);

  // ── 2. Check portal access: client profile exists with role='client' ──────
  // (clients doesn't store user IDs directly — check profiles via company link)
  // We check if any EPR tasks exist (means tasks were generated)
  const [eprRes, srRes, manRes] = await Promise.all([
    db.from('client_epr_tasks').select('client_id').in('client_id', clientIds),
    db.from('service_requests').select('client_id, created_at').in('client_id', clientIds).limit(500),
    db.from('profiles').select('id, full_name').in('id', clients.map(c => c.assigned_manager_id).filter(Boolean)),
  ]);

  const eprClientIds  = new Set((eprRes.data ?? []).map(t => t.client_id));
  const srClientIds   = new Set((srRes.data ?? []).map(s => s.client_id));
  const manMap: Record<string, string> = {};
  for (const m of manRes.data ?? []) manMap[m.id] = m.full_name ?? 'Unknown';

  // ── 3. Per-client onboarding checklist ────────────────────────────────────
  const enriched = clients.map(c => {
    const checks = {
      manager_assigned:      !!c.assigned_manager_id,
      categories_configured: !!(c.waste_categories?.length),
      epr_tasks_generated:   eprClientIds.has(c.id),
      portal_active:         srClientIds.has(c.id), // has raised at least one SR = portal active
    };
    const done_count  = Object.values(checks).filter(Boolean).length;
    const pct         = Math.round((done_count / 4) * 100);
    const stg         = onboardingStage(checks);
    const days_since  = Math.floor((now.getTime() - new Date(c.created_at).getTime()) / 86_400_000);
    const stalled     = stg !== 'complete' && days_since > 7;

    return {
      id:           c.id,
      name:         c.name,
      manager_id:   c.assigned_manager_id,
      manager_name: c.assigned_manager_id ? (manMap[c.assigned_manager_id] ?? 'Unknown') : null,
      waste_categories: c.waste_categories ?? [],
      created_at:   c.created_at,
      days_since_created: days_since,
      checklist:    checks,
      done_count,
      completion_pct: pct,
      stage:        stg,
      stalled,
    };
  });

  // ── 4. Filters ────────────────────────────────────────────────────────────
  let filtered = enriched;
  if (stage)  filtered = filtered.filter(c => c.stage === stage);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.manager_name ?? '').toLowerCase().includes(q)
    );
  }

  // Sort: stalled first, then by stage incompleteness, then by newest
  filtered.sort((a, b) => {
    if (a.stalled && !b.stalled) return -1;
    if (!a.stalled && b.stalled) return 1;
    return a.completion_pct - b.completion_pct;
  });

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const recentClients = enriched.filter(c => c.days_since_created <= 60);
  const summary = {
    total:     enriched.length,
    recent_60d: recentClients.length,
    complete:  enriched.filter(c => c.stage === 'complete').length,
    stalled:   enriched.filter(c => c.stalled).length,
    pending:   enriched.filter(c => c.stage === 'pending').length,
    unassigned: enriched.filter(c => !c.manager_id).length,
    avg_days_to_complete: (() => {
      const completedRecent = recentClients.filter(c => c.stage === 'complete');
      return completedRecent.length
        ? Math.round(completedRecent.reduce((s, c) => s + c.days_since_created, 0) / completedRecent.length)
        : null;
    })(),
  };

  return NextResponse.json({ clients: filtered, summary });
}
