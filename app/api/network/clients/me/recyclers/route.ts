/**
 * Convenience alias: /api/network/clients/me/recyclers
 * Resolves the current user's clientId and proxies to the main handler.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

export async function GET(_req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('client_recycler_links')
    .select(`
      id, status, linked_at,
      recyclers (
        id, recycler_code, name, type, epr_categories,
        authorized_states, verification_status
      )
    `)
    .eq('client_id', actor.userId)
    .neq('status', 'REMOVED')
    .order('linked_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const body = await req.json().catch(() => ({}));
  if (!body.recycler_id) return NextResponse.json({ error: 'recycler_id required' }, { status: 400 });

  const db = adminClient();

  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('id, verification_status')
    .eq('id', body.recycler_id)
    .maybeSingle();

  if (!recycler) return NextResponse.json({ error: 'Recycler not found' }, { status: 404 });
  if (recycler.verification_status !== 'VERIFIED') {
    return NextResponse.json({ error: 'Only VERIFIED recyclers can be linked' }, { status: 422 });
  }

  const { data, error } = await (db as any)
    .from('client_recycler_links')
    .upsert({
      client_id: actor.userId,
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
