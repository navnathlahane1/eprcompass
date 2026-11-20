import Link from 'next/link';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { createChecklist } from '@/lib/onboarding/templates';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';

const TaskWidget = dynamic<{ entityType: 'partner'; entityId: string }>(
  () => import('@/components/tasks/TaskWidget') as any
);

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: partner } = await (supabase as any)
    .from('partners')
    .select('id, profile_id, company_name, partner_type, state, city, contact_person, email, phone, outreach_tier, stage, commission_type, commission_value, agreement_signed, kit_sent, training_completed, portal_access, assigned_rm')
    .eq('id', id)
    .maybeSingle();

  if (!partner) return notFound();

  const { data: manager } = partner.assigned_rm
    ? await (supabase as any).from('profiles').select('id, full_name').eq('id', partner.assigned_rm).maybeSingle()
    : { data: null };

  const checklistId = await createChecklist('partner', partner.id);
  const { data: checklist } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, entity_type, entity_id, template_name, steps, completion_pct, created_at, updated_at')
    .eq('id', checklistId)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">{partner.company_name}</h1>
            <p className="mt-1 text-sm text-slate-400">{partner.partner_type} · {partner.stage}</p>
          </div>
          <Link href="/admin/crm/partners" className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950">Back to Partners</Link>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Partner Details</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-200 sm:grid-cols-2">
          <p>Contact: {partner.contact_person || '-'}</p>
          <p>Email: {partner.email || '-'}</p>
          <p>Phone: {partner.phone || '-'}</p>
          <p>Location: {[partner.city, partner.state].filter(Boolean).join(', ') || '-'}</p>
          <p>Outreach Tier: {partner.outreach_tier}</p>
          <p>Relationship Manager: {manager?.full_name || '-'}</p>
          <p>Commission: {partner.commission_type || '-'} {partner.commission_value ? `(INR ${Number(partner.commission_value).toLocaleString('en-IN')})` : ''}</p>
          <p>Agreement Signed: {partner.agreement_signed ? 'Yes' : 'No'}</p>
        </div>
      </section>

      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">Loading tasks...</div>}>
        <TaskWidget entityType="partner" entityId={partner.id} />
      </Suspense>

      {checklist ? <OnboardingChecklist checklistId={checklist.id} initialChecklist={checklist} /> : null}
    </div>
  );
}
