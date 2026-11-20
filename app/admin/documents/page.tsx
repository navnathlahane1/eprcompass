import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

type Counts = {
  total: number;
  pending: number;
  verified: number;
  expired: number;
};

async function loadDocumentCounts(): Promise<Counts> {
  const supabase = createServiceClient();

  try {
    const [{ count: total }, { count: pending }, { count: verified }, { count: expired }] = await Promise.all([
      (supabase as any).from('documents').select('id', { count: 'exact', head: true }),
      (supabase as any).from('documents').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
      (supabase as any).from('documents').select('id', { count: 'exact', head: true }).eq('status', 'Verified'),
      (supabase as any).from('documents').select('id', { count: 'exact', head: true }).eq('status', 'Expired')
    ]);

    return {
      total: Number(total || 0),
      pending: Number(pending || 0),
      verified: Number(verified || 0),
      expired: Number(expired || 0)
    };
  } catch {
    return { total: 0, pending: 0, verified: 0, expired: 0 };
  }
}

export default async function AdminDocumentsPage() {
  const counts = await loadDocumentCounts();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Documents Admin</h1>
        <p className="mt-1 text-slate-400">
          Track upload status, review pending files, and navigate to client document workflows.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Total Documents</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{counts.total}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Pending Review</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{counts.pending}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Verified</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{counts.verified}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Expired</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">{counts.expired}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/crm/clients" className="btn-primary">
            Open Client List
          </Link>
          <Link href="/portal/documents" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950">
            Open Portal Documents
          </Link>
        </div>
      </section>
    </div>
  );
}
