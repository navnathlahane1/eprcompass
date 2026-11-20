import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import {
  buildBrandVoiceSystemPrompt,
  buildContentUserPrompt,
  buildPerformanceFeedbackSection,
  FALLBACK_BRAND_VOICE,
  type BrandVoiceData,
  type ContentInputs,
  type PerformerSnapshot,
} from '@/lib/comms/prompts';

async function getActiveBrandVoice(client: ReturnType<typeof getCommsAdminClient>): Promise<BrandVoiceData> {
  const { data } = await client
    .from('comms_brand_voice')
    .select('tone_descriptors,content_pillars,trust_anchors,epr_terminology,guardrail_list,hashtag_sets')
    .eq('brand_entity', 'ecovijay_growth')
    .eq('is_active', true)
    .maybeSingle();
  return (data as BrandVoiceData | null) ?? FALLBACK_BRAND_VOICE;
}

// GET: list content items with filters
export async function GET(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status')   ?? '';
  const platform = searchParams.get('platform') ?? '';
  const search   = searchParams.get('search')   ?? '';
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit    = 30;

  const client = getCommsAdminClient();
  let query = client
    .from('comms_content_items')
    .select(
      'id, platform, content_type, audience_segment, region, topic, hook, status, scheduled_at, published_at, created_at, generated_by, profiles:created_by(full_name)',
      { count: 'exact' }
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status)   query = query.eq('status', status);
  if (platform) query = query.eq('platform', platform);
  if (search)   query = query.ilike('topic', `%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}

// POST?action=generate → streams Claude content response
// POST?action=save     → persists content item to DB as draft
export async function POST(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canCreate = await checkCommsPermission(actor.role, 'create');
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const action = new URL(req.url).searchParams.get('action') ?? 'generate';
  const body   = await req.json();

  // ── Save action ───────────────────────────────────────────
  if (action === 'save') {
    const { platform, content_type, audience_segment, region, topic, hook, body: postBody, cta, hashtags, image_brief, variants, strategy_id } = body;
    if (!platform || !hook) {
      return NextResponse.json({ error: 'platform and hook are required' }, { status: 400 });
    }
    const client = getCommsAdminClient();
    const { data: bv } = await client.from('comms_brand_voice').select('id').eq('brand_entity', 'ecovijay_growth').maybeSingle();

    const { data, error } = await client
      .from('comms_content_items')
      .insert({
        platform, content_type: content_type ?? 'post',
        audience_segment: audience_segment ?? null,
        region: region ?? null,
        topic: topic ?? null,
        hook, body: postBody, cta,
        hashtags: hashtags ?? [],
        image_brief: image_brief ?? null,
        variants: variants ?? [],
        strategy_id: strategy_id ?? null,
        brand_voice_id: bv?.id ?? null,
        generated_by: 'ai',
        created_by: actor.id,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await client.from('comms_content_audit').insert({
      content_id:  data.id,
      actor_id:    actor.id,
      actor_email: actor.email,
      action:      'create',
      from_status: null,
      to_status:   'draft',
    });

    return NextResponse.json({ success: true, contentId: data.id }, { status: 201 });
  }

  // ── Generate action (streaming) ───────────────────────────
  const { platform, content_type, audience_segment, topic, notes, strategy_context } = body as ContentInputs;
  if (!platform || !topic) {
    return NextResponse.json({ error: 'platform and topic are required' }, { status: 400 });
  }

  const client     = getCommsAdminClient();

  // Fetch top 3 and bottom 3 published posts for this platform by engagement rate
  const { data: topRows } = await client
    .from('comms_post_metrics')
    .select('engagement_rate, impressions, likes, comms_content_items!content_item_id(hook, topic)')
    .eq('platform', platform)
    .gt('engagement_rate', 0)
    .gt('impressions', 0)
    .order('engagement_rate', { ascending: false })
    .limit(3);

  const { data: bottomRows } = await client
    .from('comms_post_metrics')
    .select('engagement_rate, impressions, likes, comms_content_items!content_item_id(hook, topic)')
    .eq('platform', platform)
    .gt('impressions', 100)  // only penalise posts with meaningful reach
    .order('engagement_rate', { ascending: true })
    .limit(3);

  function toSnapshot(row: any): PerformerSnapshot | null {
    const ci = row?.comms_content_items;
    if (!ci?.hook) return null;
    return {
      hook:            ci.hook,
      topic:           ci.topic ?? null,
      engagement_rate: parseFloat(row.engagement_rate ?? 0),
      impressions:     row.impressions ?? 0,
      likes:           row.likes ?? 0,
    };
  }

  const topPosts    = (topRows    ?? []).map(toSnapshot).filter(Boolean) as PerformerSnapshot[];
  const bottomPosts = (bottomRows ?? []).map(toSnapshot).filter(Boolean) as PerformerSnapshot[];
  const perfCtx     = buildPerformanceFeedbackSection(topPosts, bottomPosts);

  const brandVoice = await getActiveBrandVoice(client);
  const hashSet    = (brandVoice.hashtag_sets[platform] ?? []) as string[];
  const systemPmt  = buildBrandVoiceSystemPrompt(brandVoice);
  const userPmt    = buildContentUserPrompt({
    platform, content_type: content_type ?? 'post', audience_segment, topic,
    notes, strategy_context, hashtag_set: hashSet,
    performance_context: perfCtx || undefined,
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msgStream = anthropic.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    system:     systemPmt,
    messages:   [{ role: 'user', content: userPmt }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of msgStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
    cancel() { msgStream.abort(); },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':      'text/plain; charset=utf-8',
      'Cache-Control':     'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
