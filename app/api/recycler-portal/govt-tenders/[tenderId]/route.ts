import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenderId: string }> }) {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();

    // Check active subscription
    const { data: sub } = await (db as any)
      .from('recycler_tender_subscriptions')
      .select('id, plan_code, end_date')
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

    const { tenderId } = await params;
    const { data: tender } = await (db as any)
      .from('govt_tenders')
      .select('*')
      .eq('id', tenderId)
      .eq('is_active', true)
      .maybeSingle();

    if (!tender) return NextResponse.json({ error: 'Tender not found' }, { status: 404 });

    // Check if recycler has a filing request for this tender
    const { data: filingReq } = await (db as any)
      .from('recycler_filing_requests')
      .select('id, status, requested_at, manager_notes')
      .eq('recycler_id', actor.recyclerId)
      .eq('govt_tender_id', tenderId)
      .maybeSingle();

    // Record view
    await (db as any)
      .from('govt_tender_views')
      .upsert(
        { tender_id: tenderId, recycler_id: actor.recyclerId },
        { onConflict: 'tender_id,recycler_id' }
      );

    const now = new Date();
    return NextResponse.json({
      tender: {
        ...tender,
        days_remaining: tender.submission_deadline
          ? Math.ceil((new Date(tender.submission_deadline).getTime() - now.getTime()) / 86400_000)
          : null,
      },
      filingRequest: filingReq ?? null,
      canRequestFiling: sub.plan_code === 'premium' || sub.plan_code === 'pro',
    });
  } catch (err: any) {
    console.error('[recycler-portal/govt-tenders/[tenderId]] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch tender' }, { status: 500 });
  }
}
