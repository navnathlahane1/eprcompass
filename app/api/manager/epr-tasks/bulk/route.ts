/**
 * POST /api/manager/epr-tasks/bulk
 *
 * Generate EPR tasks for ALL clients assigned to the manager (or a subset).
 * Skips clients with no waste_categories set; reports per-client results.
 *
 * Body:
 *   fy        = '2026-27'  (default)
 *   overwrite = false       (if true, existing tasks for the FY are deleted first)
 *   clientIds = string[]    (optional — omit to target all assigned clients)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveManager } from '@/lib/manager/auth';
import { generateClientEprTasks } from '@/lib/epr/generateEprTasks';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    fy         = '2026-27',
    overwrite  = false,
    clientIds: requestedIds,
  } = body as { fy?: string; overwrite?: boolean; clientIds?: string[] };

  const db = makeServiceClient();

  // ── Load assigned clients ─────────────────────────────────────────────────
  let q = db
    .from('clients')
    .select('id, name, waste_categories, profile_id')
    .eq('assigned_manager_id', actor.id);

  if (requestedIds?.length) q = q.in('id', requestedIds);

  const { data: clients, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!clients || clients.length === 0) {
    return NextResponse.json({ error: 'No assigned clients found.' }, { status: 404 });
  }

  // ── Resolve display names ─────────────────────────────────────────────────
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

  // ── Generate per client ───────────────────────────────────────────────────
  const results: Array<{
    clientId: string;
    clientName: string;
    created: number;
    error: string | null;
  }> = [];

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const client of clients as any[]) {
    const displayName = profileNameMap[client.profile_id] || client.name || 'Unknown';
    const categories: string[] = Array.isArray(client.waste_categories)
      ? client.waste_categories
      : [];

    if (!categories.length) {
      results.push({
        clientId:   client.id,
        clientName: displayName,
        created:    0,
        error:      'No waste categories assigned — skipped',
      });
      totalSkipped++;
      continue;
    }

    const result = await generateClientEprTasks({
      db:              db as any,
      clientId:        client.id,
      wasteCategories: categories as any[],
      fy,
      assignedTo:      null,
      overwrite,
    });

    results.push({
      clientId:   client.id,
      clientName: displayName,
      created:    result.created ?? 0,
      error:      result.error ?? null,
    });

    if (result.error) totalSkipped++;
    else totalCreated += result.created ?? 0;
  }

  const successful = clients.length - totalSkipped;

  return NextResponse.json(
    {
      ok: true,
      fy,
      total_clients:  clients.length,
      total_created:  totalCreated,
      skipped:        totalSkipped,
      results,
      message: `Generated ${totalCreated} tasks across ${successful} client${successful !== 1 ? 's' : ''} for FY ${fy}.`,
    },
    { status: 201 }
  );
}
