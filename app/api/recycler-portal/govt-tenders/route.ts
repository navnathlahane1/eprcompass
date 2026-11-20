/**
 * GET /api/recycler-portal/govt-tenders
 * Lists active government tenders. Requires active subscription.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();

    // Check active subscription
    const { data: sub } = await (db as any)
      .from('recycler_tender_subscriptions')
      .select('id, plan_code, end_date, status')
      .eq('recycler_id', actor.recyclerId)
      .in('status', ['active', 'trial'])
      .maybeSingle();

    const hasAccess = sub && new Date(sub.end_date) >= new Date();
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'subscription_required', message: 'Subscribe to access government tenders.' },
        { status: 402 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const portal   = searchParams.get('portal') || '';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset   = (page - 1) * limit;

    let q = (db as any)
      .from('govt_tenders')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .gte('submission_deadline', new Date().toISOString());

    if (category) q = q.eq('category', category);
    if (portal)   q = q.eq('portal', portal);
    if (search)   q = q.or(`title.ilike.%${search}%,authority.ilike.%${search}%`);

    q = q.order('submission_deadline', { ascending: true }).range(offset, offset + limit - 1);

    const { data: rows, count } = await q;

    // Track view (upsert to avoid duplicates)
    if ((rows ?? []).length > 0) {
      const viewIds = ((rows ?? []) as any[]).map((t: any) => t.id);
      // Only track first page view per tender
      await Promise.allSettled(
        viewIds.slice(0, 5).map((tid: string) =>
          (db as any)
            .from('govt_tender_views')
            .upsert({ tender_id: tid, recycler_id: actor.recyclerId }, { onConflict: 'tender_id,recycler_id' })
        )
      );
    }

    const now = new Date();
    const tenders = ((rows ?? []) as any[]).map((t: any) => ({
      ...t,
      days_remaining: t.submission_deadline
        ? Math.ceil((new Date(t.submission_deadline).getTime() - now.getTime()) / 86400_000)
        : null,
    }));

    return NextResponse.json({
      tenders,
      total: count ?? 0,
      page,
      limit,
      subscription: { plan_code: sub.plan_code, end_date: sub.end_date },
    });
  } catch (err: any) {
    console.error('[recycler-portal/govt-tenders] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch tenders' }, { status: 500 });
  }
}
