/**
 * GET  /api/finance/gst  — list all GST filings ordered by due_date desc
 * PATCH /api/finance/gst — update a filing (status, filed_date, arn, remarks)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from('finance_gst_filings')
    .select('*')
    .order('due_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { id: string; status: string; filed_date?: string; arn?: string; remarks?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, status, filed_date, arn, remarks } = body;
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  if (!['pending', 'filed', 'overdue'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const db = getServiceClient();
  const update: Record<string, unknown> = { status };
  if (filed_date !== undefined) update.filed_date = filed_date || null;
  if (arn       !== undefined) update.arn         = arn || null;
  if (remarks   !== undefined) update.remarks     = remarks || null;

  const { data, error } = await (db as any)
    .from('finance_gst_filings')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
