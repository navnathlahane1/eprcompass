/**
 * GET /api/taskmanager/filings
 *
 * Returns all open EPR filing statuses with SLA health,
 * enriched with client name and assigned manager name.
 *
 * Warning tiers:
 *   critical  = sla_due_at already past
 *   urgent    = sla_due_at within 4 hours
 *   warning   = sla_due_at within 24 hours
 *   at_risk   = sla_due_at within 48 hours
 *   ok        = > 48 hours remaining
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const filterTier   = sp.get('tier')   || '';   // critical|urgent|warning|at_risk|ok|no_sla
  const filterStatus = sp.get('status') || '';
  const limit = Math.min(parseInt(sp.get('limit') || '300', 10), 1000);

  const db  = getServiceClient();
  const now = new Date();

  let q = db
    .from('epr_filing_statuses')
    .select('id, client_id, category, current_status, sla_due_at, updated_at, fy_id, epr_financial_years(label)')
    .not('current_status', 'in', '("Approved","Certificate Issued")')
    .order('sla_due_at', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (filterStatus) q = (q as any).eq('current_status', filterStatus);

  const { data: filings, error } = await (q as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = filings ?? [];

  // Collect client_ids for enrichment
  const clientIds = [...new Set(rows.map((f: any) => f.client_id).filter(Boolean))];
  const clientNameMap: Record<string, string> = {};
  const clientManagerMap: Record<string, { id: string; name: string } | null> = {};

  if (clientIds.length > 0) {
    const { data: clients } = await db
      .from('clients')
      .select('id, name, profile_id, assigned_manager_id')
      .in('id', clientIds);

    const profileIds = (clients ?? []).map((c: any) => c.profile_id).filter(Boolean);
    const managerIds = (clients ?? []).map((c: any) => c.assigned_manager_id).filter(Boolean);
    const allIds = [...new Set([...profileIds, ...managerIds])];

    const profileNameMap: Record<string, string> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', allIds);
      for (const p of profiles ?? []) {
        profileNameMap[(p as any).id] = (p as any).company_name || (p as any).full_name || '';
      }
    }

    for (const c of clients ?? []) {
      clientNameMap[(c as any).id]   = profileNameMap[(c as any).profile_id]    || (c as any).name || 'Unknown';
      clientManagerMap[(c as any).id] = (c as any).assigned_manager_id
        ? { id: (c as any).assigned_manager_id, name: profileNameMap[(c as any).assigned_manager_id] || 'Unassigned' }
        : null;
    }
  }

  // Classify + annotate
  const enriched = rows.map((f: any) => {
    const sla   = f.sla_due_at ? new Date(f.sla_due_at) : null;
    const msLeft = sla ? sla.getTime() - now.getTime() : null;
    const hLeft  = msLeft !== null ? msLeft / 3_600_000 : null;

    let tier: string;
    if (!sla)             tier = 'no_sla';
    else if (hLeft! < 0)  tier = 'critical';
    else if (hLeft! < 4)  tier = 'urgent';
    else if (hLeft! < 24) tier = 'warning';
    else if (hLeft! < 48) tier = 'at_risk';
    else                  tier = 'ok';

    return {
      ...f,
      fy_label:       (f.epr_financial_years as any)?.label || '',
      client_name:    clientNameMap[f.client_id]   || 'Unknown',
      manager:        clientManagerMap[f.client_id] || null,
      sla_tier:       tier,
      hours_remaining: hLeft !== null ? Math.round(hLeft * 10) / 10 : null,
    };
  });

  // Apply tier filter after enrichment
  const filtered = filterTier ? enriched.filter(f => f.sla_tier === filterTier) : enriched;

  // Summary
  const tierCounts: Record<string, number> = { critical: 0, urgent: 0, warning: 0, at_risk: 0, ok: 0, no_sla: 0 };
  for (const f of enriched) tierCounts[f.sla_tier] = (tierCounts[f.sla_tier] || 0) + 1;

  return NextResponse.json({
    filings:  filtered,
    summary:  { total: enriched.length, ...tierCounts },
  });
}
