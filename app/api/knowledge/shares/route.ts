import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeAdminClient, resolveKnowledgeActor } from '@/lib/knowledge/auth';
import {
  canManageKnowledgeShares,
  TELECALLING_DOCUMENT_ROLES,
} from '@/lib/knowledge/sharedDocuments';

export async function GET() {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageKnowledgeShares(actor.role)) {
    return NextResponse.json({ error: 'Only Knowledge Admins can manage shared documents.' }, { status: 403 });
  }

  const db = getKnowledgeAdminClient();
  const [itemsResult, usersResult, sharesResult, authResult] = await Promise.all([
    (db as any)
      .from('knowledge_items')
      .select('id, title, description, item_type, category_id, file_name, file_size, mime_type, external_url, created_at')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('title', { ascending: true }),
    (db as any)
      .from('profiles')
      .select('id, full_name, role, is_banned')
      .in('role', [...TELECALLING_DOCUMENT_ROLES])
      .order('full_name', { ascending: true }),
    (db as any)
      .from('knowledge_item_shares')
      .select('id, item_id, user_id, shared_by, shared_at')
      .order('shared_at', { ascending: false }),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const firstError = itemsResult.error || usersResult.error || sharesResult.error || authResult.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const categoryIds = Array.from(new Set((itemsResult.data || []).map((item: any) => item.category_id).filter(Boolean)));
  const sharerIds = Array.from(new Set((sharesResult.data || []).map((share: any) => share.shared_by).filter(Boolean)));
  const [categoriesResult, sharersResult] = await Promise.all([
    categoryIds.length
      ? (db as any).from('knowledge_categories').select('id, name, color').in('id', categoryIds)
      : Promise.resolve({ data: [], error: null }),
    sharerIds.length
      ? (db as any).from('profiles').select('id, full_name').in('id', sharerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesResult.error || sharersResult.error) {
    return NextResponse.json({ error: categoriesResult.error?.message || sharersResult.error?.message }, { status: 500 });
  }

  const emailById = new Map((authResult.data?.users || []).map(user => [user.id, user.email || '']));
  const categoryById = new Map<string, any>((categoriesResult.data || []).map((category: any) => [category.id, category]));
  const sharerById = new Map<string, string>((sharersResult.data || []).map((profile: any) => [profile.id, profile.full_name || 'Knowledge Admin']));
  const itemById = new Map<string, any>((itemsResult.data || []).map((item: any) => [item.id, item]));
  const userById = new Map<string, any>((usersResult.data || []).map((user: any) => [user.id, user]));

  const items = (itemsResult.data || []).map((item: any) => ({
    ...item,
    category_name: item.category_id ? categoryById.get(item.category_id)?.name || null : null,
    category_color: item.category_id ? categoryById.get(item.category_id)?.color || null : null,
  }));

  const users = (usersResult.data || [])
    .filter((user: any) => !user.is_banned)
    .map((user: any) => ({ ...user, email: emailById.get(user.id) || '' }));

  const shares = (sharesResult.data || [])
    .filter((share: any) => itemById.has(share.item_id) && userById.has(share.user_id))
    .map((share: any) => ({
      ...share,
      item_title: itemById.get(share.item_id)?.title || 'Document',
      item_type: itemById.get(share.item_id)?.item_type || 'document',
      user_name: userById.get(share.user_id)?.full_name || emailById.get(share.user_id) || 'Telecalling User',
      user_email: emailById.get(share.user_id) || '',
      user_role: userById.get(share.user_id)?.role || '',
      shared_by_name: share.shared_by ? sharerById.get(share.shared_by) || 'Knowledge Admin' : 'Knowledge Admin',
    }));

  return NextResponse.json({ items, users, shares });
}

export async function POST(req: NextRequest) {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageKnowledgeShares(actor.role)) {
    return NextResponse.json({ error: 'Only Knowledge Admins can share documents.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const itemId = typeof body?.item_id === 'string' ? body.item_id : '';
  const userIds = Array.isArray(body?.user_ids)
    ? Array.from(new Set(body.user_ids.filter((id: unknown): id is string => typeof id === 'string' && !!id))).slice(0, 200)
    : [];

  if (!itemId || userIds.length === 0) {
    return NextResponse.json({ error: 'Select a document and at least one Telecalling user.' }, { status: 400 });
  }

  const db = getKnowledgeAdminClient();
  const [{ data: item }, { data: recipients, error: recipientError }] = await Promise.all([
    (db as any)
      .from('knowledge_items')
      .select('id')
      .eq('id', itemId)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .maybeSingle(),
    (db as any)
      .from('profiles')
      .select('id, role, is_banned')
      .in('id', userIds)
      .in('role', [...TELECALLING_DOCUMENT_ROLES]),
  ]);

  if (!item) return NextResponse.json({ error: 'Document not found or is not published.' }, { status: 404 });
  if (recipientError) return NextResponse.json({ error: recipientError.message }, { status: 500 });

  const validRecipientIds = (recipients || []).filter((user: any) => !user.is_banned).map((user: any) => user.id);
  if (validRecipientIds.length !== userIds.length) {
    return NextResponse.json({ error: 'One or more selected users are not eligible Telecalling users.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await (db as any)
    .from('knowledge_item_shares')
    .select('user_id')
    .eq('item_id', itemId)
    .in('user_id', validRecipientIds);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const alreadyShared = new Set((existing || []).map((share: any) => share.user_id));
  const rows = validRecipientIds
    .filter((userId: string) => !alreadyShared.has(userId))
    .map((userId: string) => ({ item_id: itemId, user_id: userId, shared_by: actor.id }));

  if (rows.length) {
    const { error } = await (db as any).from('knowledge_item_shares').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, created: rows.length, already_shared: userIds.length - rows.length });
}
