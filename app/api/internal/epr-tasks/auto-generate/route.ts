/**
 * POST /api/internal/epr-tasks/auto-generate
 *
 * Internal endpoint called by the Supabase DB trigger (migration 099) via pg_net
 * whenever a client's waste_categories changes from empty → non-empty.
 *
 * Security: caller must supply the x-webhook-secret header matching
 * the INTERNAL_WEBHOOK_SECRET environment variable.
 *
 * Body: { clientId: string, wasteCategories: string[], fy?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateClientEprTasks } from '@/lib/epr/generateEprTasks';
import { generateManagerOversightTasks } from '@/lib/epr/generateManagerTasks';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  // ── Auth: shared secret ────────────────────────────────────────────────────
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration: webhook secret not set' }, { status: 500 });
  }
  const incoming = req.headers.get('x-webhook-secret');
  if (incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let clientId: string;
  let wasteCategories: string[];
  let fy: string;

  try {
    const body = await req.json();
    clientId        = body.clientId;
    wasteCategories = Array.isArray(body.wasteCategories) ? body.wasteCategories : [];
    fy              = body.fy ?? '2026-27';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  if (!wasteCategories.length) {
    return NextResponse.json({ error: 'wasteCategories is empty — nothing to generate' }, { status: 400 });
  }

  // ── Guard: skip if tasks already exist for this client + FY ───────────────
  const db = getServiceClient();
  const { count } = await (db as any)
    .from('client_epr_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('fy', fy);

  if ((count ?? 0) > 0) {
    return NextResponse.json({
      skipped: true,
      reason:  `Tasks already exist for client ${clientId} FY ${fy}`,
      existing: count,
    });
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  const result = await generateClientEprTasks({
    db:              db as any,
    clientId,
    wasteCategories: wasteCategories as any[],
    fy,
    overwrite:       false,
  });

  if (result.error) {
    console.error('[auto-generate-epr-tasks] generation error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  console.log(`[auto-generate-epr-tasks] ✅ Generated ${result.created} tasks for client ${clientId} FY ${fy}`);

  // Also create manager oversight portal_tasks
  const managerResult = await generateManagerOversightTasks({
    db,
    clientId,
    categories: wasteCategories,
    fy,
    overwrite: false,
  });

  return NextResponse.json({
    success:               true,
    clientId,
    fy,
    created:               result.created,
    manager_tasks_created: managerResult.created,
    message:               `Auto-generated ${result.created} EPR tasks and ${managerResult.created} manager oversight task(s) for FY ${fy}`,
  });
}
