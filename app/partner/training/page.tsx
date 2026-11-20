import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PartnerTrainingClient from './PartnerTrainingClient';
import OnboardingTraining from '@/components/onboarding/OnboardingTraining';
import { PARTNER_TRAINING } from '@/components/onboarding/trainingContent';

export const metadata = { title: 'Training & Certification | Partner Portal' };

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export default async function PartnerTrainingPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const db = svc();

  const { data: partner } = await db
    .from('partners')
    .select('id, partner_type, partner_tier, training_completed')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  // Fetch assignments matching this partner (all / type / tier / specific)
  const { data: assignments } = await db
    .from('partner_training_assignments')
    .select('program_id')
    .or(
      [
        'target_type.eq.all_partners',
        partner.partner_type
          ? `and(target_type.eq.partner_type,partner_type.eq.${partner.partner_type})`
          : null,
        partner.partner_tier
          ? `and(target_type.eq.partner_tier,partner_tier.eq.${partner.partner_tier})`
          : null,
        `and(target_type.eq.specific_partner,partner_id.eq.${partner.id})`,
      ]
        .filter(Boolean)
        .join(',')
    );

  const programIds = [...new Set((assignments || []).map((a: any) => a.program_id))];

  const onboardingSection = (
    <OnboardingTraining config={PARTNER_TRAINING} initialDone={!!partner.training_completed} />
  );

  if (programIds.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Training & Certification</h1>
          <p className="text-sm text-slate-500">Complete onboarding training to activate your account, then work through any assigned academy programmes.</p>
        </div>
        {onboardingSection}
        <PartnerTrainingClient
          programs={[]}
          sessions={[]}
          progressMap={{}}
          partnerId={partner.id}
        />
      </div>
    );
  }

  // Fetch program details + upcoming sessions in parallel
  const [{ data: programs }, { data: sessions }, { data: progressRows }] = await Promise.all([
    db.from('academy_programs')
      .select('id, title, description, delivery_mode, duration_hours, content_url, status, start_date, end_date, waste_category')
      .in('id', programIds),
    db.from('academy_sessions')
      .select('id, program_id, title, scheduled_date, duration_minutes, meeting_link, status')
      .in('program_id', programIds)
      .gte('scheduled_date', new Date().toISOString())
      .in('status', ['scheduled', 'ongoing'])
      .order('scheduled_date', { ascending: true }),
    db.from('partner_training_progress')
      .select('program_id, status, started_at, completed_at')
      .eq('partner_id', partner.id)
      .in('program_id', programIds),
  ]);

  const progressMap = Object.fromEntries(
    (progressRows || []).map((p: any) => [p.program_id, p])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Training & Certification</h1>
        <p className="text-sm text-slate-500">Complete onboarding training to activate your account, then work through your assigned academy programmes.</p>
      </div>
      {onboardingSection}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-800">Assigned Academy Programmes</h2>
        <PartnerTrainingClient
          programs={programs || []}
          sessions={sessions || []}
          progressMap={progressMap}
          partnerId={partner.id}
        />
      </div>
    </div>
  );
}
