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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;
  const supabase = db();

  const { data, error } = await supabase
    .from('project_task_comments')
    .select('*, author:profiles!project_task_comments_author_id_fkey(id, full_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comments: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, taskId } = await params;
  const { body } = await req.json();
  const supabase = db();

  if (!body?.trim()) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });

  const { data: comment, error } = await supabase
    .from('project_task_comments')
    .insert({ task_id: taskId, author_id: actor.userId, content: body })
    .select('*, author:profiles!project_task_comments_author_id_fkey(id, full_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('project_activity').insert({
    project_id: id,
    task_id: taskId,
    actor_id: actor.userId,
    action: 'commented',
    meta: { comment_id: comment.id },
  });

  return NextResponse.json({ comment });
}
