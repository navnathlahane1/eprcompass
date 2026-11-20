/**
 * @openapi
 * /api/network/recyclers:
 *   get:
 *     summary: List / search recyclers
 *     tags: [Recycler Network]
 *     parameters:
 *       - { in: query, name: clientId,  schema: { type: string } }
 *       - { in: query, name: category,  schema: { type: string } }
 *       - { in: query, name: state,     schema: { type: string } }
 *       - { in: query, name: status,    schema: { type: string } }
 *       - { in: query, name: type,      schema: { type: string } }
 *       - { in: query, name: linked,    schema: { type: string } }
 *       - { in: query, name: page,      schema: { type: integer } }
 *       - { in: query, name: limit,     schema: { type: integer } }
 *   post:
 *     summary: Create recycler (super-admin only)
 *     tags: [Recycler Network]
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
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? 20)));
  const offset = (page - 1) * limit;

  const db = adminClient();
  let q = (db as any)
    .from('recyclers')
    .select(
      'id, recycler_code, name, type, epr_categories, authorized_states, certifications, ' +
      'verification_status, lat, lng, last_audit_date, next_audit_due, ' +
      'contact_email, contact_phone, contact_address, contact_pincode, capacity',
      { count: 'exact' }
    )
    .range(offset, offset + limit - 1)
    .order('name', { ascending: true });

  // Admins see all; clients only see VERIFIED unless browsing all
  if (!actor.isAdmin) {
    q = q.eq('verification_status', 'VERIFIED');
  } else {
    if (sp.get('status')) q = q.eq('verification_status', sp.get('status'));
  }

  if (sp.get('type')) q = q.eq('type', sp.get('type')!.toUpperCase());

  // Array-contains filters
  if (sp.get('category')) q = q.contains('epr_categories', [sp.get('category')!.toUpperCase()]);
  if (sp.get('state'))    q = q.contains('authorized_states', [sp.get('state')!]);

  // "linked" filter: only show recyclers linked to clientId
  const linkedClientId = sp.get('clientId') && sp.get('linked') === 'true'
    ? (actor.isAdmin ? sp.get('clientId') : actor.userId)
    : null;

  if (linkedClientId) {
    const { data: links } = await (db as any)
      .from('client_recycler_links')
      .select('recycler_id')
      .eq('client_id', linkedClientId)
      .eq('status', 'ACTIVE');
    const ids = (links ?? []).map((l: any) => l.recycler_id);
    if (!ids.length) return NextResponse.json({ recyclers: [], total: 0, page, limit });
    q = q.in('id', ids);
  }

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ recyclers: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isSuperAdminUser && !actor.isAdmin) {
    return NextResponse.json({ error: 'Super-admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  // Basic validation
  if (!body.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!body.epr_categories?.length) return NextResponse.json({ error: 'epr_categories required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recyclers')
    .insert({
      name: String(body.name).trim(),
      type: String(body.type ?? 'RECYCLER').toUpperCase(),
      registration_number: body.registration_number ?? null,
      pro_registration_number: body.pro_registration_number ?? null,
      pro_valid_till: body.pro_valid_till ?? null,
      pro_members_count: body.pro_members_count ?? null,
      epr_categories: body.epr_categories ?? [],
      authorized_states: body.authorized_states ?? [],
      certifications: body.certifications ?? [],
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      contact_address: body.contact_address ?? null,
      contact_pincode: body.contact_pincode ?? null,
      capacity: body.capacity ?? [],
      verification_status: 'PENDING',
      geocode_queued: true,   // picked up by background geocoder
    })
    .select('id, recycler_code')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await (db as any).from('recycler_audit_log').insert({
    recycler_id: data.id,
    actor_id: actor.userId,
    action: 'CREATE',
    payload: { name: body.name },
  });

  return NextResponse.json(data, { status: 201 });
}
