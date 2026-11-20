'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PARTNER = {
  id: '',
  partnerId: '',
  name: '',
  email: '',
  phone: '',
  city: '',
  linkedin: '',
  type: 'Type B' as const,
  typeDesc: '',
  tier: 'Bronze' as const,
  status: 'Prospect' as const,
  onboarded: '',
  referralSlug: '',
  utmCode: '',
  revenueShareReferral: 0,
  revenueShareDelivery: 0,
  revenueShareCorporate: 0,
  paymentSchedule: '',
  commitmentReferrals: 0,
  commitmentBatches: 0,
  loiSigned: false,
  loiDate: '',
  mouSigned: false,
  mouDue: '',
  t3: {
    status: 'Pending',
    scheduledDate: '',
    trainer: '',
    day1: { attended: false, score: 0, pass: false },
    day2: { attended: false, rubricsScore: 0, score: 0, pass: false },
    day3: { attended: false, finalScore: 0, demoRating: 0, pass: false },
    issuedDate: '',
    expiry: '',
    certId: '',
  },
  programs: [] as string[],
  batches: [] as { name: string; date: string; enrolled: number; target: number; status: string }[],
  earnings: [] as { month: string; enrollments: number; revenue: number; share: number; type: string; status: string }[],
  referrals: [] as { name: string; program: string; date: string; fee: number; share: number }[],
  assets: [] as { name: string; format: string; status: string; customised: boolean }[],
};

const PARTNER_EMPTY = true;

const TABS = ['Overview', 'Onboarding', 'Programs & Batches', 'Earnings', 'Referrals', 'Assets', 'T3 Certification'] as const;
type Tab = typeof TABS[number];

const TIER_META: Record<string, { color: string; bg: string }> = {
  Bronze:   { color: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/30' },
  Silver:   { color: 'text-slate-300',  bg: 'bg-slate-500/10 border-slate-500/30' },
  Gold:     { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  Platinum: { color: 'text-cyan-300',   bg: 'bg-cyan-500/10 border-cyan-500/30' },
};

export default function PartnerProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Overview');
  const tier = TIER_META[PARTNER.tier] ?? TIER_META.Bronze;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-lg font-bold">
            {PARTNER.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-100">{PARTNER.name}</h1>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${tier.bg} ${tier.color}`}>{PARTNER.tier}</span>
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-violet-500/15 text-violet-300">{PARTNER.type}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{PARTNER.partnerId} · {PARTNER.typeDesc} · {PARTNER.city}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/academy/partners')} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Edit Profile</button>
          <button onClick={() => router.push('/academy/communications/broadcast')} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition">Send Message</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800/80 pb-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-2 text-xs font-medium transition border-b-2 -mb-px ${tab === t ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Onboarding' && <OnboardingTab />}
      {tab === 'Programs & Batches' && <ProgramsTab />}
      {tab === 'Earnings' && <EarningsTab />}
      {tab === 'Referrals' && <ReferralsTab />}
      {tab === 'Assets' && <AssetsTab />}
      {tab === 'T3 Certification' && <T3Tab />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-slate-800/50 last:border-0">
      <span className="w-44 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-200">{value}</span>
    </div>
  );
}

function OverviewTab() {
  const [linkCopied, setLinkCopied] = useState(false);
  function copyReferralLink() {
    navigator.clipboard.writeText(`${window.location.origin}/ref/${PARTNER.referralSlug}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Contact & Identity</h3>
        <Row label="Full Name"      value={PARTNER.name} />
        <Row label="Partner ID"     value={<span className="font-mono">{PARTNER.partnerId}</span>} />
        <Row label="Email"          value={PARTNER.email} />
        <Row label="Phone"          value={PARTNER.phone} />
        <Row label="City"           value={PARTNER.city} />
        <Row label="LinkedIn"       value={PARTNER.linkedin ? <a href={PARTNER.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{PARTNER.linkedin}</a> : <span className="text-slate-600">—</span>} />
        <Row label="Partner Type"   value={`${PARTNER.type} — ${PARTNER.typeDesc}`} />
        <Row label="Partner Tier"   value={PARTNER.tier} />
        <Row label="Status"         value={PARTNER.status} />
        <Row label="Onboarded"      value={PARTNER.onboarded} />
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Revenue Share & Tracking</h3>
        <Row label="Referral Share"       value={`${PARTNER.revenueShareReferral}% on referred enrollments`} />
        <Row label="Self-Delivery Share"  value={`${PARTNER.revenueShareDelivery}% on own-batch fees`} />
        <Row label="Corporate Share"      value={`${PARTNER.revenueShareCorporate}% on bulk corporate`} />
        <Row label="Payment Schedule"     value={PARTNER.paymentSchedule} />
        <Row label="Commitment"           value={`${PARTNER.commitmentReferrals} referrals/quarter OR ${PARTNER.commitmentBatches} batches/6 months`} />
        <Row label="Referral Link"        value={
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-300">EPR Compass/ref/{PARTNER.referralSlug}</span>
            <button onClick={copyReferralLink} className="text-[10px] text-slate-500 hover:text-slate-300 transition">{linkCopied ? 'Copied!' : 'Copy'}</button>
          </div>
        } />
        <Row label="UTM Code" value={<span className="font-mono text-xs break-all text-slate-400">{PARTNER.utmCode}</span>} />
      </div>
    </div>
  );
}

function OnboardingTab() {
  const steps = [
    { label: 'Onboarding Kit Sent',        done: true,  date: '14 Mar 2026', owner: 'EPR Compass team' },
    { label: 'LOI Signed',                  done: true,  date: '18 Mar 2026', owner: 'Gautam + EPR Compass team' },
    { label: 'T3 Day 1 Completed',          done: true,  date: '20 Mar 2026', owner: 'Gautam' },
    { label: 'T3 Day 2 Completed',          done: true,  date: '21 Mar 2026', owner: 'Gautam' },
    { label: 'T3 Day 3 + Certified',        done: true,  date: '22 Mar 2026', owner: 'Gautam' },
    { label: 'Marketing Kit Issued',        done: true,  date: '22 Mar 2026', owner: 'EPR Compass team' },
    { label: 'Referral Link Activated',     done: true,  date: '22 Mar 2026', owner: 'EPR Compass team' },
    { label: 'Listed on Website',           done: true,  date: '22 Mar 2026', owner: 'EPR Compass team' },
    { label: 'LMS Login Issued',            done: true,  date: '22 Mar 2026', owner: 'EPR Compass team' },
    { label: 'Full Partner MoU Signed',     done: false, date: 'Due 28 Mar 2026', owner: 'Both' },
    { label: 'First Webinar Batch Open',    done: false, date: 'Due 25 Mar 2026', owner: 'Both' },
    { label: 'First Batch Delivered',       done: false, date: '4–5 Apr 2026', owner: 'Gautam' },
  ];
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Onboarding Progress</h3>
          <span className="text-xs text-slate-400 font-semibold">{done}/{steps.length} — {pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-5">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${s.done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-700 text-slate-600'}`}>
                {s.done ? '✓' : i + 1}
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <span className={`text-xs ${s.done ? 'text-slate-500 line-through' : 'text-slate-200 font-medium'}`}>{s.label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-600">{s.owner}</span>
                  <span className={`text-[10px] ${s.done ? 'text-emerald-600' : 'text-amber-500'}`}>{s.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="LOI Signed" value={PARTNER.loiSigned ? PARTNER.loiDate : 'Pending'} ok={PARTNER.loiSigned} />
        <InfoCard label="MoU Signed" value={PARTNER.mouSigned ? 'Signed' : `Due ${PARTNER.mouDue}`} ok={PARTNER.mouSigned} />
        <InfoCard label="T3 Status" value={PARTNER.t3.status} ok={PARTNER.t3.status === 'Certified'} />
      </div>
    </div>
  );
}

function InfoCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>{value}</p>
    </div>
  );
}

function ProgramsTab() {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Authorised Programs</h3>
        <div className="space-y-2">
          {PARTNER.programs.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
              {p}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-600">Tier 3 (EPR Agency Launch Program) unlocks at Silver tier.</p>
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Batches</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Batch', 'Date', 'Enrolled', 'Target', 'Status'].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTNER.batches.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : PARTNER.batches.map((b, i) => (
              <tr key={i} className="border-b border-slate-800/30">
                <td className="py-2.5 text-slate-200 font-medium">{b.name}</td>
                <td className="py-2.5 text-slate-400">{b.date}</td>
                <td className="py-2.5 text-indigo-300 font-semibold">{b.enrolled}</td>
                <td className="py-2.5 text-slate-500">{b.target}</td>
                <td className="py-2.5">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/15 text-blue-300">{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => router.push('/academy/sessions')} className="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
          + Schedule New Batch
        </button>
      </div>
    </div>
  );
}

function EarningsTab() {
  const [paidSet, setPaidSet] = useState<Set<number>>(new Set());
  const total = PARTNER.earnings.reduce((s, e) => s + e.share, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Earned', value: `₹${PARTNER.earnings.reduce((s, e) => s + e.share, 0).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Pending Payout', value: `₹${PARTNER.earnings.filter(e => e.status === 'Pending').reduce((s, e) => s + e.share, 0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
          { label: 'Revenue Share Rate', value: `${PARTNER.revenueShareDelivery}% / ${PARTNER.revenueShareReferral}%`, color: 'text-indigo-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className={`mt-1 text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Monthly Earnings Breakdown</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Month', 'Enrollments', 'Gross Revenue', 'Share Type', 'Partner Share', 'Status', ''].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTNER.earnings.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : PARTNER.earnings.map((e, i) => (
              <tr key={i} className="border-b border-slate-800/30">
                <td className="py-2.5 text-slate-200 font-medium">{e.month}</td>
                <td className="py-2.5 text-slate-400">{e.enrollments}</td>
                <td className="py-2.5 text-slate-300">₹{e.revenue.toLocaleString('en-IN')}</td>
                <td className="py-2.5 text-slate-500">{e.type}</td>
                <td className="py-2.5 text-emerald-400 font-semibold">₹{e.share.toLocaleString('en-IN')}</td>
                <td className="py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${e.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="py-2.5">
                  {(e.status === 'Pending' && !paidSet.has(i)) && (
                    <button onClick={() => setPaidSet(prev => new Set(prev).add(i))} className="rounded px-2 py-1 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition">
                      Mark Paid
                    </button>
                  )}
                  {paidSet.has(i) && (
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/15 text-emerald-400">Paid</span>
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

function ReferralsTab() {
  const total = PARTNER.referrals.reduce((s, r) => s + r.share, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Total Referrals</p>
          <p className="mt-1 text-2xl font-bold text-violet-400">{PARTNER.referrals.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Referral Earnings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">₹{total.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Referral Link</p>
          <p className="mt-1 text-xs font-mono text-indigo-300 truncate">…/ref/{PARTNER.referralSlug}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Referred Enrollments</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Learner', 'Program', 'Enrolled On', 'Fee', 'Partner Share (20%)'].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTNER.referrals.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : PARTNER.referrals.map((r, i) => (
              <tr key={i} className="border-b border-slate-800/30">
                <td className="py-2.5 text-slate-200 font-medium">{r.name}</td>
                <td className="py-2.5 text-slate-400">{r.program}</td>
                <td className="py-2.5 text-slate-500">{r.date}</td>
                <td className="py-2.5 text-slate-300">₹{r.fee.toLocaleString('en-IN')}</td>
                <td className="py-2.5 text-emerald-400 font-semibold">₹{r.share.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetsTab() {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Marketing Asset Kit</h3>
        <span className="text-xs text-slate-500">
          {PARTNER.assets.filter(a => a.status === 'Ready').length}/{PARTNER.assets.length} ready
        </span>
      </div>
      <div className="space-y-2">
        {PARTNER.assets.map((a, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/30 px-4 py-2.5">
            <div className={`h-2 w-2 rounded-full shrink-0 ${a.status === 'Ready' ? 'bg-emerald-500' : 'bg-amber-500/60'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-200 truncate">{a.name}</p>
              <p className="text-[10px] text-slate-600">{a.format} · {a.customised ? 'Co-branded with partner name' : 'Standard EPR Compass branding'}</p>
            </div>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${a.status === 'Ready' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
              {a.status}
            </span>
            {a.status === 'Ready' && (
              <button onClick={() => window.open(`/academy/partners/assets`, '_blank')} className="shrink-0 rounded px-2 py-1 text-[9px] text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 transition">
                Download
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function T3Tab() {
  const router = useRouter();
  const t3 = PARTNER.t3;
  const days = [
    { day: 'Day 1 — EPR Mastery', date: '20 Mar 2026', attended: t3.day1.attended, score: `${t3.day1.score}/10`, pass: t3.day1.pass, note: 'EPR Rules deep dive, CPCB portal walkthrough, PRO ecosystem' },
    { day: 'Day 2 — Pedagogy & Delivery', date: '21 Mar 2026', attended: t3.day2.attended, score: `${t3.day2.score}/10`, pass: t3.day2.pass, rubric: `${t3.day2.rubricsScore}/5.0`, note: 'Adult learning, CPCB demo teaching, live 30-min microlesson' },
    { day: 'Day 3 — Platform & Assessment', date: '22 Mar 2026', attended: t3.day3.attended, score: `${t3.day3.finalScore}%`, pass: t3.day3.pass, demo: `${t3.day3.demoRating}/5.0`, note: 'LMS orientation, final 20-question test (≥70%), live demo (15 min)' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="T3 Status"    value={t3.status}     ok={t3.status === 'Certified'} />
        <InfoCard label="Issued"       value={t3.issuedDate} ok={true} />
        <InfoCard label="Expiry"       value={t3.expiry}     ok={true} />
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-200">T3 Session Results</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Trainer: {t3.trainer}</span>
            <span>Cert ID: {t3.certId}</span>
          </div>
        </div>
        {days.map((d, i) => (
          <div key={i} className="rounded-lg border border-slate-800/60 bg-slate-900/30 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-slate-200">{d.day}</p>
                <p className="text-[10px] text-slate-500">{d.date} · {d.note}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${d.attended ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {d.attended ? 'Attended' : 'Absent'}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${d.pass ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {d.pass ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div><span className="text-slate-500">Assessment Score: </span><span className="font-semibold text-slate-200">{d.score}</span></div>
              {'rubric' in d && <div><span className="text-slate-500">Delivery Rubric: </span><span className="font-semibold text-slate-200">{d.rubric}</span></div>}
              {'demo' in d && <div><span className="text-slate-500">Live Demo Rating: </span><span className="font-semibold text-slate-200">{d.demo}</span></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => t3.certId ? router.push(`/academy/certificates/verify/${t3.certId}`) : undefined} className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
          Download Certificate PDF
        </button>
        <button onClick={() => router.push('/academy/t3/schedule')} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
          Schedule T3 Renewal
        </button>
      </div>
    </div>
  );
}
