import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { publishContent } from '@/lib/comms/publisher';

// POST /api/comms/content/[id]/publish
// Body: { connection_id: string }
// Publishes the approved/scheduled content item to the specified platform
// connection, stores the returned platform_post_id, and marks it published.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canPublish = await checkCommsPermission(actor.role, 'publish');
  if (!canPublish) return NextResponse.json({ error: 'Forbidden: publish permission required' }, { status: 403 });

  const { id } = await params;
  const { connection_id } = await req.json();

  if (!connection_id) {
    return NextResponse.json({ error: 'connection_id is required' }, { status: 400 });
  }

  const client = getCommsAdminClient();

  const { data: item } = await client
    .from('comms_content_items')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
  if (!['approved', 'scheduled'].includes(item.status)) {
    return NextResponse.json({ error: `Cannot publish item with status "${item.status}". Must be approved or scheduled.` }, { status: 422 });
  }

  const result = await publishContent(connection_id, item);

  if (!result.success) {
    await client.from('comms_content_audit').insert({
      content_id:  id,
      actor_id:    actor.id,
      actor_email: actor.email,
      action:      'publish_failed',
      from_status: item.status,
      to_status:   item.status,
      notes:       result.error ?? 'Platform publish failed',
    });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const now = new Date().toISOString();
  await client.from('comms_content_items').update({
    status:           'published',
    published_at:     now,
    platform_post_id: result.platformPostId ?? null,
    connection_id,
    updated_at:       now,
  }).eq('id', id);

  // Seed an initial metrics row so the performance panel shows up immediately
  if (result.platformPostId) {
    const { data: conn } = await client
      .from('comms_platform_connections')
      .select('account_id')
      .eq('id', connection_id)
      .maybeSingle();

    if (conn) {
      await client.from('comms_post_metrics').upsert({
        connection_id,
        account_id:       conn.account_id,
        platform:         item.platform,
        platform_post_id: result.platformPostId,
        content_item_id:  id,
        posted_at:        now,
        post_text:        [item.hook, item.body].filter(Boolean).join('\n\n'),
        synced_at:        now,
      }, { onConflict: 'connection_id,platform_post_id' });
    }
  }

  await client.from('comms_content_audit').insert({
    content_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'publish',
    from_status: item.status,
    to_status:   'published',
    notes:       result.platformPostId ? `Platform post ID: ${result.platformPostId}` : 'Published (no post ID returned)',
  });

  return NextResponse.json({ success: true, platformPostId: result.platformPostId ?? null });
}
