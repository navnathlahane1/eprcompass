import { NextRequest, NextResponse } from 'next/server';
import { resolveOpsActor, getOpsAdminClient } from '@/lib/ops/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json();
  const allowed = ['status', 'priority', 'title', 'description', 'due_date', 'contact_name', 'contact_phone', 'contact_email', 'contact_company'] as const;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) { if (key in body) update[key] = body[key]; }

  const db = getOpsAdminClient();
  const { data, error } = await db.from('ops_tasks')
    .update(update)
    .eq('id', id)
    .eq('assigned_to', actor.id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
