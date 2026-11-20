import { notFound, redirect } from 'next/navigation';

export default async function OnboardingStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!['1', '2', '3', '4', '5'].includes(step)) notFound();
  redirect('/portal/onboarding');
}
