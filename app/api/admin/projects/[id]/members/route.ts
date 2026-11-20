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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { user_id, role } = await req.json();

  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const supabase = db();

  const { error } = await supabase.from('project_members').insert({
    project_id: id,
    user_id,
    role: role || 'member',
  });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('project_activity').insert({
    project_id: id,
    actor_id: actor.userId,
    action: 'added_member',
    meta: { user_id, role },
  });

  return NextResponse.json({ success: true });
}
