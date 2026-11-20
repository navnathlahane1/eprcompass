import { NextResponse } from 'next/server';
import { resolveTenderingUser, getServiceClient } from '@/lib/tendering/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getServiceClient();
    const { data: rows } = await (db as any)
      .from('tendering_contracts')
      .select('*, tendering_vendors(name), tendering_tenders(title, tender_no)')
      .order('created_at', { ascending: false });

    const now = new Date();
    const contracts = ((rows ?? []) as any[]).map((c: any) => ({
      ...c,
      vendor_name:  c.tendering_vendors?.name ?? 'Unknown',
      tender_title: c.tendering_tenders?.title ?? 'Unknown',
      tender_no:    c.tendering_tenders?.tender_no ?? '',
      days_remaining: c.end_date
        ? Math.ceil((new Date(c.end_date).getTime() - now.getTime()) / 86400_000)
        : null,
    }));

    return NextResponse.json({ contracts });
  } catch (err: any) {
    console.error('[tendering/contracts] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}
