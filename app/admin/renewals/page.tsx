import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import RenewalsActions from './RenewalsActions';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export default async function RenewalsPage() {
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

  async function createSequence(formData: FormData) {
    'use server';
    const serviceId = String(formData.get('service_id') || '');
    if (!serviceId) return;

    const supabaseServer = await createServerComponentClient();
    const {
      data: { user: serverUser }
    } = await supabaseServer.auth.getUser();
    if (!serverUser) return;

    const { data: serverProfile } = await (supabaseServer as any)
      .from('profiles')
      .select('role')
      .eq('id', serverUser.id)
      .maybeSingle();

    if (serverProfile?.role !== 'admin' && !isSuperAdmin(serverUser.email)) return;

    const { data: service } = await (supabaseServer as any)
      .from('services')
      .select('id, client_id, due_date')
      .eq('id', serviceId)
      .maybeSingle();

    if (!service?.id || !service?.client_id || !service?.due_date) return;

    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
    await fetch(`${base.replace(/\/$/, '')}/api/admin/renewals/create-sequence`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-secret': process.env.WHATSAPP_INTERNAL_SECRET || ''
      },
      body: JSON.stringify({
        clientId: service.client_id,
        serviceId: service.id
      })
    });

    revalidatePath('/admin/renewals');
  }

  const [{ data: rows }, { data: clients }, { data: services }] = await Promise.all([
    (supabase as any)
      .from('renewal_sequences')
      .select('id, client_id, service_id, renewal_date, sequence_status, current_step, next_trigger_at, created_at')
      .order('next_trigger_at', { ascending: true })
      .limit(200),
    (supabase as any)
      .from('clients')
      .select('id, profile_id')
      .limit(500),
    (supabase as any)
      .from('services')
      .select('id, client_id, service_type, waste_category, due_date, status')
      .gte('due_date', new Date().toISOString().slice(0, 10))
      .order('due_date', { ascending: true })
      .limit(500)
  ]);

  const profileIds = (clients || []).map((c: any) => String(c.profile_id || '')).filter(Boolean) as string[];
  const { data: profiles } = profileIds.length
    ? await (supabase as any)
        .from('profiles')
        .select('id, company_name, full_name')
        .in('id', profileIds)
    : { data: [] };

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const clientOptions = (clients || []).map((c: any) => {
    const p = profileMap.get(c.profile_id);
    return {
      id: c.id,
      label: p?.company_name || p?.full_name || c.id
    };
  });

  const activeServiceIds = new Set(
    (rows || [])
      .filter((row: any) => ['Scheduled', 'Running'].includes(row.sequence_status))
      .map((row: any) => row.service_id)
  );

  const serviceOptions = (services || [])
    .filter((service: any) => service.status !== 'Approved' && !activeServiceIds.has(service.id))
    .map((service: any) => {
      const client = (clients || []).find((c: any) => c.id === service.client_id);
      const profileRow = client ? profileMap.get(client.profile_id) : null;
      const clientName = profileRow?.company_name || profileRow?.full_name || service.client_id;
      return {
        id: service.id,
        label: `${clientName} | ${service.service_type} | ${service.waste_category} | Due ${service.due_date}`
      };
    });

  const total = (rows || []).length;
  const active = (rows || []).filter((r: any) => r.sequence_status === 'Running').length;
  const completed = (rows || []).filter((r: any) => r.sequence_status === 'Completed').length;
  const cancelled = (rows || []).filter((r: any) => ['Cancelled', 'Opted Out'].includes(r.sequence_status)).length;

  return (
    <div className="space-y-4 p-4 text-slate-100 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Renewal Automation</h1>
        <Link href="/admin/whatsapp" className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-950">
          Open WhatsApp Desk
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-bold">{total}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-xl font-bold">{active}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-xl font-bold">{completed}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-500">Cancelled</p>
          <p className="text-xl font-bold">{cancelled}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-3 text-sm font-semibold">Create Sequence</h2>
        <form action={createSequence} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            name="service_id"
            required
            className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Select eligible service</option>
            {serviceOptions.map((option: any) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button className="btn-primary sm:col-span-2">
            Create Renewal Sequence
          </button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Renewal Date</th>
              <th className="px-3 py-2">Current Step</th>
              <th className="px-3 py-2">Next Trigger</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((row: any) => {
              const client = (clients || []).find((c: any) => c.id === row.client_id);
              const profileRow = client ? profileMap.get(client.profile_id) : null;
              const service = (services || []).find((s: any) => s.id === row.service_id);
              const serviceLabel = service
                ? `${service.service_type} | ${service.waste_category}`
                : row.service_id;

              return (
                <tr key={row.id} className="border-b border-slate-800/60">
                  <td className="px-3 py-2">{profileRow?.company_name || profileRow?.full_name || row.client_id}</td>
                  <td className="px-3 py-2">{serviceLabel}</td>
                  <td className="px-3 py-2">{new Date(row.renewal_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-3 py-2">{row.current_step}</td>
                  <td className="px-3 py-2">{row.next_trigger_at ? new Date(row.next_trigger_at).toLocaleString('en-IN') : '-'}</td>
                  <td className="px-3 py-2">{row.sequence_status}</td>
                  <td className="px-3 py-2">
                    <RenewalsActions sequenceId={row.id} status={row.sequence_status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
