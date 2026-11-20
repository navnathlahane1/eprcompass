import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { verifyOnboardingToken } from '@/lib/onboarding/templates';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function PublicOnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = verifyOnboardingToken(token);
  if (!payload?.checklist_id) return notFound();

  const supabase = getSupabaseAdmin();
  if (!supabase) return notFound();

  const { data: checklist } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, template_name, steps, completion_pct')
    .eq('id', payload.checklist_id)
    .maybeSingle();

  if (!checklist) return notFound();

  const steps = Array.isArray(checklist.steps) ? checklist.steps : [];
  const pending = steps.filter((step: any) => !step.done);

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-gray-900">Onboarding Progress</h1>
        <p className="mt-2 text-sm text-gray-600">Template: {checklist.template_name}</p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, Number(checklist.completion_pct || 0)))}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold text-gray-700">{checklist.completion_pct}% complete</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Pending Items</h2>
        <div className="mt-3 space-y-2">
          {pending.map((step: any) => (
            <article key={step.id} className="rounded-md border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">{step.label}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/portal/documents" className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700">Upload</Link>
                <Link href="/portal/filings" className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700">Submit</Link>
              </div>
            </article>
          ))}
          {pending.length === 0 ? <p className="text-sm text-emerald-700">All onboarding steps completed.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
        <p>Share via WhatsApp:</p>
        <p className="mt-2 rounded bg-gray-50 p-2 text-xs">Complete your EPR onboarding: {`${process.env.NEXT_PUBLIC_SITE_URL || ''}/onboarding/${token}`}</p>
      </section>
    </main>
  );
}
