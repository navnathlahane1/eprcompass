import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = adminClient();

    // Only allow cancellation if still pending
    const { data: req_ } = await (db as any)
      .from('recycler_filing_requests')
      .select('id, status, recycler_id')
      .eq('id', id)
      .maybeSingle();

    if (!req_ || req_.recycler_id !== actor.recyclerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (req_.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending requests can be cancelled.' }, { status: 422 });
    }

    await (db as any)
      .from('recycler_filing_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 });
  }
}
