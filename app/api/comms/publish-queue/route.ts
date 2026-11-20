import { NextRequest, NextResponse } from 'next/server';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { publishContent } from '@/lib/comms/publisher';

// POST /api/comms/publish-queue
// Called by cron (Authorization: Bearer $CRON_SECRET) or manually from the queue page.
// Finds all content items with status='scheduled' and scheduled_at <= now(),
// attempts real platform publish if a connection_id is stored, otherwise
// falls back to status-only transition, and writes an audit row for each.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow cron token OR any authenticated session hitting the endpoint manually.
  // Manual calls from the UI go through the normal comms session — we trust the
  // middleware auth gate on /comms/* and the permissions check in the queue page.
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!isCron) {
    // Lightweight check: require the header to at least be present from internal calls
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    if (siteUrl && !origin.startsWith(siteUrl)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const client = getCommsAdminClient();
  const now    = new Date().toISOString();

  const { data: due, error: fetchErr } = await client
    .from('comms_content_items')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .eq('is_deleted', false);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ published: 0, failed: 0, ids: [] });

  let published = 0;
  let failed    = 0;
  const ids: string[] = [];

  for (const item of due) {
    let platformPostId: string | null = null;
    let publishNote = 'Auto-published by publish queue cron';

    // Attempt real platform publish when a connection is stored
    if (item.connection_id) {
      const result = await publishContent(item.connection_id, item);
      if (!result.success) {
        await client.from('comms_content_audit').insert({
          content_id:  item.id,
          actor_id:    null,
          actor_email: 'system@cron',
          action:      'publish_failed',
          from_status: 'scheduled',
          to_status:   'scheduled',
          notes:       result.error ?? 'Platform publish failed',
        });
        failed++;
        continue;
      }
      platformPostId = result.platformPostId ?? null;
      publishNote    = platformPostId
        ? `Auto-published. Platform post ID: ${platformPostId}`
        : 'Auto-published (no post ID returned)';
    }

    const { error: updErr } = await client
      .from('comms_content_items')
      .update({
        status:           'published',
        published_at:     now,
        platform_post_id: platformPostId,
        updated_at:       now,
      })
      .eq('id', item.id);

    if (updErr) { failed++; continue; }

    await client.from('comms_content_audit').insert({
      content_id:  item.id,
      actor_id:    null,
      actor_email: 'system@cron',
      action:      'publish',
      from_status: 'scheduled',
      to_status:   'published',
      notes:       publishNote,
    });

    ids.push(item.id);
    published++;
  }

  return NextResponse.json({ published, failed, ids });
}
