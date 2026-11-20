/**
 * PATCH  /api/recycler-portal/authorizations/[authId]  — update / mark renewal
 * DELETE /api/recycler-portal/authorizations/[authId]  — delete
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ authId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { authId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_authorizations').select('id').eq('id', authId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Authorization not found' }, { status: 404 });

  const allowed: Record<string, any> = {};
  for (const k of ['auth_type', 'authority_name', 'reference_no', 'document_url', 'notes']) {
    if (b[k] !== undefined) allowed[k] = b[k]?.trim?.() || null;
  }
  for (const k of ['issue_date', 'expiry_date']) {
    if (b[k] !== undefined) allowed[k] = b[k] || null;
  }
  if (b.renewal_reminder_days !== undefined) allowed.renewal_reminder_days = Number(b.renewal_reminder_days) || 60;
  if (b.status !== undefined && ['ACTIVE', 'EXPIRING', 'EXPIRED', 'PENDING_RENEWAL', 'NA'].includes(b.status)) {
    allowed.status = b.status;
  }

  const { data, error } = await (db as any)
    .from('recycler_authorizations').update(allowed).eq('id', authId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ authorization: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { authId } = await params;
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_authorizations').select('id').eq('id', authId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Authorization not found' }, { status: 404 });

  const { error } = await (db as any).from('recycler_authorizations').delete().eq('id', authId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
