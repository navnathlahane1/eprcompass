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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; warningId: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, warningId } = await params;
  const supabase = db();

  const { error } = await supabase
    .from('project_warnings')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', warningId)
    .eq('project_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('project_activity').insert({
    project_id: id,
    actor_id: actor.userId,
    action: 'resolved_warning',
    meta: { warning_id: warningId },
  });

  return NextResponse.json({ success: true });
}
