/**
 * @openapi
 * /api/network/contracts/{contractId}:
 *   get:    { summary: Get contract detail, tags: [Recycler Network] }
 *   put:    { summary: Update contract fields, tags: [Recycler Network] }
 * /api/network/contracts/{contractId}/status:
 *   patch:  { summary: Transition contract status, tags: [Recycler Network] }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

type Params = { params: Promise<{ contractId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { contractId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_contracts')
    .select(`*, recyclers(*), contract_allocations(*)`)
    .eq('id', contractId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Clients can only see their own contracts
  if (!actor.isAdmin && data.client_id !== actor.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ contract: data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { contractId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();

  // Ownership check
  const { data: existing } = await (db as any)
    .from('recycler_contracts')
    .select('client_id, status')
    .eq('id', contractId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!actor.isAdmin && existing.client_id !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!['DRAFT', 'ACTIVE'].includes(existing.status)) {
    return NextResponse.json({ error: 'Cannot edit expired or terminated contracts' }, { status: 422 });
  }

  const body = await req.json().catch(() => ({}));
  const allowed = [
    'start_date', 'end_date', 'committed_qty', 'renewal_notice_days',
    'auto_renewal', 'contract_doc_url', 'financial_year',
  ];

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const { data, error } = await (db as any)
    .from('recycler_contracts')
    .update(patch)
    .eq('id', contractId)
    .select('id, contract_number, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
