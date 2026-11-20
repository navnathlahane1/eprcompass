/**
 * GET  /api/manager/epr-tasks?clientId=xxx&fy=2026-27
 *   Manager views a specific client's EPR tasks.
 *
 * POST /api/manager/epr-tasks
 *   Generate EPR tasks for a client from master templates.
 *   Body: { clientId, fy?, wasteCategories?, overwrite? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveManager } from '@/lib/manager/auth';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { generateClientEprTasks } from '@/lib/epr/generateEprTasks';
import { generateManagerOversightTasks } from '@/lib/epr/generateManagerTasks';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId') || '';
  const fy       = searchParams.get('fy') || '2026-27';
  const category = searchParams.get('category') || '';

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const db = makeServiceClient();

  // Verify this client is assigned to the manager
  const { data: clientRow } = await db
    .from('clients')
    .select('id, waste_categories, name')
    .eq('id', clientId)
    .eq('assigned_manager_id', actor.id)
    .maybeSingle();

  if (!clientRow) return NextResponse.json({ error: 'Client not found or not assigned to you.' }, { status: 404 });

  let q = db
    .from('client_epr_tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('fy', fy)
    .order('due_date', { ascending: true });

  if (category) q = q.eq('waste_category', category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tasks = data ?? [];

  // Summary stats
  const summary = { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 };
  for (const t of tasks as any[]) {
    summary.total++;
    if (t.status in summary) (summary as any)[t.status]++;
  }

  return NextResponse.json({
    tasks,
    summary,
    clientName: clientRow.name,
    wasteCategories: clientRow.waste_categories ?? [],
  });
}

export async function POST(req: NextRequest) {
  // Admin or manager can generate tasks
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { clientId, fy = '2026-27', wasteCategories, overwrite = false } = body as {
    clientId: string;
    fy?: string;
    wasteCategories?: string[];
    overwrite?: boolean;
  };

  if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 });

  const db = makeServiceClient();

  // Resolve waste categories: use supplied list OR fetch from clients table
  let categories: string[] = wasteCategories ?? [];
  if (!categories.length) {
    const { data: clientRow } = await db
      .from('clients')
      .select('id, waste_categories, assigned_manager_id')
      .eq('id', clientId)
      .maybeSingle();

    if (!clientRow) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

    // Non-admin must own this client
    if (!actor.isAdmin && clientRow.assigned_manager_id !== actor.userId) {
      return NextResponse.json({ error: 'Client not assigned to you.' }, { status: 403 });
    }

    categories = Array.isArray(clientRow.waste_categories) ? clientRow.waste_categories : [];
  }

  if (!categories.length) {
    return NextResponse.json({ error: 'No waste categories found. Assign waste_categories to the client first.' }, { status: 400 });
  }

  const result = await generateClientEprTasks({
    db: db as any,
    clientId,
    wasteCategories: categories as any[],
    fy,
    assignedTo: null,
    overwrite,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Auto-create manager oversight portal_tasks (one per category)
  const managerResult = await generateManagerOversightTasks({
    db: db as any,
    clientId,
    categories,
    fy,
    overwrite,
  });

  return NextResponse.json({
    ok: true,
    created: result.created,
    manager_tasks_created: managerResult.created,
    fy,
    categories,
    message: `Generated ${result.created} compliance tasks for FY ${fy}. Created ${managerResult.created} manager oversight task(s).`,
  }, { status: 201 });
}
