import { NextRequest, NextResponse } from 'next/server';
import { resolveTenderingUser, getServiceClient } from '@/lib/tendering/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getServiceClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;

    let q = (db as any)
      .from('recycler_filing_requests')
      .select(
        `*, recyclers(name, recycler_code),
         govt_tenders(title, tender_no, submission_deadline),
         profiles!recycler_filing_requests_assigned_to_fkey(full_name)`,
        { count: 'exact' }
      );

    if (status) q = q.eq('status', status);

    q = q.order('requested_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rows, count } = await q;

    const requests = ((rows ?? []) as any[]).map((r: any) => ({
      ...r,
      recycler_name:    r.recyclers?.name ?? 'Unknown',
      recycler_code:    r.recyclers?.recycler_code ?? '',
      tender_deadline:  r.govt_tenders?.submission_deadline ?? null,
      assigned_name:    r.profiles?.full_name ?? 'Unassigned',
    }));

    return NextResponse.json({ requests, total: count ?? 0, page, limit });
  } catch (err: any) {
    console.error('[tendering/filing-requests] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch filing requests' }, { status: 500 });
  }
}
