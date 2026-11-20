import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/comms/content/[id]/comments
export async function GET(_req: NextRequest, { params }: Ctx) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client  = getCommsAdminClient();

  const { data, error } = await client
    .from('comms_content_comments')
    .select('id, body, created_at, updated_at, author_id, author_email, profiles:author_id(full_name)')
    .eq('content_id', id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

// POST /api/comms/content/[id]/comments
// Body: { body: string }
export async function POST(req: NextRequest, { params }: Ctx) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }   = await params;
  const { body } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
  }
  if (body.trim().length > 2000) {
    return NextResponse.json({ error: 'Comment must be 2000 characters or fewer' }, { status: 400 });
  }

  const client = getCommsAdminClient();

  // Verify content item exists
  const { data: item } = await client
    .from('comms_content_items')
    .select('id')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: 'Content item not found' }, { status: 404 });

  const { data, error } = await client
    .from('comms_content_comments')
    .insert({ content_id: id, author_id: actor.id, author_email: actor.email, body: body.trim() })
    .select('id, body, created_at, author_id, author_email, profiles:author_id(full_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}

// DELETE /api/comms/content/[id]/comments?commentId=<uuid>
// Soft-deletes the comment. Author can delete their own; admin/CMO can delete any.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }      = await params;
  const commentId   = new URL(req.url).searchParams.get('commentId');
  if (!commentId)   return NextResponse.json({ error: 'commentId required' }, { status: 400 });

  const client = getCommsAdminClient();

  const { data: comment } = await client
    .from('comms_content_comments')
    .select('id, author_id')
    .eq('id', commentId)
    .eq('content_id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const canDelete =
    comment.author_id === actor.id ||
    ['admin', 'manager', 'comms_cmo'].includes(actor.role);

  if (!canDelete) {
    return NextResponse.json({ error: 'Forbidden: you can only delete your own comments' }, { status: 403 });
  }

  await client
    .from('comms_content_comments')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', commentId);

  return NextResponse.json({ success: true });
}
