import { NextRequest, NextResponse } from 'next/server';
import { resolveTenderingUser, getServiceClient } from '@/lib/tendering/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const db = getServiceClient();

    // If status is being set to 'filed', record filed_at and assigned_to
    const updates: any = { ...body };
    if (body.status === 'filed' && !body.filed_at) {
      updates.filed_at    = new Date().toISOString();
      updates.assigned_to = actor.id;
    }

    const { data, error } = await (db as any)
      .from('recycler_filing_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update filing request' }, { status: 500 });
  }
}
