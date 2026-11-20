import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** POST /api/admin/service-requests/[id]/messages — add a message or internal note */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content, is_internal = false } = body as { content: string; is_internal?: boolean };

  if (!content?.trim() || content.trim().length < 2)
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });

  const db = adminClient();

  const { data: request } = await (db as any)
    .from('service_requests')
    .select('id, profile_id')
    .eq('id', id)
    .maybeSingle();

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: message, error } = await (db as any)
    .from('service_request_messages')
    .insert({
      request_id:  id,
      author_id:   actor.userId,
      content:     content.trim(),
      is_internal: Boolean(is_internal),
    })
    .select(`id, content, is_internal, created_at,
             profiles!service_request_messages_author_id_fkey ( id, full_name, role )`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify client only for non-internal messages
  if (!is_internal) {
    try {
      await (db as any).from('notifications').insert({
        profile_id: request.profile_id,
        type:       'system',
        message:    'New message from admin on your service request',
        read:       false,
        metadata:   { request_id: id, action: 'admin_message' },
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ message }, { status: 201 });
}
