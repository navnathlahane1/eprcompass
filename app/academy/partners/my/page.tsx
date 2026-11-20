'use client';

import { useEffect, useState } from 'react';

type ProfileData = {
  tier: string | null;
  partnerId: string | null;
  t3Status: string;
  t3Issued: string | null;
  t3Expiry: string | null;
  referralLink: string | null;
  programs: string[];
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-slate-800/50 last:border-0">
      <span className="w-44 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-200">{value || <span className="text-slate-600">—</span>}</span>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  Bronze:   'border-amber-500/30 bg-amber-500/10 text-amber-500',
  Silver:   'border-slate-500/30 bg-slate-500/10 text-slate-300',
  Gold:     'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  Platinum: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
};

export default function MyPartnerProfilePage() {
  const [data, setData]       = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/academy/partner-dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tier = data?.tier ?? null;
  const tierColor = tier ? (TIER_COLORS[tier] ?? TIER_COLORS.Bronze) : 'border-slate-700 bg-slate-800 text-slate-400';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">My Partner Profile</h1>
          <p className="mt-0.5 text-sm text-slate-500">Your EPR Compass partner details and configuration.</p>
        </div>
        {tier && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase ${tierColor}`}>
            {tier} Partner
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading partner profile…</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Identity</h2>
            <Row label="Partner ID"   value={data?.partnerId ? <span className="font-mono">{data.partnerId}</span> : null} />
            <Row label="Partner Tier" value={tier} />
            <Row label="T3 Status"    value={<span className={data?.t3Status === 'Certified' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>{data?.t3Status}</span>} />
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Revenue Share</h2>
            <Row label="Referral Rate"      value="20% on referred enrollments" />
            <Row label="Self-Delivery Rate" value="40% on your own batches" />
            <Row label="Authorised Programs" value={
              (data?.programs ?? []).length > 0 ? (
                <div className="space-y-0.5">
                  {data!.programs.map(p => <div key={p}>{p}</div>)}
                </div>
              ) : null
            } />
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Referral Link</h2>
            <Row label="Your Link" value={
              data?.referralLink ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-300 text-xs break-all">{data.referralLink}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(data.referralLink ?? '').catch(() => {})}
                    className="shrink-0 text-[10px] text-slate-500 hover:text-slate-300 transition px-1.5 py-0.5 border border-slate-700 rounded">Copy</button>
                </div>
              ) : null
            } />
            <p className="mt-2 text-[10px] text-slate-600">20% share on every learner who enrolls via this link.</p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">T3 Certification</h2>
            <Row label="Status"      value={<span className={data?.t3Status === 'Certified' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>{data?.t3Status}</span>} />
            <Row label="Issued"      value={data?.t3Issued} />
            <Row label="Valid Until" value={data?.t3Expiry ? <span className="text-emerald-400">{data.t3Expiry}</span> : null} />
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                Download Certificate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

