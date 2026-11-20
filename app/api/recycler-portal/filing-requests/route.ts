import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();
    const { data: rows } = await (db as any)
      .from('recycler_filing_requests')
      .select('*, govt_tenders(title, tender_no, submission_deadline, portal)')
      .eq('recycler_id', actor.recyclerId)
      .order('requested_at', { ascending: false });

    const requests = ((rows ?? []) as any[]).map((r: any) => ({
      ...r,
      tender_title:    r.govt_tenders?.title ?? r.tender_title,
      tender_no:       r.govt_tenders?.tender_no ?? r.tender_ref ?? '—',
      tender_deadline: r.govt_tenders?.submission_deadline ?? null,
      tender_portal:   r.govt_tenders?.portal ?? null,
    }));

    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error('[recycler-portal/filing-requests] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();

    // Verify subscription allows filing
    const { data: sub } = await (db as any)
      .from('recycler_tender_subscriptions')
      .select('plan_code, end_date')
      .eq('recycler_id', actor.recyclerId)
      .in('status', ['active', 'trial'])
      .maybeSingle();

    if (!sub || new Date(sub.end_date) < new Date()) {
      return NextResponse.json({ error: 'Active subscription required to use filing service.' }, { status: 402 });
    }

    const body = await req.json();
    const { govt_tender_id, tender_title, tender_ref, recycler_notes } = body;

    if (!tender_title) return NextResponse.json({ error: 'tender_title is required' }, { status: 400 });

    // Prevent duplicate pending requests for same tender
    if (govt_tender_id) {
      const { data: existing } = await (db as any)
        .from('recycler_filing_requests')
        .select('id')
        .eq('recycler_id', actor.recyclerId)
        .eq('govt_tender_id', govt_tender_id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'You already have a pending request for this tender.' }, { status: 409 });
      }
    }

    const { data, error } = await (db as any)
      .from('recycler_filing_requests')
      .insert({
        recycler_id:    actor.recyclerId,
        govt_tender_id: govt_tender_id ?? null,
        tender_title,
        tender_ref:     tender_ref ?? null,
        recycler_notes: recycler_notes ?? null,
        status:         'pending',
        requested_at:   new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      request: data,
      message: 'Filing request submitted. Our team will contact you within 24 hours.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('[recycler-portal/filing-requests] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to submit filing request' }, { status: 500 });
  }
}
