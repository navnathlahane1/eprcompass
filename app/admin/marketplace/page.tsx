import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function AdminMarketplacePage() {
  const supabase = await createServerComponentClient();

  const [{ count: listingsCount }, { count: transactionsCount }, { count: requestedCount }, { count: pendingProfilesCount }] = await Promise.all([
    (supabase as any).from('credit_listings').select('id', { count: 'exact', head: true }),
    (supabase as any).from('credit_transactions').select('id', { count: 'exact', head: true }),
    (supabase as any).from('credit_transactions').select('id', { count: 'exact', head: true }).eq('status', 'Requested'),
    (supabase as any).from('marketplace_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'Pending')
  ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Marketplace Admin</h1>
        <p className="mt-1 text-slate-400">Monitor credit listings, approve requests, and review transaction flow.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Active Listings</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(listingsCount || 0)}</p>
          <Link href="/admin/marketplace/listings" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Open Listings
          </Link>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Total Transactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(transactionsCount || 0)}</p>
          <Link href="/admin/marketplace/transactions" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Open Transactions
          </Link>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Pending Requests</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(requestedCount || 0)}</p>
          <Link href="/marketplace" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Open Marketplace
          </Link>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Pending Profile Approvals</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(pendingProfilesCount || 0)}</p>
          <Link href="/admin/marketplace/profiles" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Review Profiles
          </Link>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Anonymous EPR Credit Trading</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">Live Desk</p>
          <Link
            href="/admin/marketplace/epr-credit-trading"
            className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline"
          >
            Open Trading Console
          </Link>
        </article>
      </section>
    </div>
  );
}
