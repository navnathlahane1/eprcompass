/**
 * PATCH  /api/knowledge/categories/[id]  — edit a category (manager+)
 * DELETE /api/knowledge/categories/[id]  — delete a category (manager+; items keep, category_id nulled)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveKnowledgeActor, getKnowledgeAdminClient } from '@/lib/knowledge/auth';
import { canManageAll } from '@/lib/knowledge/permissions';
import { isKnowledgeServiceType } from '@/lib/knowledge/serviceTypes';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageAll(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if ('service_type' in body && body.service_type && !isKnowledgeServiceType(body.service_type)) {
    return NextResponse.json({ error: 'invalid service_type' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string')        updates.name = body.name.trim();
  if ('description' in body)                updates.description = body.description?.trim() || null;
  if (typeof body.color === 'string')       updates.color = body.color.trim();
  if ('service_type' in body)               updates.service_type = body.service_type || null;
  if (Number.isFinite(body.sort_order))     updates.sort_order = body.sort_order;

  const db = getKnowledgeAdminClient();
  const { data: category, error } = await (db as any)
    .from('knowledge_categories').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ category });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageAll(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Items reference the category with ON DELETE SET NULL, so deleting a category
  // leaves its items intact (uncategorized).
  const db = getKnowledgeAdminClient();
  const { error } = await (db as any).from('knowledge_categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
