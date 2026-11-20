/**
 * @openapi
 * /api/network/contracts:
 *   get:  { summary: List contracts for current user, tags: [Recycler Network] }
 *   post: { summary: Create contract (admin or client), tags: [Recycler Network] }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const sp = req.nextUrl.searchParams;
  const clientId = actor.isAdmin && sp.get('clientId') ? sp.get('clientId')! : actor.userId;
  const db = adminClient();

  let q = (db as any)
    .from('recycler_contracts')
    .select(`
      id, contract_number, status, start_date, end_date,
      epr_category, financial_year, committed_qty, renewal_notice_days,
      auto_renewal, termination_reason, contract_doc_url,
      recyclers ( id, recycler_code, name )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (sp.get('status')) q = q.eq('status', sp.get('status')!.toUpperCase());
  if (sp.get('category')) q = q.eq('epr_category', sp.get('category')!.toUpperCase());

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contracts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const body = await req.json().catch(() => ({}));
  if (!body.recycler_id) return NextResponse.json({ error: 'recycler_id required' }, { status: 400 });
  if (!body.epr_category) return NextResponse.json({ error: 'epr_category required' }, { status: 400 });

  const clientId = actor.isAdmin && body.client_id ? body.client_id : actor.userId;
  const db = adminClient();

  const { data, error } = await (db as any)
    .from('recycler_contracts')
    .insert({
      client_id: clientId,
      recycler_id: body.recycler_id,
      status: 'DRAFT',
      epr_category: String(body.epr_category).toUpperCase(),
      financial_year: body.financial_year ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      committed_qty: body.committed_qty ?? null,
      renewal_notice_days: body.renewal_notice_days ?? 30,
      auto_renewal: body.auto_renewal ?? false,
      contract_doc_url: body.contract_doc_url ?? null,
    })
    .select('id, contract_number')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
