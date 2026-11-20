import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { PORTAL_HELP_MODULES } from '@/lib/instructions/modules';
import { getModuleInstructionDefault } from '@/lib/instructions/defaults';

export default async function PortalModuleHelpPage({
  params
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!PORTAL_HELP_MODULES.includes(module as any)) return notFound();

  const supabase = await createServerComponentClient();
  const key = `portal.${module}`;
  const fallback = getModuleInstructionDefault(key);

  const { data } = await (supabase as any)
    .from('module_instructions')
    .select('*')
    .eq('module_key', key)
    .maybeSingle();

  const view = {
    module_name: data?.module_name || fallback?.module_name || 'Module Instructions',
    how_it_works: data?.how_it_works || fallback?.how_it_works || '-',
    what_to_do: data?.what_to_do || fallback?.what_to_do || '-',
    data_flow: data?.data_flow || fallback?.data_flow || '-',
    dos: data?.dos || fallback?.dos || '-',
    donts: data?.donts || fallback?.donts || '-',
    escalation: data?.escalation || fallback?.escalation || '-'
  };

  if (!data && !fallback) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        Instructions are not available for this module yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">{view.module_name}</h1>
        <p className="mt-1 text-sm text-slate-600">A quick guide for using this module.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">How It Works</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{view.how_it_works}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">What To Do</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{view.what_to_do}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">How Data Moves</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{view.data_flow}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Do&apos;s</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-800">{view.dos}</p>
        </article>
        <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">Don&apos;ts</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-rose-800">{view.donts}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Need Help?</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{view.escalation}</p>
      </section>
    </div>
  );
}
