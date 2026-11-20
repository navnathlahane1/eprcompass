import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { ADMIN_HELP_MODULES } from '@/lib/instructions/modules';
import { getModuleInstructionDefault } from '@/lib/instructions/defaults';

export default async function AdminModuleHelpPage({
  params
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!ADMIN_HELP_MODULES.includes(module as any)) return notFound();

  const supabase = await createServerComponentClient();
  const key = `admin.${module}`;
  const fallback = getModuleInstructionDefault(key);

  const { data } = await (supabase as any)
    .from('module_instructions')
    .select('*')
    .eq('module_key', key)
    .maybeSingle();

  const view = {
    module_name: data?.module_name || fallback?.module_name || 'Module Instructions',
    module_key: data?.module_key || fallback?.module_key || key,
    how_it_works: data?.how_it_works || fallback?.how_it_works || '-',
    what_to_do: data?.what_to_do || fallback?.what_to_do || '-',
    data_flow: data?.data_flow || fallback?.data_flow || '-',
    dos: data?.dos || fallback?.dos || '-',
    donts: data?.donts || fallback?.donts || '-',
    escalation: data?.escalation || fallback?.escalation || '-'
  };

  if (!data && !fallback) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h1 className="text-xl font-semibold text-slate-100">Module Instructions</h1>
          <p className="mt-2 text-sm text-slate-400">No instructions published yet for this module.</p>
          <Link href="/admin/settings/instructions" className="mt-3 inline-flex rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950">
            Open Instructions Editor
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-2xl font-semibold text-slate-100">{view.module_name}</h1>
        <p className="mt-1 text-xs text-slate-500">Module key: {view.module_key}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">How It Works</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{view.how_it_works}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">What To Do</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{view.what_to_do}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Data Flow</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{view.data_flow}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">Do&apos;s</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-200">{view.dos}</p>
        </article>
        <article className="rounded-xl border border-rose-700/50 bg-rose-950/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-400">Don&apos;ts</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-rose-200">{view.donts}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Escalation</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{view.escalation}</p>
      </section>
    </div>
  );
}
