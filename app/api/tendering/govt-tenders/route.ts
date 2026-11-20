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
    const search   = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const portal   = searchParams.get('portal') || '';
    const active   = searchParams.get('active');
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset   = (page - 1) * limit;

    let q = (db as any)
      .from('govt_tenders')
      .select('*, profiles!govt_tenders_uploaded_by_fkey(full_name)', { count: 'exact' });

    if (active !== null) q = q.eq('is_active', active === 'true');
    if (category)        q = q.eq('category', category);
    if (portal)          q = q.eq('portal', portal);
    if (search)          q = q.or(`title.ilike.%${search}%,authority.ilike.%${search}%,tender_no.ilike.%${search}%`);

    q = q.order('submission_deadline', { ascending: true }).range(offset, offset + limit - 1);

    const { data: rows, count } = await q;

    const now = new Date();
    const tenders = ((rows ?? []) as any[]).map((t: any) => ({
      ...t,
      uploaded_by_name: t.profiles?.full_name ?? 'Unknown',
      days_remaining: t.submission_deadline
        ? Math.ceil((new Date(t.submission_deadline).getTime() - now.getTime()) / 86400_000)
        : null,
    }));

    return NextResponse.json({ tenders, total: count ?? 0, page, limit });
  } catch (err: any) {
    console.error('[tendering/govt-tenders] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch govt tenders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { title, authority, submission_deadline, category, portal: tenderPortal,
            emd_amount_inr, estimated_value_inr, description, eligibility_notes,
            opening_date, source_url, tags } = body;

    if (!title)               return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!authority)           return NextResponse.json({ error: 'authority is required' }, { status: 400 });
    if (!submission_deadline) return NextResponse.json({ error: 'submission_deadline is required' }, { status: 400 });
    if (!category)            return NextResponse.json({ error: 'category is required' }, { status: 400 });

    const db = getServiceClient();

    // Auto-generate tender_no: GT-YYYY-NNNN
    const year = new Date().getFullYear();
    const { count } = await (db as any)
      .from('govt_tenders')
      .select('id', { count: 'exact', head: true })
      .like('tender_no', `GT-${year}-%`);
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    const tender_no = `GT-${year}-${seq}`;

    const { data, error } = await (db as any)
      .from('govt_tenders')
      .insert({
        tender_no,
        title,
        authority,
        category,
        submission_deadline,
        portal: tenderPortal ?? null,
        emd_amount_inr: emd_amount_inr ?? null,
        estimated_value_inr: estimated_value_inr ?? null,
        description: description ?? null,
        eligibility_notes: eligibility_notes ?? null,
        opening_date: opening_date ?? null,
        source_url: source_url ?? null,
        tags: tags ?? null,
        uploaded_by: actor.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tender: data }, { status: 201 });
  } catch (err: any) {
    console.error('[tendering/govt-tenders] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create govt tender' }, { status: 500 });
  }
}
