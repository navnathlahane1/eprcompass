import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

type ComplianceStats = {
  totalServices: number;
  activeClients: number;
  overdueItems: number;
  filedItems: number;
};

async function loadComplianceStats(): Promise<ComplianceStats> {
  const supabase = await createServerComponentClient();

  try {
    const [{ count: totalServices }, { count: activeClients }, { count: overdueItems }, { count: filedItems }] =
      await Promise.all([
        (supabase as any).from('services').select('id', { count: 'exact', head: true }),
        (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        (supabase as any)
          .from('services')
          .select('id', { count: 'exact', head: true })
          .in('status', ['Overdue', 'Pending', 'In Progress']),
        (supabase as any).from('services').select('id', { count: 'exact', head: true }).eq('status', 'Filed')
      ]);

    return {
      totalServices: Number(totalServices || 0),
      activeClients: Number(activeClients || 0),
      overdueItems: Number(overdueItems || 0),
      filedItems: Number(filedItems || 0)
    };
  } catch {
    return {
      totalServices: 0,
      activeClients: 0,
      overdueItems: 0,
      filedItems: 0
    };
  }
}

export default async function AdminCompliancePage() {
  const stats = await loadComplianceStats();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Compliance Admin</h1>
        <p className="mt-1 text-slate-400">Monitor filing pipeline, review status, and act on overdue compliance items.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Total Services</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{stats.totalServices}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Active Clients</p>
          <p className="mt-2 text-3xl font-bold text-blue-300">{stats.activeClients}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Open / Overdue</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{stats.overdueItems}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Filed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.filedItems}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/crm/clients" className="btn-primary">
            Open Clients
          </Link>
          <Link href="/admin/renewals" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950">
            Open Renewals
          </Link>
          <Link href="/admin/documents" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950">
            Open Documents
          </Link>
        </div>
      </section>
    </div>
  );
}
