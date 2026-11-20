/**
 * GET /api/manager/clients?search=&status=
 * Returns only clients assigned to the current manager,
 * enriched with company profile info and filing status counts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const search = sp.get('search')?.trim() || '';
  const statusFilter = sp.get('status')?.trim() || '';

  const db = getAdminClient();

  // Select only columns guaranteed to exist in all DB versions.
  // Optional columns (waste_categories, onboarded_date, renewal_date,
  // ltv_inr, notes, health_score) are added by migration 091 — they fall
  // back to null/[] below if absent.
  let query = db
    .from('clients')
    .select(`
      id, status, category,
      profile_id,
      profile_id ( full_name, company_name, phone, state )
    `)
    .eq('assigned_manager_id', actor.id)
    .order('status', { ascending: true });

  if (statusFilter) query = (query as any).eq('status', statusFilter);

  const { data: clients, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get filing status counts per client
  const clientIds = (clients ?? []).map((c: any) => c.id);
  let filingCounts: Record<string, { total: number; pending: number; overdue: number }> = {};

  if (clientIds.length > 0) {
    const now = new Date().toISOString();
    const { data: filings } = await db
      .from('epr_filing_statuses')
      .select('client_id, current_status, sla_due_at')
      .in('client_id', clientIds);

    for (const f of filings ?? []) {
      const cid = f.client_id;
      if (!filingCounts[cid]) filingCounts[cid] = { total: 0, pending: 0, overdue: 0 };
      filingCounts[cid].total++;
      const done = ['Approved', 'Certificate Issued'].includes(f.current_status);
      if (!done) {
        filingCounts[cid].pending++;
        if (f.sla_due_at && f.sla_due_at < now) filingCounts[cid].overdue++;
      }
    }
  }

  let enriched = (clients ?? []).map((c: any) => ({
    id: c.id,
    status: c.status,
    category: c.category,
    waste_categories: (c as any).waste_categories ?? [],
    onboarded_date: (c as any).onboarded_date ?? null,
    renewal_date: (c as any).renewal_date ?? null,
    health_score: (c as any).health_score ?? null,
    profile_id: c.profile_id,
    company_name: (c.profile_id as any)?.company_name || null,
    full_name: (c.profile_id as any)?.full_name || null,
    email: null, // email lives in auth.users — not available in the list view
    phone: (c.profile_id as any)?.phone || null,
    state: (c.profile_id as any)?.state || null,
    filings: filingCounts[c.id] ?? { total: 0, pending: 0, overdue: 0 },
  }));

  // Client-side search on company/name
  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(c =>
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.full_name || '').toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ clients: enriched });
}
