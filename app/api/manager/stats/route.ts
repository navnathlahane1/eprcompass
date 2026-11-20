/**
 * GET /api/manager/stats
 * Dashboard stats for the current compliance manager.
 * Only counts data for clients assigned to them.
 */
import { NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

export async function GET() {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminClient();

  // 1. Assigned clients — include profile name for activity feed
  const { data: assignedClients } = await db
    .from('clients')
    .select('id, status, profile_id(company_name, full_name)')
    .eq('assigned_manager_id', actor.id);

  const clientIds = (assignedClients ?? []).map((c: any) => c.id);
  const totalClients = clientIds.length;
  const activeClients = (assignedClients ?? []).filter((c: any) => c.status === 'Active').length;
  const atRiskClients = (assignedClients ?? []).filter((c: any) => c.status === 'At Risk').length;

  if (clientIds.length === 0) {
    return NextResponse.json({
      totalClients: 0, activeClients: 0, atRiskClients: 0,
      pendingFilings: 0, overdueFilings: 0, docsForReview: 0,
      recentActivity: [],
    });
  }

  // Build client_id → name map from the clients we already fetched
  const clientNameMap: Record<string, string> = {};
  for (const c of assignedClients ?? []) {
    const p = (c as any).profile_id;
    clientNameMap[c.id] = p?.company_name || p?.full_name || 'Unknown';
  }

  // 2. Filing status counts — no profiles embed needed (no direct FK from filings → profiles)
  const { data: filings } = await db
    .from('epr_filing_statuses')
    .select('id, current_status, sla_due_at, category, updated_at, client_id, epr_financial_years(label)')
    .in('client_id', clientIds)
    .order('updated_at', { ascending: false });

  const allFilings = filings ?? [];
  const now = new Date();
  const pendingFilings = allFilings.filter(
    (f: any) => !['Approved', 'Certificate Issued'].includes(f.current_status)
  ).length;
  const overdueFilings = allFilings.filter(
    (f: any) => f.sla_due_at && new Date(f.sla_due_at) < now &&
      !['Approved', 'Certificate Issued'].includes(f.current_status)
  ).length;

  // 3. Documents pending review
  const { count: docsForReview } = await db
    .from('epr_client_documents')
    .select('id', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .eq('status', 'Received');

  // 4. Recent activity (last 8 filing updates) — look up name from clientNameMap
  const recentActivity = allFilings.slice(0, 8).map((f: any) => ({
    id: f.id,
    client_name: clientNameMap[f.client_id] || 'Unknown',
    category: f.category,
    status: f.current_status,
    fy_label: (f.epr_financial_years as any)?.label || '',
    updated_at: f.updated_at,
  }));

  return NextResponse.json({
    totalClients,
    activeClients,
    atRiskClients,
    pendingFilings,
    overdueFilings,
    docsForReview: docsForReview ?? 0,
    recentActivity,
  });
}
