/**
 * GET  /api/corporate/requests         — list my sent requests
 * POST /api/corporate/requests         — send a new request to recycler(s)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';

async function resolveCorporate() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();
  const { data: profile } = await (db as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!['client', 'admin', 'manager'].includes(profile?.role ?? '')) return null;
  return { userId: user.id };
}

export async function GET(req: NextRequest) {
  const actor = await resolveCorporate();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status');
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(50, Number(sp.get('limit') ?? 20));

  let q = (db as any)
    .from('corporate_requests')
    .select(
      'id, request_number, epr_type, required_qty, unit, status, urgency, expires_at, created_at',
      { count: 'exact' }
    )
    .eq('corporate_id', actor.userId)
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveCorporate();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.eprType) return NextResponse.json({ error: 'eprType is required' }, { status: 400 });

  const db = adminClient();

  const { data, error } = await (db as any)
    .from('corporate_requests')
    .insert({
      corporate_id: actor.userId,
      target_type: body.targetType ?? 'LINKED_RECYCLER',
      target_recycler_ids: body.targetRecyclerIds ?? [],
      epr_type: body.eprType,
      category_code: body.categoryCode,
      sub_category: body.subCategory,
      required_qty: body.requiredQty,
      unit: body.unit ?? 'MT',
      states_covered: body.statesCovered ?? [],
      financial_year: body.financialYear,
      preferred_start_date: body.preferredStartDate,
      preferred_end_date: body.preferredEndDate,
      budget_range: body.budgetRange,
      budget_hidden: body.budgetHidden ?? false,
      message: body.message,
      attachments: body.attachments ?? [],
      urgency: body.urgency ?? 'MEDIUM',
      expires_at: body.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_rounds: body.maxRounds ?? 5,
    })
    .select('id, request_number, status, created_at, expires_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fan-out notifications to targeted recyclers
  try {
    const recyclerIds: string[] = body.targetRecyclerIds ?? [];
    if (recyclerIds.length > 0) {
      const { data: recyclers } = await (db as any)
        .from('recyclers')
        .select('user_id')
        .in('id', recyclerIds)
        .not('user_id', 'is', null);

      const notifications = (recyclers ?? [])
        .filter((r: any) => r.user_id)
        .map((r: any) => ({
          recipient_id: r.user_id,
          type: 'REQUEST_RECEIVED',
          payload: { requestId: data.id, requestNumber: data.request_number, eprType: body.eprType },
        }));

      if (notifications.length > 0) {
        await (db as any).from('epr_notification_queue').insert(notifications);
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, request: data }, { status: 201 });
}
