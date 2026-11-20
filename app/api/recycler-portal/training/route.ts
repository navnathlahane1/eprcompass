/**
 * PATCH /api/recycler-portal/training
 * Marks the recycler's onboarding training as complete.
 * Called automatically when the quiz is passed in OnboardingTraining.
 */
import { NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function PATCH() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { error } = await (db as any)
    .from('recyclers')
    .update({ training_completed: true })
    .eq('id', actor.recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
