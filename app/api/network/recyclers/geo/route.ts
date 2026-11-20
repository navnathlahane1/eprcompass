/**
 * @openapi
 * /api/network/recyclers/geo:
 *   get:
 *     summary: GeoJSON-compatible list for map rendering
 *     tags: [Recycler Network]
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';
import { ratingToMapColor } from '@/lib/recyclerNetwork/recyclerNetworkService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const sp = req.nextUrl.searchParams;
  const linkedOnly = sp.get('linked') === 'true';
  const category = sp.get('category')?.toUpperCase();

  const db = adminClient();

  // Build recycler list
  let q = (db as any)
    .from('recyclers')
    .select('id, name, type, epr_categories, authorized_states, verification_status, lat, lng, recycler_code')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .eq('verification_status', 'VERIFIED');

  if (category) q = q.contains('epr_categories', [category]);

  const clientId = actor.isAdmin && sp.get('clientId') ? sp.get('clientId')! : actor.userId;
  if (linkedOnly) {
    const { data: links } = await (db as any)
      .from('client_recycler_links')
      .select('recycler_id')
      .eq('client_id', clientId)
      .eq('status', 'ACTIVE');
    const ids = (links ?? []).map((l: any) => l.recycler_id);
    if (!ids.length) return NextResponse.json({ pins: [] });
    q = q.in('id', ids);
  }

  const { data: recyclers, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get latest ratings for each recycler
  const ids = (recyclers ?? []).map((r: any) => r.id);
  const ratingMap = new Map<string, number>();
  if (ids.length) {
    const { data: ratings } = await (db as any)
      .from('recycler_ratings')
      .select('recycler_id, overall_score, computed_at')
      .in('recycler_id', ids)
      .eq('client_id', clientId)
      .order('computed_at', { ascending: false });

    // Keep only the most recent per recycler
    for (const r of ratings ?? []) {
      if (!ratingMap.has(r.recycler_id)) ratingMap.set(r.recycler_id, r.overall_score);
    }
  }

  const pins = (recyclers ?? []).map((r: any) => ({
    id: r.id,
    recycler_code: r.recycler_code,
    name: r.name,
    type: r.type,
    categories: r.epr_categories,
    states: r.authorized_states,
    status: r.verification_status,
    lat: r.lat,
    lng: r.lng,
    rating: ratingMap.get(r.id) ?? null,
    color: ratingToMapColor(ratingMap.get(r.id) ?? null, r.verification_status),
  }));

  return NextResponse.json({ pins });
}
