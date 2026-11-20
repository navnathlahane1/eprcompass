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
    const status   = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    let q = (db as any).from('tendering_vendors').select('*');
    if (status)   q = q.eq('empanelment_status', status);
    if (search)   q = q.or(`name.ilike.%${search}%,pan.ilike.%${search}%,gstin.ilike.%${search}%`);
    if (category) q = q.contains('category', [category]);

    q = q.order('name', { ascending: true });

    const { data: vendors } = await q;
    return NextResponse.json({ vendors: vendors ?? [] });
  } catch (err: any) {
    console.error('[tendering/vendors] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, pan, gstin, category, empanelled_date, expiry_date,
            past_performance_score, contact_name, contact_email, contact_phone, notes } = body;

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const db = getServiceClient();
    const { data, error } = await (db as any)
      .from('tendering_vendors')
      .insert({
        name,
        pan: pan ?? null,
        gstin: gstin ?? null,
        category: category ?? null,
        empanelled_date: empanelled_date ?? null,
        expiry_date: expiry_date ?? null,
        past_performance_score: past_performance_score ?? null,
        contact_name: contact_name ?? null,
        contact_email: contact_email ?? null,
        contact_phone: contact_phone ?? null,
        notes: notes ?? null,
        empanelment_status: 'active',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vendor: data }, { status: 201 });
  } catch (err: any) {
    console.error('[tendering/vendors] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
