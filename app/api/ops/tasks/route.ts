import { NextRequest, NextResponse } from 'next/server';
import { resolveOpsActor, getOpsAdminClient } from '@/lib/ops/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status       = searchParams.get('status') ?? 'all';
  const roleContext  = searchParams.get('role_context');
  const page         = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit        = 30;
  const offset       = (page - 1) * limit;

  const db = getOpsAdminClient();
  let query = db.from('ops_tasks').select('*', { count: 'exact' }).eq('assigned_to', actor.id);

  if (status !== 'all') query = query.eq('status', status);
  if (roleContext)       query = query.eq('role_context', roleContext);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, priority, due_date, role_context, contact_name, contact_phone, contact_email, contact_company } = body;
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const insertRow: Record<string, unknown> = {
    assigned_to:  actor.id,
    assigned_by:  actor.id,
    title:        title.trim(),
    description:  description ?? null,
    priority:     priority ?? 'normal',
    due_date:     due_date || null,
    role_context: role_context ?? null,
  };
  // Only set contact_* columns when the caller actually sent one — keeps older
  // ops_tasks rows/callers working even before migration 181 (which adds these
  // columns) has been applied.
  if (contact_name)    insertRow.contact_name    = contact_name.trim() || null;
  if (contact_phone)   insertRow.contact_phone   = contact_phone.trim() || null;
  if (contact_email)   insertRow.contact_email   = contact_email.trim() || null;
  if (contact_company) insertRow.contact_company = contact_company.trim() || null;

  const db = getOpsAdminClient();
  const { data, error } = await db.from('ops_tasks').insert(insertRow).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
