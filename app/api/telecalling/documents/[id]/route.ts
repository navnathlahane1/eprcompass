import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';
import { TELECALLING_DOCUMENT_ROLES } from '@/lib/knowledge/sharedDocuments';

const BUCKET = 'knowledge-base';
const VIEWER_ROLES = [...TELECALLING_DOCUMENT_ROLES, 'admin', 'manager'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCallerActor(VIEWER_ROLES);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data: share, error: shareError } = await (actor.db as any)
    .from('knowledge_item_shares')
    .select('id')
    .eq('item_id', id)
    .eq('user_id', actor.id)
    .maybeSingle();

  if (shareError) return NextResponse.json({ error: shareError.message }, { status: 500 });
  if (!share) return NextResponse.json({ error: 'This document has not been shared with you.' }, { status: 403 });

  const { data: item, error: itemError } = await (actor.db as any)
    .from('knowledge_items')
    .select('id, file_path, file_name, external_url, view_count, is_deleted, is_published')
    .eq('id', id)
    .maybeSingle();

  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
  if (!item || item.is_deleted || !item.is_published) {
    return NextResponse.json({ error: 'Document is no longer available.' }, { status: 404 });
  }

  await (actor.db as any)
    .from('knowledge_items')
    .update({ view_count: (item.view_count || 0) + 1 })
    .eq('id', id);

  if (!item.file_path && item.external_url) {
    return NextResponse.json({ url: item.external_url, external: true });
  }

  const forceDownload = req.nextUrl.searchParams.get('download') === '1';
  const { data: signed, error } = await actor.db.storage
    .from(BUCKET)
    .createSignedUrl(item.file_path, 300, forceDownload ? { download: item.file_name || undefined } : undefined);

  if (error || !signed) {
    return NextResponse.json({ error: error?.message || 'Failed to generate document link.' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, external: false });
}
