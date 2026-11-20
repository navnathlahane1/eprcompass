import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, taskId } = await params;
  const body = await req.json();
  const supabase = db();

  const patch: any = { ...body, updated_at: new Date().toISOString() };
  if (body.status === 'done' && !body.completed_at) {
    patch.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('project_tasks').update(patch).eq('id', taskId).eq('project_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('project_activity').insert({
    project_id: id,
    task_id: taskId,
    actor_id: actor.userId,
    action: body.status ? `changed_status_to_${body.status}` : 'updated_task',
    meta: body,
  });

  return NextResponse.json({ success: true });
}
