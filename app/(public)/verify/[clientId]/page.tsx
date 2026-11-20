import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ShareActions from './ShareActions';
import { publicStatus } from '@/lib/compliance/publicVerification';

export const revalidate = 3600;

type ServiceRow = {
  waste_category: string;
  status: string;
  due_date: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function maskGstin(gstin: string | null) {
  if (!gstin) return 'Not Available';
  if (gstin.length <= 6) return `${gstin}*****`;
  return `${gstin.slice(0, 6)}*****`;
}

function statusBadgeClass(status: string) {
  if (status === 'Recorded filings') return 'bg-blue-100 text-blue-700';
  if (status === 'Overdue') return 'bg-red-100 text-red-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export default async function VerifyPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="text-2xl font-bold">Verification Temporarily Unavailable</h1>
          <p className="mt-2 text-slate-600">Please try again shortly.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#07875f] px-4 py-2 font-semibold text-white">
            Back to Home
          </Link>
        </section>
      </main>
    );
  }

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('id, profile_id, status, public_verify_id')
    .eq('public_verify_id', clientId)
    .maybeSingle();

  if (!client?.id) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="text-2xl font-bold">Certificate Not Found</h1>
          <p className="mt-2 text-slate-600">No public verification record exists for this ID.</p>
          <Link href="/verify" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#07875f] px-4 py-2 font-semibold text-white">
            Get Your Company Verified →
          </Link>
        </section>
      </main>
    );
  }

  const [{ data: profile, error: profileError }, { data: services, error: servicesError }] = await Promise.all([
    (supabase as any).from('profiles').select('company_name, gstin').eq('id', client.profile_id).maybeSingle(),
    (supabase as any)
      .from('services')
      .select('waste_category, status, due_date')
      .eq('client_id', client.id)
      .order('due_date', { ascending: false })
  ]);
  if (profileError || servicesError) throw new Error('Verification data temporarily unavailable');

  const safeCompany = profile?.company_name || 'Verified Company';
  const safeGstin = maskGstin(profile?.gstin || null);
  const serviceRows = (services || []) as ServiceRow[];
  const categories = Array.from(new Set(serviceRows.map((s) => s.waste_category)));
  const certificateValidUntil = 'Not verified';
  const lastComplianceDate = 'Not verified';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const verifyUrl = `${siteUrl.replace(/\/$/, '')}/verify/${clientId}`;

  return (
    <main className="epr-public min-h-screen bg-[#fbfdfc] px-4 py-6 sm:px-6">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-[var(--epr-border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="epr-eyebrow">Certificate verify</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--epr-ink)]">Public Compliance Verification</h1>
        <p className="mt-1 text-sm text-[var(--epr-muted)]">ID {clientId} · Verified by EPR Compass · {new Date().toLocaleString('en-IN')}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p className="rounded-lg bg-slate-50 p-3 text-sm">Company name: <strong>{safeCompany}</strong></p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm">GSTIN: <strong>{safeGstin}</strong></p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm">EPR categories registered: <strong>{categories.join(', ') || 'Not Available'}</strong></p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm">Registration status: <strong>{client.status}</strong></p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm">Certificate valid until: <strong>{certificateValidUntil}</strong></p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm">Last compliance date: <strong>{lastComplianceDate}</strong></p>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">✓</span>
            <div>
              <p className="text-lg font-bold text-emerald-800">EPR Service Record</p>
              <p className="text-sm text-emerald-700">Powered by EPR Compass</p>
              <p className="text-xs text-emerald-700">Verification timestamp: {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 p-4">
          <h2 className="text-base font-semibold">Category-wise Status</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.length ? (
              categories.map((category) => {
                const status = publicStatus(serviceRows.filter(s => s.waste_category === category));
                return (
                  <article key={category} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold">{category}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
                      {status}
                    </span>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No category records available.</p>
            )}
          </div>
        </section>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">Share</p>
          <ShareActions company={safeCompany} verifyUrl={verifyUrl} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/verify" className="epr-button epr-button-secondary">
            Check another ID
          </Link>
          <Link href="/trust" className="epr-button epr-button-secondary">
            Trust &amp; access
          </Link>
          <Link href="/contact" className="epr-button epr-button-primary">
            Get your company verified
          </Link>
        </div>
      </section>
    </main>
  );
}

