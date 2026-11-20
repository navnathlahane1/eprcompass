/**
 * GET  /api/knowledge/items   — list documents + training materials (filterable)
 * POST /api/knowledge/items   — save metadata after upload (contributor+)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveKnowledgeActor, getKnowledgeAdminClient } from '@/lib/knowledge/auth';
import { canContribute } from '@/lib/knowledge/permissions';

export async function GET(req: NextRequest) {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type     = searchParams.get('type')     || '';   // document | training_material
  const category = searchParams.get('category') || '';   // category_id
  const service  = searchParams.get('service')  || '';   // knowledge_categories.service_type
  const tag      = searchParams.get('tag')      || '';
  const search   = searchParams.get('search')   || '';

  const db = getKnowledgeAdminClient();

  let query = (db as any)
    .from('knowledge_items')
    .select(
      'id, title, description, item_type, category_id, tags, file_name, file_size, mime_type, external_url, is_published, view_count, created_by, created_at, updated_at'
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (type)     query = query.eq('item_type', type);
  if (category) query = query.eq('category_id', category);
  if (tag)      query = query.contains('tags', [tag]);
  if (search)   query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  // Items don't carry a service_type directly — it lives on their category —
  // so resolve the matching category ids first and filter by those.
  if (service) {
    const { data: catsForService } = await (db as any)
      .from('knowledge_categories').select('id').eq('service_type', service);
    const ids = (catsForService || []).map((c: any) => c.id);
    query = query.in('category_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: items, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with category name + uploader name (profiles has no email column).
  const catIds   = Array.from(new Set((items || []).map((i: any) => i.category_id).filter(Boolean)));
  const ownerIds = Array.from(new Set((items || []).map((i: any) => i.created_by).filter(Boolean)));

  const catMap: Record<string, { name: string; color: string }> = {};
  if (catIds.length) {
    const { data: cats } = await (db as any)
      .from('knowledge_categories').select('id, name, color').in('id', catIds);
    for (const c of cats || []) catMap[c.id] = { name: c.name, color: c.color };
  }

  const ownerMap: Record<string, string> = {};
  if (ownerIds.length) {
    const { data: profiles } = await (db as any)
      .from('profiles').select('id, full_name, company_name').in('id', ownerIds);
    for (const p of profiles || []) ownerMap[p.id] = p.full_name || p.company_name || '';
  }

  const enriched = (items || []).map((i: any) => ({
    ...i,
    category_name:  i.category_id ? (catMap[i.category_id]?.name ?? null) : null,
    category_color: i.category_id ? (catMap[i.category_id]?.color ?? null) : null,
    uploaded_by:    i.created_by ? (ownerMap[i.created_by] ?? null) : null,
  }));

  return NextResponse.json({ items: enriched });
}

export async function POST(req: NextRequest) {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canContribute(actor.role)) {
    return NextResponse.json({ error: 'You do not have permission to add items' }, { status: 403 });
  }

  const body = await req.json();
  const {
    title, description, item_type, category_id, tags,
    file_name, file_path, file_size, mime_type, external_url,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (item_type && !['document', 'training_material'].includes(item_type)) {
    return NextResponse.json({ error: 'invalid item_type' }, { status: 400 });
  }
  if (!file_path && !external_url?.trim()) {
    return NextResponse.json({ error: 'Either an uploaded file or an external URL is required' }, { status: 400 });
  }

  const cleanTags: string[] = Array.isArray(tags)
    ? tags.map((t: string) => String(t).trim()).filter(Boolean).slice(0, 20)
    : [];

  const db = getKnowledgeAdminClient();
  const { data: item, error } = await (db as any)
    .from('knowledge_items')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      item_type: item_type || 'document',
      category_id: category_id || null,
      tags: cleanTags,
      file_name: file_name || null,
      file_path: file_path || null,
      file_size: file_size || null,
      mime_type: mime_type || null,
      external_url: external_url?.trim() || null,
      created_by: actor.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item }, { status: 201 });
}
