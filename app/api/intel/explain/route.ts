import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { metricMeta } from '@/lib/intel/owners';

export async function POST(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const metricId = String(body.metric_id || body.metric || '');
  const meta = metricMeta(metricId);
  const context = body.context && typeof body.context === 'object' ? body.context : {};

  return NextResponse.json({
    ok: true,
    metric_id: meta.id,
    owner: meta.owner,
    drill_href: meta.drillHref,
    source: meta.source,
    play_hint: meta.playHint,
    fy: context.fy || null,
    explanation: `${meta.source}. Owner: ${meta.owner}. Next: ${meta.playHint}.`,
  });
}
