import { NextResponse } from 'next/server';
import { getKnowledgeAdminClient, resolveKnowledgeActor } from '@/lib/knowledge/auth';
import { canManageKnowledgeShares } from '@/lib/knowledge/sharedDocuments';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageKnowledgeShares(actor.role)) {
    return NextResponse.json({ error: 'Only Knowledge Admins can revoke shared documents.' }, { status: 403 });
  }

  const { id } = await params;
  const db = getKnowledgeAdminClient();
  const { data: share, error: lookupError } = await (db as any)
    .from('knowledge_item_shares')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!share) return NextResponse.json({ error: 'Shared document assignment not found.' }, { status: 404 });

  const { error } = await (db as any).from('knowledge_item_shares').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
