/**
 * GET    /api/knowledge/items/[id]  — item detail + signed download URL (any knowledge role)
 * PATCH  /api/knowledge/items/[id]  — edit metadata (manager+, or own item)
 * DELETE /api/knowledge/items/[id]  — soft-delete + remove storage object (manager+, or own item)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveKnowledgeActor, getKnowledgeAdminClient } from '@/lib/knowledge/auth';
import { canEditItem } from '@/lib/knowledge/permissions';

const BUCKET = 'knowledge-base';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getKnowledgeAdminClient();
  const { data: item } = await (db as any)
    .from('knowledge_items')
    .select('id, title, item_type, file_path, file_name, external_url, view_count, is_deleted')
    .eq('id', id)
    .maybeSingle();

  if (!item || item.is_deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Bump the view counter (best-effort).
  await (db as any)
    .from('knowledge_items')
    .update({ view_count: (item.view_count ?? 0) + 1 })
    .eq('id', id);

  // Link-based items resolve directly to their external URL.
  if (!item.file_path && item.external_url) {
    return NextResponse.json({ url: item.external_url, external: true });
  }

  const forceDownload = req.nextUrl.searchParams.get('download') === '1';
  const { data: signed, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(item.file_path, 300, forceDownload ? { download: item.file_name || undefined } : undefined);

  if (error || !signed) {
    return NextResponse.json({ error: error?.message || 'Failed to generate download URL' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, external: false });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getKnowledgeAdminClient();
  const { data: item } = await (db as any)
    .from('knowledge_items').select('created_by, is_deleted').eq('id', id).maybeSingle();
  if (!item || item.is_deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canEditItem(actor.role, item.created_by, actor.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === 'string')        updates.title = body.title.trim();
  if ('description' in body)                 updates.description = body.description?.trim() || null;
  if (body.item_type && ['document', 'training_material'].includes(body.item_type))
    updates.item_type = body.item_type;
  if ('category_id' in body)                 updates.category_id = body.category_id || null;
  if (Array.isArray(body.tags))
    updates.tags = body.tags.map((t: string) => String(t).trim()).filter(Boolean).slice(0, 20);
  if (typeof body.is_published === 'boolean') updates.is_published = body.is_published;
  if ('external_url' in body)                updates.external_url = body.external_url?.trim() || null;

  const { data: updated, error } = await (db as any)
    .from('knowledge_items').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getKnowledgeAdminClient();
  const { data: item } = await (db as any)
    .from('knowledge_items').select('created_by, file_path, is_deleted').eq('id', id).maybeSingle();
  if (!item || item.is_deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canEditItem(actor.role, item.created_by, actor.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Remove the stored object (best-effort) then soft-delete the row.
  if (item.file_path) {
    await db.storage.from(BUCKET).remove([item.file_path]);
  }
  const { error } = await (db as any)
    .from('knowledge_items').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
