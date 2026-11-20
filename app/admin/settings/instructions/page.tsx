import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { MODULE_INSTRUCTION_DEFAULTS } from '@/lib/instructions/defaults';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

type Row = {
  module_key: string;
  module_name: string;
  audience: string;
  how_it_works: string;
  what_to_do: string;
  data_flow: string;
  dos: string;
  donts: string;
  escalation: string;
};

export default async function AdminInstructionsSettingsPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/admin/settings/instructions');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin' && !isSuperAdmin(user.email)) {
    return <div className="p-6 text-sm text-rose-300">Only admin can edit module instructions.</div>;
  }

  async function saveModuleInstruction(formData: FormData) {
    'use server';

    const serverSupabase = await createServerComponentClient();
    const {
      data: { user: actionUser }
    } = await serverSupabase.auth.getUser();

    if (!actionUser) return;

    const { data: actionProfile } = await (serverSupabase as any)
      .from('profiles')
      .select('role')
      .eq('id', actionUser.id)
      .maybeSingle();

    if (actionProfile?.role !== 'admin' && !isSuperAdmin(actionUser.email)) return;

    const payload = {
      module_key: String(formData.get('module_key') || ''),
      module_name: String(formData.get('module_name') || ''),
      audience: String(formData.get('audience') || 'admin'),
      how_it_works: String(formData.get('how_it_works') || ''),
      what_to_do: String(formData.get('what_to_do') || ''),
      data_flow: String(formData.get('data_flow') || ''),
      dos: String(formData.get('dos') || ''),
      donts: String(formData.get('donts') || ''),
      escalation: String(formData.get('escalation') || ''),
      updated_by: actionUser.id,
      updated_at: new Date().toISOString()
    };

    await (serverSupabase as any)
      .from('module_instructions')
      .upsert(payload, { onConflict: 'module_key' });

    revalidatePath('/admin/settings/instructions');
    revalidatePath('/admin/help');
    revalidatePath('/portal/help');
  }

  const { data: rows } = await (supabase as any)
    .from('module_instructions')
    .select('module_key, module_name, audience, how_it_works, what_to_do, data_flow, dos, donts, escalation')
    .order('module_key', { ascending: true });

  const dbRows: Row[] = rows || [];
  const dbMap = new Map<string, Row>(dbRows.map((row) => [row.module_key, row]));

  const mergedFromDefaults: Row[] = MODULE_INSTRUCTION_DEFAULTS.map((base) => {
    const row = dbMap.get(base.module_key);
    return {
      module_key: base.module_key,
      module_name: row?.module_name || base.module_name,
      audience: row?.audience || base.audience,
      how_it_works: row?.how_it_works || base.how_it_works,
      what_to_do: row?.what_to_do || base.what_to_do,
      data_flow: row?.data_flow || base.data_flow,
      dos: row?.dos || base.dos,
      donts: row?.donts || base.donts,
      escalation: row?.escalation || base.escalation
    };
  });

  const remainingDbRows = dbRows.filter(
    (row) => !MODULE_INSTRUCTION_DEFAULTS.some((base) => base.module_key === row.module_key)
  );

  const list: Row[] = [...mergedFromDefaults, ...remainingDbRows].sort((a, b) =>
    a.module_key.localeCompare(b.module_key)
  );

  const audienceOrder = ['admin', 'portal'];
  const grouped = audienceOrder
    .map((audience) => ({
      audience,
      rows: list.filter((row) => (row.audience || '').toLowerCase() === audience)
    }))
    .filter((group) => group.rows.length > 0);

  const otherAudienceRows = list.filter(
    (row) => !audienceOrder.includes((row.audience || '').toLowerCase())
  );

  if (otherAudienceRows.length > 0) {
    grouped.push({ audience: 'other', rows: otherAudienceRows });
  }

  return (
    <div className="space-y-4 p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-2xl font-semibold text-slate-100">Module Instructions</h1>
        <p className="mt-1 text-sm text-slate-400">
          Edit guidance shown to users inside each module: how it works, workflow, data flow, do&apos;s/don&apos;ts and escalation contact.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {grouped.map((group) => (
            <a
              key={group.audience}
              href={`#audience-${group.audience}`}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-950"
            >
              {group.audience.toUpperCase()} ({group.rows.length})
            </a>
          ))}
        </div>
      </section>

      {grouped.map((group) => (
        <section key={group.audience} id={`audience-${group.audience}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">{group.audience.toUpperCase()} Modules</h2>
            <p className="text-xs text-slate-500">{group.rows.length} module{group.rows.length > 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-3">
            {group.rows.map((row, index) => (
              <details key={row.module_key} className="rounded-lg border border-slate-800 bg-slate-950/40" open={index === 0}>
                <summary className="cursor-pointer list-none px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{row.module_name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{row.module_key}</p>
                    </div>
                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                      Edit
                    </span>
                  </div>
                </summary>

                <div className="border-t border-slate-800 bg-slate-900/60 px-4 py-4">
                  <form action={saveModuleInstruction} className="space-y-3">
                    <input type="hidden" name="module_key" defaultValue={row.module_key} />
                    <input type="hidden" name="module_name" defaultValue={row.module_name} />
                    <input type="hidden" name="audience" defaultValue={row.audience} />

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">How It Works</label>
                      <textarea name="how_it_works" defaultValue={row.how_it_works} rows={3} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">What To Do</label>
                      <textarea name="what_to_do" defaultValue={row.what_to_do} rows={3} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm" />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Data Flow</label>
                      <textarea name="data_flow" defaultValue={row.data_flow} rows={3} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Do&apos;s</label>
                        <textarea name="dos" defaultValue={row.dos} rows={3} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Don&apos;ts</label>
                        <textarea name="donts" defaultValue={row.donts} rows={3} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Escalation / Support Contact</label>
                      <textarea name="escalation" defaultValue={row.escalation} rows={2} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm" />
                    </div>

                    <button type="submit" className="btn-primary">
                      Save Instructions
                    </button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
