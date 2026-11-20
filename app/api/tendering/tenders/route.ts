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
    const status   = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const portal   = searchParams.get('portal') || '';
    const search   = searchParams.get('search') || '';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset   = (page - 1) * limit;

    let q = (db as any)
      .from('tendering_tenders')
      .select('*', { count: 'exact' });

    if (status)   q = q.eq('status', status);
    if (category) q = q.eq('category', category);
    if (portal)   q = q.eq('portal', portal);
    if (search)   q = q.or(`title.ilike.%${search}%,authority.ilike.%${search}%,tender_no.ilike.%${search}%`);

    q = q.order('submission_deadline', { ascending: true }).range(offset, offset + limit - 1);

    const { data: rows, count } = await q;

    // Enrich with assigned_to name
    const assignedIds = [...new Set(((rows ?? []) as any[]).map((t: any) => t.assigned_to).filter(Boolean))];
    const assigneeMap: Record<string, string> = {};
    if (assignedIds.length) {
      const { data: profiles } = await (db as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', assignedIds);
      for (const p of (profiles ?? []) as any[]) assigneeMap[p.id] = p.full_name || 'Unknown';
    }

    const now = new Date();
    const tenders = ((rows ?? []) as any[]).map((t: any) => ({
      ...t,
      assigned_name: t.assigned_to ? (assigneeMap[t.assigned_to] || 'Unassigned') : 'Unassigned',
      days_remaining: t.submission_deadline
        ? Math.ceil((new Date(t.submission_deadline).getTime() - now.getTime()) / 86400_000)
        : null,
    }));

    return NextResponse.json({ tenders, total: count ?? 0, page, limit });
  } catch (err: any) {
    console.error('[tendering/tenders] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch tenders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { title, authority, submission_deadline, category, portal: tenderPortal, emd_amount_inr,
            estimated_value_inr, published_date, opening_date, assigned_to, notes, tags, status } = body;

    if (!title)               return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!authority)           return NextResponse.json({ error: 'authority is required' }, { status: 400 });
    if (!submission_deadline) return NextResponse.json({ error: 'submission_deadline is required' }, { status: 400 });
    if (!category)            return NextResponse.json({ error: 'category is required' }, { status: 400 });

    const db = getServiceClient();

    // Auto-generate tender_no: TND-YYYY-NNNN
    const year = new Date().getFullYear();
    const { count } = await (db as any)
      .from('tendering_tenders')
      .select('id', { count: 'exact', head: true })
      .like('tender_no', `TND-${year}-%`);
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    const tender_no = `TND-${year}-${seq}`;

    const { data, error } = await (db as any)
      .from('tendering_tenders')
      .insert({
        tender_no,
        title,
        authority,
        category,
        submission_deadline,
        portal: tenderPortal ?? null,
        emd_amount_inr: emd_amount_inr ?? null,
        estimated_value_inr: estimated_value_inr ?? null,
        published_date: published_date ?? null,
        opening_date: opening_date ?? null,
        assigned_to: assigned_to ?? null,
        notes: notes ?? null,
        tags: tags ?? null,
        status: status ?? 'new',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tender: data }, { status: 201 });
  } catch (err: any) {
    console.error('[tendering/tenders] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create tender' }, { status: 500 });
  }
}
