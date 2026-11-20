import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { redirect } from 'next/navigation';
import OnboardingTraining from '@/components/onboarding/OnboardingTraining';
import { RECYCLER_TRAINING } from '@/components/onboarding/trainingContent';

export const metadata = { title: 'Onboarding Training | Recycler Portal' };

export default async function RecyclerTrainingPage() {
  const actor = await resolveRecyclerActor();
  if (!actor) redirect('/recycler-portal/login');

  const db = adminClient();
  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('training_completed')
    .eq('id', actor.recyclerId)
    .maybeSingle();

  return (
    <div className="space-y-2">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Onboarding Training</h1>
        <p className="text-sm text-slate-500">Complete all modules and the quiz to fully activate your recycler account.</p>
      </div>
      <OnboardingTraining
        config={RECYCLER_TRAINING}
        initialDone={!!recycler?.training_completed}
      />
    </div>
  );
}
