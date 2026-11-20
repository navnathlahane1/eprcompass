import { NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';
import { TELECALLING_DOCUMENT_ROLES } from '@/lib/knowledge/sharedDocuments';

const VIEWER_ROLES = [...TELECALLING_DOCUMENT_ROLES, 'admin', 'manager'];

export async function GET() {
  const actor = await resolveCallerActor(VIEWER_ROLES);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: shares, error: sharesError } = await (actor.db as any)
    .from('knowledge_item_shares')
    .select('id, item_id, shared_at')
    .eq('user_id', actor.id)
    .order('shared_at', { ascending: false });

  if (sharesError) return NextResponse.json({ error: sharesError.message }, { status: 500 });
  const itemIds = (shares || []).map((share: any) => share.item_id);
  if (!itemIds.length) return NextResponse.json({ items: [] });

  const { data: items, error: itemsError } = await (actor.db as any)
    .from('knowledge_items')
    .select('id, title, description, item_type, category_id, tags, file_name, file_size, mime_type, external_url, created_at')
    .in('id', itemIds)
    .eq('is_deleted', false)
    .eq('is_published', true);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  const categoryIds = Array.from(new Set((items || []).map((item: any) => item.category_id).filter(Boolean)));
  let categories: any[] = [];
  if (categoryIds.length) {
    const { data, error } = await (actor.db as any)
      .from('knowledge_categories')
      .select('id, name, color')
      .in('id', categoryIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    categories = data || [];
  }

  const categoryById = new Map<string, any>(categories.map(category => [category.id, category]));
  const itemById = new Map<string, any>((items || []).map((item: any) => [item.id, item]));
  const enriched = (shares || []).flatMap((share: any) => {
    const item = itemById.get(share.item_id);
    if (!item) return [];
    const category = item.category_id ? categoryById.get(item.category_id) : null;
    return [{
      ...item,
      share_id: share.id,
      shared_at: share.shared_at,
      category_name: category?.name || null,
      category_color: category?.color || null,
    }];
  });

  return NextResponse.json({ items: enriched });
}
