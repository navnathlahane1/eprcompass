import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import {
  buildBrandVoiceSystemPrompt,
  buildStrategyUserPrompt,
  FALLBACK_BRAND_VOICE,
  type BrandVoiceData,
  type StrategyInputs,
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

// GET: list saved strategies
export async function GET(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getCommsAdminClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? '';
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit  = 20;

  let query = client
    .from('comms_strategies')
    .select('id, title, objective, audience_segment, platforms, region, time_horizon, campaign_theme, status, created_at, profiles:created_by(full_name)', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq('status', status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ strategies: data ?? [], total: count ?? 0 });
}

// POST?action=generate → streams Claude strategy response
// POST?action=save     → persists a strategy to DB
export async function POST(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canCreate = await checkCommsPermission(actor.role, 'create');
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const action = new URL(req.url).searchParams.get('action') ?? 'generate';
  const body   = await req.json();

  // ── Save action ───────────────────────────────────────────
  if (action === 'save') {
    const { title, objective, audience_segment, platforms, region, time_horizon, campaign_theme, generated_strategy } = body;
    if (!objective || !audience_segment) {
      return NextResponse.json({ error: 'objective and audience_segment are required' }, { status: 400 });
    }
    const client = getCommsAdminClient();
    const { data, error } = await client
      .from('comms_strategies')
      .insert({
        title:              title || `Strategy — ${new Date().toLocaleDateString()}`,
        objective, audience_segment, platforms, region, time_horizon, campaign_theme,
        generated_strategy: generated_strategy ?? null,
        created_by:         actor.id,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, strategyId: data.id }, { status: 201 });
  }

  // ── Generate action (streaming) ───────────────────────────
  const { objective, audience_segment, platforms, region, time_horizon, campaign_theme } = body as StrategyInputs;
  if (!objective || !audience_segment || !platforms?.length) {
    return NextResponse.json({ error: 'objective, audience_segment, and platforms are required' }, { status: 400 });
  }

  const client     = getCommsAdminClient();
  const brandVoice = await getActiveBrandVoice(client);
  const systemPmt  = buildBrandVoiceSystemPrompt(brandVoice);
  const userPmt    = buildStrategyUserPrompt({ objective, audience_segment, platforms, region, time_horizon, campaign_theme });

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
      'Content-Type':     'text/plain; charset=utf-8',
      'Cache-Control':    'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
