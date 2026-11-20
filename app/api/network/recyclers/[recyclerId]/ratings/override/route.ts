/**
 * @openapi
 * /api/network/recyclers/{recyclerId}/ratings/override:
 *   patch:
 *     summary: Admin override of a specific rating snapshot
 *     tags: [Recycler Network]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating_id, override_reason]
 *             properties:
 *               rating_id: { type: string }
 *               override_reason: { type: string }
 *               overall_score: { type: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  await params; // consumed for route matching
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!body.rating_id) return NextResponse.json({ error: 'rating_id required' }, { status: 400 });
  if (!body.override_reason?.trim()) {
    return NextResponse.json({ error: 'override_reason is required for admin overrides' }, { status: 400 });
  }

  const overrideScore = body.overall_score !== undefined ? Number(body.overall_score) : null;
  if (overrideScore !== null && (overrideScore < 1 || overrideScore > 5)) {
    return NextResponse.json({ error: 'overall_score must be 1–5' }, { status: 400 });
  }

  const db = adminClient();
  const patch: Record<string, unknown> = {
    is_manual_override: true,
    override_by: actor.userId,
    override_reason: body.override_reason.trim(),
  };
  if (overrideScore !== null) patch.overall_score = overrideScore;

  const { error } = await (db as any)
    .from('recycler_ratings')
    .update(patch)
    .eq('id', body.rating_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
