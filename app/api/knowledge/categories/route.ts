/**
 * GET  /api/knowledge/categories  — list categories with item counts (any knowledge role)
 * POST /api/knowledge/categories  — create a category (manager+)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveKnowledgeActor, getKnowledgeAdminClient } from '@/lib/knowledge/auth';
import { canManageAll } from '@/lib/knowledge/permissions';
import { isKnowledgeServiceType } from '@/lib/knowledge/serviceTypes';

function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET() {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getKnowledgeAdminClient();
  const { data: categories, error } = await (db as any)
    .from('knowledge_categories')
    .select('id, name, slug, description, color, service_type, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach a live item count per category.
  const { data: items } = await (db as any)
    .from('knowledge_items').select('category_id').eq('is_deleted', false);
  const counts: Record<string, number> = {};
  for (const i of items || []) {
    if (i.category_id) counts[i.category_id] = (counts[i.category_id] ?? 0) + 1;
  }

  const enriched = (categories || []).map((c: any) => ({ ...c, item_count: counts[c.id] ?? 0 }));
  return NextResponse.json({ categories: enriched });
}

export async function POST(req: NextRequest) {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageAll(actor.role)) {
    return NextResponse.json({ error: 'You do not have permission to manage categories' }, { status: 403 });
  }

  const body = await req.json();
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (body.service_type && !isKnowledgeServiceType(body.service_type)) {
    return NextResponse.json({ error: 'invalid service_type' }, { status: 400 });
  }

  const db = getKnowledgeAdminClient();
  const { data: category, error } = await (db as any)
    .from('knowledge_categories')
    .insert({
      name,
      slug: slugify(name) || `cat-${Date.now()}`,
      description: body.description?.trim() || null,
      color: body.color?.trim() || 'cyan',
      service_type: body.service_type || null,
      sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 0,
      created_by: actor.id,
    })
    .select()
    .single();

  if (error) {
    const msg = error.code === '23505' ? 'A category with that name already exists' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ category }, { status: 201 });
}
