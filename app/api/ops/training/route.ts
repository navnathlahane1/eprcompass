import { NextResponse } from 'next/server';
import { resolveOpsActor, getOpsAdminClient } from '@/lib/ops/auth';

export async function PATCH() {
  const actor = await resolveOpsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getOpsAdminClient();
  const { error } = await db.from('profiles')
    .update({ ops_training_completed: true })
    .eq('id', actor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
