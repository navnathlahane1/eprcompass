import { revalidatePath } from 'next/cache';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { getTopOutreachTargets } from '@/lib/partners/outreach-sequencer';

function toCsv(rows: any[]) {
  const headers = ['Rank', 'Company', 'City', 'Type', 'Contact', 'Email', 'Phone', 'Score'];
  const body = rows.map((row, index) => {
    const values = [
      index + 1,
      row.company_name,
      row.city || '',
      row.partner_type,
      row.contact_person || '',
      row.email || '',
      row.phone_primary || '',
      row.outreach_score
    ];

    return values
      .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
      .join(',');
  });

  return [headers.join(','), ...body].join('\n');
}

export default async function PartnerOutreachPage() {
  const targets = await getTopOutreachTargets(50);
  const csvData = toCsv(targets);

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);

  const contactedToday = targets.filter((row) => String(row.last_outreach_date || '').slice(0, 10) === isoToday).length;
  const weeklyResponded = targets.filter((row) => ['Interested', 'Callback'].includes(String(row.outreach_response || ''))).length;
  const responseRate = targets.length ? Math.round((weeklyResponded / targets.length) * 100) : 0;

  async function markOutreach(formData: FormData) {
    'use server';

    const supabase = await createServerComponentClient();
    const partnerId = String(formData.get('partner_id') || '');
    const mode = String(formData.get('mode') || '');

    if (!partnerId) return;

    const payload: Record<string, any> = {
      last_outreach_date: new Date().toISOString().slice(0, 10),
      outreach_attempt_count: Number(formData.get('attempt_count') || 0) + 1
    };

    if (mode === 'called') payload.outreach_response = 'Callback';
    if (mode === 'emailed') payload.outreach_response = 'No Response';

    await (supabase as any).from('partners').update(payload).eq('id', partnerId);
    revalidatePath('/admin/partners/outreach');
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Today&apos;s Outreach List</h1>
        <p className="mt-1 text-slate-400">Top-ranked hot partners for EPR outreach.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Today&apos;s Targets</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{targets.length}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Contacted Today</p>
          <p className="mt-2 text-3xl font-bold text-blue-300">{contactedToday}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Response Rate (7d)</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{responseRate}%</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
          download={`outreach-targets-${isoToday}.csv`}
          className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950"
        >
          Export to CSV
        </a>
      </section>

      <section className="overflow-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">City</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((row, index) => (
              <tr key={row.id} className="border-b border-slate-800/60 align-top">
                <td className="px-3 py-3 font-semibold text-slate-100">{index + 1}</td>
                <td className="px-3 py-3 text-slate-100">{row.company_name}</td>
                <td className="px-3 py-3 text-slate-200">{row.city || '-'}</td>
                <td className="px-3 py-3 text-slate-200">{row.partner_type}</td>
                <td className="px-3 py-3 text-slate-200">{row.contact_person || '-'}</td>
                <td className="px-3 py-3 text-slate-200">{row.email || '-'}</td>
                <td className="px-3 py-3 text-slate-200">{row.phone_primary || '-'}</td>
                <td className="px-3 py-3 font-semibold text-slate-100">{row.outreach_score}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`mailto:${row.email || ''}?subject=${encodeURIComponent(`EPR Compliance Partnership — ${row.company_name}`)}`}
                      className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-950"
                    >
                      Send Email
                    </a>

                    <form action={markOutreach}>
                      <input type="hidden" name="partner_id" value={row.id} />
                      <input type="hidden" name="mode" value="called" />
                      <input type="hidden" name="attempt_count" value={row.outreach_attempt_count || 0} />
                      <button className="rounded-md border border-blue-700/50 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-950/30" type="submit">
                        Mark Called
                      </button>
                    </form>

                    <form action={markOutreach}>
                      <input type="hidden" name="partner_id" value={row.id} />
                      <input type="hidden" name="mode" value="emailed" />
                      <input type="hidden" name="attempt_count" value={row.outreach_attempt_count || 0} />
                      <button className="rounded-md border border-emerald-600/50 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/40" type="submit">
                        Mark Emailed
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
