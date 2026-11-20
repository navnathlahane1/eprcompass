/**
 * @openapi
 * /api/network/clients/{clientId}/recyclers:
 *   get:    { summary: List recyclers linked to client, tags: [Recycler Network] }
 *   post:   { summary: Link a recycler to client, tags: [Recycler Network] }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Clients can only access their own data
  const effectiveClientId = actor.isAdmin ? clientId : actor.userId;
  if (!actor.isAdmin && effectiveClientId !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('client_recycler_links')
    .select(`
      id, status, linked_at, primary_contact, notes,
      recyclers (
        id, recycler_code, name, type, epr_categories,
        authorized_states, verification_status, contact_email
      )
    `)
    .eq('client_id', effectiveClientId)
    .order('linked_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const effectiveClientId = actor.isAdmin ? clientId : actor.userId;
  if (!actor.isAdmin && effectiveClientId !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const body = await req.json().catch(() => ({}));
  if (!body.recycler_id) return NextResponse.json({ error: 'recycler_id required' }, { status: 400 });

  const db = adminClient();

  // Check recycler exists and is VERIFIED
  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('id, name, verification_status')
    .eq('id', body.recycler_id)
    .maybeSingle();

  if (!recycler) return NextResponse.json({ error: 'Recycler not found' }, { status: 404 });
  if (recycler.verification_status !== 'VERIFIED') {
    return NextResponse.json({ error: 'Only VERIFIED recyclers can be linked' }, { status: 422 });
  }

  // Upsert — re-activate if previously REMOVED
  const { data, error } = await (db as any)
    .from('client_recycler_links')
    .upsert({
      client_id: effectiveClientId,
      recycler_id: body.recycler_id,
      status: 'ACTIVE',
      linked_by: actor.userId,
      primary_contact: body.primary_contact ?? null,
      notes: body.notes ?? null,
    }, { onConflict: 'client_id,recycler_id' })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, linked: true }, { status: 201 });
}
