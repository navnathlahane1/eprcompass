import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import OnboardingTraining from '@/components/onboarding/OnboardingTraining';
import { CEPC_TRAINING } from '@/components/onboarding/trainingContent';

export const metadata = { title: 'Onboarding Training | CEPC Portal' };

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export default async function CepcTrainingPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/cepc/login');

  const db = svc();
  const { data: consultant } = await db
    .from('cepc_consultants')
    .select('id, training_completed')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!consultant) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">CEPC consultant profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-slate-900">Onboarding Training</h1>
        <p className="text-sm text-slate-500">Complete all modules and the quiz to activate your consultant account.</p>
      </div>
      <OnboardingTraining
        config={CEPC_TRAINING}
        initialDone={!!consultant.training_completed}
      />
    </div>
  );
}
