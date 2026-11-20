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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, userId } = await params;
  const { role } = await req.json();
  const supabase = db();

  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, userId } = await params;
  const supabase = db();

  const { data: project } = await supabase.from('projects').select('owner_id').eq('id', id).single();
  if (project?.owner_id === userId) {
    return NextResponse.json({ error: 'Cannot remove project owner' }, { status: 400 });
  }

  await supabase.from('project_members').delete().eq('project_id', id).eq('user_id', userId);

  await supabase.from('project_activity').insert({
    project_id: id,
    actor_id: actor.userId,
    action: 'removed_member',
    meta: { user_id: userId },
  });

  return NextResponse.json({ success: true });
}
