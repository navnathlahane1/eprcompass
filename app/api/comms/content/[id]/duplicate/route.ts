import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

// POST /api/comms/content/[id]/duplicate
// Body (optional): { platform?: string }  — override platform for repurposing
// Clones the content item as a new draft. The platform_post_id, connection_id,
// published_at, approved_by/at, and status are reset so the clone starts fresh.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canCreate = await checkCommsPermission(actor.role, 'create');
  if (!canCreate) return NextResponse.json({ error: 'Forbidden: create permission required' }, { status: 403 });

  const { id }        = await params;
  const body          = await req.json().catch(() => ({}));
  const overridePlatform = body?.platform ?? null;

  const client = getCommsAdminClient();

  const { data: source } = await client
    .from('comms_content_items')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!source) return NextResponse.json({ error: 'Content item not found' }, { status: 404 });

  const { data: clone, error } = await client
    .from('comms_content_items')
    .insert({
      strategy_id:      source.strategy_id,
      platform:         overridePlatform ?? source.platform,
      content_type:     source.content_type,
      audience_segment: source.audience_segment,
      region:           source.region,
      topic:            source.topic ? `[Copy] ${source.topic}` : null,
      hook:             source.hook,
      body:             source.body,
      cta:              source.cta,
      hashtags:         source.hashtags ?? [],
      image_brief:      source.image_brief,
      variants:         source.variants ?? [],
      brand_voice_id:   source.brand_voice_id,
      generated_by:     source.generated_by,
      created_by:       actor.id,
      // reset workflow fields
      status:           'draft',
      scheduled_at:     null,
      published_at:     null,
      approved_by:      null,
      approved_at:      null,
      platform_post_id: null,
      connection_id:    null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_content_audit').insert({
    content_id:  clone.id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'create',
    from_status: null,
    to_status:   'draft',
    notes:       `Duplicated from ${id}${overridePlatform ? ` (repurposed for ${overridePlatform})` : ''}`,
  });

  return NextResponse.json({ success: true, contentId: clone.id }, { status: 201 });
}
