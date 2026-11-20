/**
 * @openapi
 * /api/network/recyclers/{recyclerId}/ratings:
 *   get:  { summary: Get ratings history for a recycler, tags: [Recycler Network] }
 *   post: { summary: Submit a rating, tags: [Recycler Network] }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';
import { computeOverallRating } from '@/lib/recyclerNetwork/recyclerNetworkService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  const { recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  const clientId = actor.isAdmin && req.nextUrl.searchParams.get('clientId')
    ? req.nextUrl.searchParams.get('clientId')!
    : actor.userId;

  const { data, error } = await (db as any)
    .from('recycler_ratings')
    .select('*')
    .eq('recycler_id', recyclerId)
    .eq('client_id', clientId)
    .order('computed_at', { ascending: false })
    .limit(24);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ratings: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  const { recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const body = await req.json().catch(() => ({}));
  const db = adminClient();

  const dims = {
    timeliness: Number(body.timeliness),
    documentation: Number(body.documentation),
    quantity_accuracy: Number(body.quantity_accuracy),
    compliance_score: Number(body.compliance_score),
    responsiveness: Number(body.responsiveness),
  };

  for (const [key, val] of Object.entries(dims)) {
    if (isNaN(val) || val < 1 || val > 5) {
      return NextResponse.json({ error: `${key} must be between 1 and 5` }, { status: 400 });
    }
  }

  const clientId = actor.isAdmin && body.client_id ? body.client_id : actor.userId;
  const overallScore = computeOverallRating(dims);

  const { data, error } = await (db as any)
    .from('recycler_ratings')
    .insert({
      recycler_id: recyclerId,
      client_id: clientId,
      financial_year: body.financial_year ?? null,
      month: body.month ?? null,
      ...dims,
      overall_score: overallScore,
      rated_by: actor.userId,
      notes: body.notes ?? null,
      is_manual_override: false,
    })
    .select('id, overall_score')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
