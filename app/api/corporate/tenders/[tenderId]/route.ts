/**
 * GET    /api/corporate/tenders/[tenderId]           — tender detail + responses
 * PUT    /api/corporate/tenders/[tenderId]           — update tender (DRAFT only)
 * PATCH  /api/corporate/tenders/[tenderId]/status    — transition status
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';

async function resolveCorporateOwner(tenderId: string) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();
  const { data: tender } = await (db as any)
    .from('tenders')
    .select('id, posted_by, status')
    .eq('id', tenderId)
    .maybeSingle();

  if (!tender) return null;
  if (tender.posted_by !== user.id) return null;

  return { userId: user.id, tender };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  const { tenderId } = await params;
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [tenderRes, responsesRes] = await Promise.all([
    (db as any).from('tenders').select('*').eq('id', tenderId).eq('posted_by', user.id).maybeSingle(),
    (db as any)
      .from('tender_responses')
      .select('*, recyclers(name, recycler_code, verification_status, epr_categories)')
      .eq('tender_id', tenderId)
      .order('submitted_at', { ascending: false }),
  ]);

  if (!tenderRes.data) return NextResponse.json({ error: 'Tender not found' }, { status: 404 });

  return NextResponse.json({ tender: tenderRes.data, responses: responsesRes.data ?? [] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  const { tenderId } = await params;
  const owner = await resolveCorporateOwner(tenderId);
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (owner.tender.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT tenders can be edited.' }, { status: 422 });
  }

  const body = await req.json().catch(() => ({}));
  const db = adminClient();

  const allowed = [
    'title', 'description', 'required_qty', 'unit', 'states_covered',
    'financial_year', 'submission_deadline', 'start_date', 'end_date',
    'tender_type', 'eligibility_criteria', 'visibility', 'invited_recycler_ids', 'attachments',
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (body[camel] !== undefined) update[key] = body[camel];
    else if (body[key] !== undefined) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await (db as any)
    .from('tenders')
    .update(update)
    .eq('id', tenderId)
    .select('id, status, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, tender: data });
}
