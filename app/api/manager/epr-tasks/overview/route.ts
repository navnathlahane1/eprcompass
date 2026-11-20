/**
 * GET /api/manager/epr-tasks/overview
 *
 * Returns EPR task summary + full task list across ALL clients assigned
 * to the authenticated manager.
 *
 * Query params:
 *   fy        = '2026-27'  (default)
 *   category  = waste_category filter
 *   status    = task status filter
 *   clientId  = narrow to a single client
 *   tasks     = '1' to include full task rows (omit for summary-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveManager } from '@/lib/manager/auth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function emptyStats() {
  return { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0, skipped: 0 };
}

export async function GET(req: NextRequest) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fy             = searchParams.get('fy')       || '2026-27';
  const filterCategory = searchParams.get('category') || '';
  const filterStatus   = searchParams.get('status')   || '';
  const filterClientId = searchParams.get('clientId') || '';
  const includeTasks   = searchParams.get('tasks') === '1';

  const db = makeServiceClient();

  // ── 1. Load all assigned clients ──────────────────────────────────────────
  let clientQ = db
    .from('clients')
    .select('id, name, waste_categories, profile_id')
    .eq('assigned_manager_id', actor.id);

  if (filterClientId) clientQ = clientQ.eq('id', filterClientId);

  const { data: clients, error: clientErr } = await clientQ;
  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
  if (!clients || clients.length === 0) {
    return NextResponse.json({
      summary: emptyStats(),
      clients: [],
      tasks: [],
    });
  }

  // ── 2. Resolve display names from profiles ─────────────────────────────────
  const profileIds = (clients as any[]).map(c => c.profile_id).filter(Boolean);
  const profileNameMap: Record<string, string> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, company_name, full_name')
      .in('id', profileIds);
    for (const p of profiles ?? []) {
      profileNameMap[(p as any).id] =
        (p as any).company_name || (p as any).full_name || 'Unknown';
    }
  }

  const clientIds = (clients as any[]).map(c => c.id);

  // Build a display-name map (profile name > clients.name fallback)
  const clientNameMap: Record<string, string> = {};
  for (const c of clients as any[]) {
    clientNameMap[c.id] = profileNameMap[c.profile_id] || c.name || 'Unknown';
  }

  // ── 3. Auto-mark overdue ───────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  await db
    .from('client_epr_tasks')
    .update({ status: 'overdue' })
    .in('client_id', clientIds)
    .eq('fy', fy)
    .eq('status', 'pending')
    .lt('due_date', today);

  // ── 4. Fetch ALL tasks for per-client summary (no category/status filter) ──
  const { data: allTasksRaw } = await db
    .from('client_epr_tasks')
    .select('id, client_id, status, waste_category, priority, due_date, title, description, frequency, responsible_dept, notes, period_label')
    .in('client_id', clientIds)
    .eq('fy', fy)
    .order('due_date', { ascending: true });

  const allTasks: any[] = allTasksRaw ?? [];

  // ── 5. Per-client summaries (always unfiltered) ────────────────────────────
  const clientSummaries = (clients as any[]).map(c => {
    const ct = allTasks.filter(t => t.client_id === c.id);
    const cs = emptyStats();
    for (const t of ct) {
      cs.total++;
      if (t.status in cs) (cs as any)[t.status]++;
    }
    return {
      id: c.id,
      name: clientNameMap[c.id],
      waste_categories: c.waste_categories ?? [],
      has_tasks: ct.length > 0,
      summary: cs,
    };
  });

  // ── 6. Overall summary (also unfiltered) ──────────────────────────────────
  const summary = emptyStats();
  for (const t of allTasks) {
    summary.total++;
    if (t.status in summary) (summary as any)[t.status]++;
  }

  // ── 7. Apply filters for task list ────────────────────────────────────────
  let filteredTasks = allTasks;
  if (filterCategory) filteredTasks = filteredTasks.filter(t => t.waste_category === filterCategory);
  if (filterStatus)   filteredTasks = filteredTasks.filter(t => t.status === filterStatus);

  // Annotate with client_name
  const annotatedTasks = filteredTasks.map(t => ({
    ...t,
    client_name: clientNameMap[t.client_id] || 'Unknown',
  }));

  const payload: Record<string, any> = { summary, clients: clientSummaries };
  if (includeTasks) payload.tasks = annotatedTasks;

  return NextResponse.json(payload);
}
