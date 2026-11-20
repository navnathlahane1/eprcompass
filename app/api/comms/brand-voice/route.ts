import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';

// GET: fetch brand voice for a brand entity (default: ecovijay_growth)
export async function GET(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entity = new URL(req.url).searchParams.get('entity') ?? 'ecovijay_growth';
  const client = getCommsAdminClient();

  const { data, error } = await client
    .from('comms_brand_voice')
    .select('*')
    .eq('brand_entity', entity)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brandVoice: data });
}

// PATCH: update brand voice fields (CMO and admin only)
export async function PATCH(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['admin', 'comms_cmo', 'comms_brand_manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden: CMO or Admin required' }, { status: 403 });
  }

  const body = await req.json();
  const { entity = 'ecovijay_growth', ...updates } = body;

  const allowed = [
    'tone_descriptors', 'content_pillars', 'trust_anchors',
    'epr_terminology', 'guardrail_list', 'hashtag_sets', 'sample_posts',
  ];
  const safe: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in updates) safe[key] = updates[key];
  }

  const client = getCommsAdminClient();
  const { error } = await client
    .from('comms_brand_voice')
    .update(safe)
    .eq('brand_entity', entity);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
