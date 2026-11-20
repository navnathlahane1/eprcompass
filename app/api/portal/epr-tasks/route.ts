/**
 * GET /api/portal/epr-tasks
 *
 * Returns the authenticated client's EPR compliance tasks
 * for a given FY (default 2026-27).
 *
 * Query params:
 *   ?fy=2026-27
 *   ?category=plastic|ewaste|battery|tyre|used_oil|hazardous|cd_waste|governance
 *   ?status=pending|in_progress|completed|overdue|skipped|na
 *   ?summary=1  → return only summary stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);

  const fy       = searchParams.get('fy') || '2026-27';
  const category = searchParams.get('category') || '';
  const status   = searchParams.get('status') || '';
  const summary  = searchParams.get('summary') === '1';

  // Resolve client_id
  const { data: clientRow } = await db
    .from('clients')
    .select('id, waste_categories')
    .eq('profile_id', actor.userId)
    .maybeSingle();

  if (!clientRow) return NextResponse.json({ tasks: [], summary: null });

  // Build query
  let q = db
    .from('client_epr_tasks')
    .select('*')
    .eq('client_id', clientRow.id)
    .eq('fy', fy)
    .order('due_date', { ascending: true });

  if (category) q = q.eq('waste_category', category);
  if (status)   q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tasks = data ?? [];

  // Auto-mark overdue: tasks with due_date < today and status = pending
  const today = new Date().toISOString().slice(0, 10);
  const overdueIds = tasks
    .filter((t: any) => t.due_date < today && t.status === 'pending')
    .map((t: any) => t.id);

  if (overdueIds.length > 0) {
    await db
      .from('client_epr_tasks')
      .update({ status: 'overdue' })
      .in('id', overdueIds);

    // Reflect in returned data
    for (const t of tasks as any[]) {
      if (overdueIds.includes(t.id)) t.status = 'overdue';
    }
  }

  if (summary) {
    const counts = { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0, skipped: 0 };
    for (const t of tasks as any[]) {
      counts.total++;
      if (t.status in counts) (counts as any)[t.status]++;
    }

    // Category breakdown
    const byCategory: Record<string, { total: number; completed: number; overdue: number }> = {};
    for (const t of tasks as any[]) {
      if (!byCategory[t.waste_category]) {
        byCategory[t.waste_category] = { total: 0, completed: 0, overdue: 0 };
      }
      byCategory[t.waste_category].total++;
      if (t.status === 'completed') byCategory[t.waste_category].completed++;
      if (t.status === 'overdue')   byCategory[t.waste_category].overdue++;
    }

    return NextResponse.json({
      summary: counts,
      byCategory,
      wasteCategories: clientRow.waste_categories ?? [],
    });
  }

  return NextResponse.json({ tasks, clientId: clientRow.id });
}
