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
    const { data, error } = await (db as any)
      .from('govt_tenders')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tender: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const db = getServiceClient();

    // Soft-delete: set is_active = false
    const { error } = await (db as any)
      .from('govt_tenders')
      .update({ is_active: false })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
