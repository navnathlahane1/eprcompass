import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export const metadata = { title: 'Proposal | EPR Compass' };

function fmtMoney(n: number | null) {
  if (!n) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = makeServiceClient();

  const { data: proposal } = await db
    .from('tc_proposals')
    .select('id, title, content_html, amount_inr, valid_until, status')
    .eq('share_token', token)
    .maybeSingle();

  if (!proposal) notFound();

  // Best-effort engagement signal: first open flips sent -> viewed.
  if (proposal.status === 'sent') {
    await db.from('tc_proposals').update({ status: 'viewed', updated_at: new Date().toISOString() }).eq('id', proposal.id);
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {proposal.amount_inr ? <span className="font-semibold text-slate-700">{fmtMoney(proposal.amount_inr)}</span> : null}
          {proposal.valid_until ? <span>Valid until {fmtDate(proposal.valid_until)}</span> : null}
        </div>
        <div
          className="overflow-hidden rounded-2xl bg-white shadow-lg"
          dangerouslySetInnerHTML={{ __html: proposal.content_html || '<p>No content provided.</p>' }}
        />
        <p className="mt-6 text-center text-xs text-slate-400">Sent via EPR Compass</p>
      </div>
    </div>
  );
}

