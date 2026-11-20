/**
 * PATCH /api/corporate/tenders/[tenderId]/status
 *
 * Valid transitions:
 *   DRAFT → PUBLISHED (requires submissionDeadline)
 *   PUBLISHED → UNDER_REVIEW
 *   UNDER_REVIEW → AWARDED (requires awardedTo recycler id)
 *   PUBLISHED | UNDER_REVIEW → CANCELLED
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['AWARDED', 'CANCELLED'],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  const { tenderId } = await params;

  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data: tender } = await (db as any)
    .from('tenders')
    .select('id, posted_by, status, submission_deadline')
    .eq('id', tenderId)
    .maybeSingle();

  if (!tender || tender.posted_by !== user.id) {
    return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const newStatus: string = body.status;

  const allowed = VALID_TRANSITIONS[tender.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${tender.status} to ${newStatus}` },
      { status: 422 }
    );
  }

  if (newStatus === 'PUBLISHED' && !tender.submission_deadline && !body.submissionDeadline) {
    return NextResponse.json(
      { error: 'submissionDeadline is required before publishing.' },
      { status: 422 }
    );
  }

  if (newStatus === 'AWARDED' && !body.awardedTo) {
    return NextResponse.json({ error: 'awardedTo (recycler id) is required.' }, { status: 422 });
  }

  const update: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'PUBLISHED') update.published_at = new Date().toISOString();
  if (body.submissionDeadline) update.submission_deadline = body.submissionDeadline;
  if (newStatus === 'AWARDED') update.awarded_to = body.awardedTo;

  const { data, error } = await (db as any)
    .from('tenders')
    .update(update)
    .eq('id', tenderId)
    .select('id, status, published_at, awarded_to')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, tender: data });
}
