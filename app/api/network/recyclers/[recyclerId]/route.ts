/**
 * @openapi
 * /api/network/recyclers/{recyclerId}:
 *   get:    { summary: Get one recycler, tags: [Recycler Network] }
 *   put:    { summary: Update recycler (admin only), tags: [Recycler Network] }
 * /api/network/recyclers/{recyclerId}/verify:
 *   patch:  { summary: Change verification status (super-admin), tags: [Recycler Network] }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

// ─── GET /api/network/recyclers/[recyclerId] ──────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  const { recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recyclers')
    .select('*')
    .eq('id', recyclerId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Clients can only see VERIFIED recyclers
  if (!actor.isAdmin && data.verification_status !== 'VERIFIED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch latest rating for this recycler linked to this client
  const clientId = actor.isAdmin ? null : actor.userId;
  let rating = null;
  if (clientId) {
    const { data: ratingData } = await (db as any)
      .from('recycler_ratings')
      .select('overall_score, timeliness, documentation, quantity_accuracy, compliance_score, responsiveness, computed_at')
      .eq('recycler_id', recyclerId)
      .eq('client_id', clientId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    rating = ratingData;
  }

  return NextResponse.json({ recycler: data, rating });
}

// ─── PUT /api/network/recyclers/[recyclerId] ──────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  const { recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = adminClient();

  const allowed = [
    'name', 'registration_number', 'epr_categories', 'authorized_states',
    'certifications', 'contact_email', 'contact_phone', 'contact_address',
    'contact_pincode', 'capacity', 'last_audit_date', 'next_audit_due',
    'pro_registration_number', 'pro_valid_till', 'pro_members_count', 'pro_total_capacity',
  ];

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  // Re-queue geocoding if address changed
  if ('contact_address' in patch || 'contact_pincode' in patch) {
    patch.geocode_queued = true;
    patch.lat = null;
    patch.lng = null;
  }

  const { data, error } = await (db as any)
    .from('recyclers')
    .update(patch)
    .eq('id', recyclerId)
    .select('id, recycler_code, name, verification_status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (db as any).from('recycler_audit_log').insert({
    recycler_id: recyclerId,
    actor_id: actor.userId,
    action: 'UPDATE',
    payload: patch,
  });

  return NextResponse.json(data);
}
