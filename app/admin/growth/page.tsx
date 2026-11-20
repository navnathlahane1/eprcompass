import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function AssistedGrowthPage() {
  const db: SupabaseClient = await createServerComponentClient();
  const { data, error } = await db.rpc('service_journey_summary');
  return <main className="space-y-6 p-6 text-slate-900"><h1 className="text-2xl font-semibold">Service journey</h1>
    {error ? <p role="alert" className="text-sm text-amber-800">Metrics are unavailable. Active reviewer access and the assisted-growth migration are required.</p> : <>
      <p className="text-sm text-slate-600">Last 90 days. Event counts since instrumentation was deployed; not a cohort conversion rate.</p>
      <dl className="grid gap-5 border-y border-slate-200 py-6 sm:grid-cols-3">{[['registration_submitted','Registrations submitted'],['registration_reviewed','Staff reviews completed'],['invitation_accepted','Team invitations accepted']].map(([key,label]) => <div key={key}><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-2 text-2xl font-semibold">{Number(data?.[key] ?? 0).toLocaleString()}</dd></div>)}</dl>
      <p className="text-sm text-slate-600">{data?.first_recorded_at ? `First event in this window: ${new Date(data.first_recorded_at).toISOString().slice(0,10)}` : 'No recorded events yet.'}</p>
    </>}
    <Link href="/admin/registrations" className="inline-block min-h-11 py-2 text-sm font-semibold text-emerald-700">Review registrations</Link>
  </main>;
}
