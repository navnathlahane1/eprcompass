import OnboardingTraining from '@/components/onboarding/OnboardingTraining';
import { OPS_TRAINING } from '@/components/onboarding/trainingContent';

export const metadata = { title: 'Training — Operations Portal' };

export default function OpsTrainingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-100">Onboarding Training</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete all modules and pass the quiz to activate your workspace</p>
      </div>
      <OnboardingTraining config={OPS_TRAINING} />
    </div>
  );
}
