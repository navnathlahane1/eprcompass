import Link from 'next/link';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { computeRiskScore } from '@/lib/recycler';
import { createChecklist } from '@/lib/onboarding/templates';
import RecyclerProfileTabsClient from './RecyclerProfileTabsClient';

const TaskWidget = dynamic(() => import('@/components/tasks/TaskWidget'));

function riskBadgeClass(flag: string) {
  if (flag === 'High') return 'bg-rose-900/30 text-rose-300';
  if (flag === 'Medium') return 'bg-orange-900/30 text-orange-800';
  if (flag === 'Low') return 'bg-amber-900/30 text-amber-200';
  return 'bg-slate-900 text-slate-200';
}

function statusBadgeClass(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Onboarding') return 'bg-blue-900/30 text-blue-300';
  if (status === 'Suspended') return 'bg-amber-100 text-amber-800';
  if (status === 'Blacklisted') return 'bg-rose-900/30 text-rose-300';
  return 'bg-slate-100 text-slate-700';
}

export default async function RecyclerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  await computeRiskScore(id);

  const [
    { data: recycler },
    { data: documents },
    { data: credits },
    { data: capacityLogs },
    { data: activities },
    { data: profiles },
    { data: authData }
  ] = await Promise.all([
    (supabase as any)
      .from('recyclers')
      .select('id, company_name, status, risk_flag, risk_reason, state, capacity_mt_pa, cpcb_cert_expiry')
      .eq('id', id)
      .maybeSingle(),
    (supabase as any)
      .from('recycler_documents')
      .select('id, recycler_id, doc_type, file_path, expiry_date, status, uploaded_at')
      .eq('recycler_id', id)
      .order('uploaded_at', { ascending: false }),
    (supabase as any)
      .from('epr_credits')
      .select('id, waste_category, credit_type, quantity_mt, rate_per_mt_inr, total_value_inr, transaction_ref, status, created_at')
      .eq('recycler_id', id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('recycler_capacity_log')
      .select('id, month, capacity_mt, utilized_mt, utilization_pct')
      .eq('recycler_id', id)
      .order('month', { ascending: true })
      .limit(6),
    (supabase as any)
      .from('activities')
      .select('id, entity_type, entity_id, type, note, outcome, done_by, created_at')
      .eq('entity_type', 'recycler')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
    (supabase as any).from('profiles').select('id, full_name'),
    supabase.auth.getUser()
  ]);

  if (!recycler) return notFound();

  const checklistId = await createChecklist('recycler', recycler.id);
  const { data: onboardingChecklist } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, entity_type, entity_id, template_name, steps, completion_pct, created_at, updated_at')
    .eq('id', checklistId)
    .maybeSingle();

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name || p.id]));
  const initialActivities = (activities || []).map((row: any) => ({
    ...row,
    done_by_name: row.done_by ? profileMap.get(row.done_by) : null
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{recycler.company_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(recycler.status)}`}>
              {recycler.status}
            </span>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskBadgeClass(recycler.risk_flag)}`}>
              Risk: {recycler.risk_flag}
            </span>
            <span className="text-xs text-slate-400">State: {recycler.state || '-'}</span>
          </div>
          {recycler.risk_reason ? <p className="mt-2 text-xs text-slate-400">{recycler.risk_reason}</p> : null}
        </div>

        <Link href="/admin/recyclers" className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950">
          Back to Directory
        </Link>
      </div>

      <RecyclerProfileTabsClient
        recycler={recycler}
        initialDocuments={documents || []}
        credits={credits || []}
        capacityLogs={capacityLogs || []}
        initialActivities={initialActivities}
        currentUserId={authData?.user?.id || null}
        onboardingChecklist={onboardingChecklist || null}
      />

      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">Loading tasks...</div>}>
        <TaskWidget entityType="recycler" entityId={recycler.id} />
      </Suspense>
    </div>
  );
}
