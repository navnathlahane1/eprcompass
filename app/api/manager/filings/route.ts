/**
 * GET /api/manager/filings?overdue=true&status=&category=&search=
 * Returns all EPR filing statuses across all clients assigned to this manager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const overdueOnly = sp.get('overdue') === 'true';
  const statusFilter = sp.get('status')?.trim() || '';
  const categoryFilter = sp.get('category')?.trim() || '';
  const search = sp.get('search')?.trim() || '';

  const db = getAdminClient();

  // Get assigned client IDs
  const { data: assignedClients } = await db
    .from('clients')
    .select('id, profile_id, profile_id(company_name, full_name)')
    .eq('assigned_manager_id', actor.id);

  const clientIds = (assignedClients ?? []).map((c: any) => c.id);
  if (clientIds.length === 0) {
    return NextResponse.json({ filings: [] });
  }

  // Build a map of clientId -> company name for enrichment
  const clientNameMap: Record<string, string> = {};
  for (const c of assignedClients ?? []) {
    const p = (c as any).profile_id;   // aliased by FK column name
    clientNameMap[c.id] = p?.company_name || p?.full_name || 'Unknown';
  }

  let query = db
    .from('epr_filing_statuses')
    .select(`
      id, client_id, category, current_status, sla_due_at, created_at, updated_at,
      epr_financial_years ( id, label )
    `)
    .in('client_id', clientIds)
    .order('sla_due_at', { ascending: true, nullsFirst: false });

  if (statusFilter) query = (query as any).eq('current_status', statusFilter);
  if (categoryFilter) query = (query as any).eq('category', categoryFilter);

  const { data: filings, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date().toISOString();
  let enriched = (filings ?? []).map((f: any) => ({
    id: f.id,
    client_id: f.client_id,
    client_name: clientNameMap[f.client_id] || 'Unknown',
    category: f.category,
    current_status: f.current_status,
    sla_due_at: f.sla_due_at,
    updated_at: f.updated_at,
    fy_id: f.epr_financial_years?.id || null,
    fy_label: f.epr_financial_years?.label || '',
    overdue: !['Approved', 'Certificate Issued'].includes(f.current_status) && f.sla_due_at && f.sla_due_at < now,
  }));

  if (overdueOnly) enriched = enriched.filter(f => f.overdue);

  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(f =>
      f.client_name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.fy_label.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ filings: enriched });
}
