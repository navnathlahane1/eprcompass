import { NextRequest, NextResponse } from 'next/server';
import { resolveTenderingUser, getServiceClient } from '@/lib/tendering/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getServiceClient();

    let q = (db as any)
      .from('tendering_bids')
      .select('*, tendering_tenders(title, submission_deadline, tender_no)');

    if (!actor.isTenderingManager) {
      q = q.eq('prepared_by', actor.id);
    }

    q = q.order('created_at', { ascending: false });

    const { data: rows } = await q;
    const bids = ((rows ?? []) as any[]).map((b: any) => ({
      ...b,
      tender_title:    b.tendering_tenders?.title ?? 'Unknown',
      tender_no:       b.tendering_tenders?.tender_no ?? '',
      tender_deadline: b.tendering_tenders?.submission_deadline ?? null,
    }));

    return NextResponse.json({ bids });
  } catch (err: any) {
    console.error('[tendering/bids] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { tender_id, financial_amount_inr, technical_score, prepared_by, evaluation_notes } = body;

    if (!tender_id) return NextResponse.json({ error: 'tender_id is required' }, { status: 400 });

    const db = getServiceClient();

    // Auto-generate bid_no: BID-YYYY-NNNN
    const year = new Date().getFullYear();
    const { count } = await (db as any)
      .from('tendering_bids')
      .select('id', { count: 'exact', head: true })
      .like('bid_no', `BID-${year}-%`);
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    const bid_no = `BID-${year}-${seq}`;

    const { data, error } = await (db as any)
      .from('tendering_bids')
      .insert({
        tender_id,
        bid_no,
        financial_amount_inr: financial_amount_inr ?? null,
        technical_score: technical_score ?? null,
        prepared_by: prepared_by ?? actor.id,
        evaluation_notes: evaluation_notes ?? null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bid: data }, { status: 201 });
  } catch (err: any) {
    console.error('[tendering/bids] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 });
  }
}
