import { redirect } from 'next/navigation';
import { createServerComponentClient } from '../../../../lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export default async function WaLeadCapturesPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin' && !isSuperAdmin(user.email)) redirect('/admin/dashboard');

  async function convertToLead(formData: FormData) {
    'use server';
    const supabaseServer = await createServerComponentClient();

    const captureId = String(formData.get('capture_id') || '');
    if (!captureId) return;

    const { data: capture } = await (supabaseServer as any)
      .from('wa_lead_captures')
      .select('id, phone_no, name, company, state, service_interest, converted_lead_id, gstin')
      .eq('id', captureId)
      .maybeSingle();

    if (!capture || capture.converted_lead_id) return;

    const { data: lead } = await (supabaseServer as any)
      .from('leads')
      .insert({
        source: 'WhatsApp',
        service_interest: capture.service_interest || [],
        contact_name: capture.name || null,
        company: capture.company || null,
        phone: capture.phone_no,
        state: capture.state || null,
        stage: 'New'
      })
      .select('id')
      .single();

    if (!lead?.id) return;

    await (supabaseServer as any)
      .from('wa_lead_captures')
      .update({ converted_lead_id: lead.id })
      .eq('id', captureId);
  }

  const { data: captures } = await (supabase as any)
    .from('wa_lead_captures')
    .select('id, phone_no, name, company, gstin, state, source, service_interest, converted_lead_id, captured_at')
    .order('captured_at', { ascending: false });

  const totalCaptured = (captures || []).length;
  const converted = (captures || []).filter((row: any) => Boolean(row.converted_lead_id)).length;
  const rate = totalCaptured ? Number(((converted / totalCaptured) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-4 p-4 text-slate-100 sm:p-6">
      <h1 className="text-xl font-semibold">WhatsApp Lead Captures</h1>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500">Total Captured</p>
          <p className="mt-2 text-2xl font-bold">{totalCaptured.toLocaleString('en-IN')}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500">Converted</p>
          <p className="mt-2 text-2xl font-bold">{converted.toLocaleString('en-IN')}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500">Rate</p>
          <p className="mt-2 text-2xl font-bold">{rate}%</p>
        </article>
      </section>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Conversion</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {(captures || []).map((row: any) => (
              <tr key={row.id} className="border-b border-slate-800/60">
                <td className="px-3 py-2">{row.phone_no}</td>
                <td className="px-3 py-2">{row.name || '-'}</td>
                <td className="px-3 py-2">{row.company || '-'}</td>
                <td className="px-3 py-2">{row.state || '-'}</td>
                <td className="px-3 py-2">{row.source}</td>
                <td className="px-3 py-2">{row.converted_lead_id ? 'Converted' : 'Pending'}</td>
                <td className="px-3 py-2">
                  {row.converted_lead_id ? (
                    <span className="text-xs text-slate-500">Done</span>
                  ) : (
                    <form action={convertToLead}>
                      <input type="hidden" name="capture_id" value={row.id} />
                      <button className="btn-primary">
                        Convert to Lead
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
