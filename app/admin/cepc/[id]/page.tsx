import CEPCProfileClient from './CEPCProfileClient';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { createChecklist } from '@/lib/onboarding/templates';

const TaskWidget = dynamic(() => import('@/components/tasks/TaskWidget'));

export default async function CEPCProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const [
    { data: consultant },
    { data: leads },
    { data: earnings },
    { data: authData }
  ] = await Promise.all([
    (supabase as any)
      .from('cepc_consultants')
      .select('id, profile_id, full_name, email, phone, state, city, certification_tier, certification_date, certification_expiry, cert_no, territory_states, territory_cities, status, onboarding_stage, agreement_signed, assigned_manager, revenue_share_pct, created_at')
      .eq('id', id)
      .maybeSingle(),
    (supabase as any)
      .from('cepc_leads')
      .select('id, cepc_id, client_company, contact_name, email, phone, state, waste_categories, service_interest, stage, deal_value_inr, submitted_at, reviewed_at, reviewed_by, converted_client_id, notes')
      .eq('cepc_id', id)
      .order('submitted_at', { ascending: false }),
    (supabase as any)
      .from('cepc_earnings')
      .select('id, cepc_id, client_id, service_id, gross_revenue_inr, commission_pct, commission_inr, payment_status, period_month, paid_at, notes')
      .eq('cepc_id', id)
      .order('period_month', { ascending: false }),
    supabase.auth.getUser()
  ]);

  if (!consultant) return notFound();

  const checklistId = await createChecklist('cepc', consultant.id);
  const { data: onboardingChecklist } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, entity_type, entity_id, template_name, steps, completion_pct, created_at, updated_at')
    .eq('id', checklistId)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <CEPCProfileClient
        consultant={consultant}
        initialLeads={leads || []}
        initialEarnings={earnings || []}
        currentUserId={authData?.user?.id || null}
        onboardingChecklist={onboardingChecklist || null}
      />
      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">Loading tasks...</div>}>
        <TaskWidget entityType="cepc" entityId={consultant.id} />
      </Suspense>
    </div>
  );
}
