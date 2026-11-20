/**
 * PATCH /api/recycler-portal/financing/[appId]  — withdraw application
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ appId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { appId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_finance_applications').select('id, status').eq('id', appId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  // Recyclers can only withdraw an application that hasn't been disbursed
  if (b.action === 'withdraw') {
    if (['DISBURSED', 'REPAID'].includes(existing.status)) {
      return NextResponse.json({ error: 'Cannot withdraw a disbursed application' }, { status: 400 });
    }
    const { error } = await (db as any).from('recycler_finance_applications').update({ status: 'WITHDRAWN' }).eq('id', appId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
