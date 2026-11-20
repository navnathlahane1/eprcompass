'use client';

import { useEffect, useState } from 'react';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildAcademyPartnerTrainerSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

interface Props { userName?: string }

interface DashData {
  tier: string | null;
  partnerId: string | null;
  t3Status: string;
  t3Issued: string | null;
  t3Expiry: string | null;
  referralLink: string | null;
  referralCount: number;
  activeBatch: { name: string; date: string; enrolled: number; target: number } | null;
  earningsThisMonth: number;
  earningsTotal: number;
  pendingPayout: number;
  programs: string[];
  onboardingSteps: { label: string; done: boolean }[];
}

const TIER_META: Record<string, { label: string; color: string; bg: string }> = {
  Bronze:   { label: 'Bronze',   color: 'text-amber-600',  bg: 'bg-amber-500/10 border-amber-500/30' },
  Silver:   { label: 'Silver',   color: 'text-slate-300',  bg: 'bg-slate-500/10 border-slate-500/30' },
  Gold:     { label: 'Gold',     color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  Platinum: { label: 'Platinum', color: 'text-cyan-300',   bg: 'bg-cyan-500/10 border-cyan-500/30' },
};

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

function Kpi({ label, value, sub, color = 'text-indigo-400' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-600">{sub}</p>}
    </div>
  );
}

export default function PartnerTrainerDashboard({ userName }: Props) {
  const [data, setData]       = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/academy/partner-dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Shimmer className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Shimmer className="lg:col-span-2 h-48 rounded-xl" />
          <Shimmer className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const tier        = data?.tier ?? null;
  const tierMeta    = tier ? (TIER_META[tier] ?? TIER_META.Bronze) : null;
  const activeBatch = data?.activeBatch ?? null;
  const prog        = activeBatch && activeBatch.target > 0
    ? Math.round((activeBatch.enrolled / activeBatch.target) * 100) : 0;

  const partnerTrainerSetupSteps = buildAcademyPartnerTrainerSetupSteps({
    hasProfile: !!userName,
    hasOrg: !!data?.partnerId,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={partnerTrainerSetupSteps}
          portalKey={`academy-partner-trainer-${userName ?? 'unknown'}`}
          accentColor="blue"
          dark={true}
        />
      </TourTarget>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            Welcome back, {userName?.split(' ')[0] ?? 'Partner'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {data?.partnerId ? `Partner ID: ${data.partnerId} · ` : ''}EPR Compass Partner Trainer
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {tierMeta && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${tierMeta.bg} ${tierMeta.color}`}>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {tierMeta.label} Partner
            </span>
          )}
          {data?.t3Status && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${data.t3Status === 'Certified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              T3 {data.t3Status}
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Learners Enrolled"    value={String(activeBatch?.enrolled ?? 0)} sub="Active batch"      color="text-indigo-400" />
        <Kpi label="Referrals Generated"  value={String(data?.referralCount ?? 0)}   sub="This quarter"     color="text-violet-400" />
        <Kpi label="Earnings This Month"  value={`₹${(data?.earningsThisMonth ?? 0).toLocaleString('en-IN')}`} sub="40% delivery share" color="text-emerald-400" />
        <Kpi label="Pending Payout"       value={`₹${(data?.pendingPayout ?? 0).toLocaleString('en-IN')}`}      sub="Next cycle"        color="text-amber-400" />
      </TourTarget>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Batch */}
        <TourTarget id="dash-primary-list" className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Active Batch</h2>
            {activeBatch && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase">Live</span>}
          </div>
          {activeBatch ? (
            <>
              <div>
                <p className="font-semibold text-slate-100">{activeBatch.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeBatch.date ? new Date(activeBatch.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Registrations</span>
                  <span className="text-xs font-semibold text-slate-200">{activeBatch.enrolled} / {activeBatch.target}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${prog}%` }} />
                </div>
                {activeBatch.target > activeBatch.enrolled && (
                  <p className="mt-1 text-[10px] text-slate-600">{activeBatch.target - activeBatch.enrolled} more registrations to target</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                  View Batch Details
                </button>
                <button className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
                  Send Registration Push
                </button>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-slate-600">No active batch scheduled yet.</p>
          )}
        </TourTarget>

        {/* T3 Cert Card */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">T3 Certification</h2>
          <div className="flex items-center justify-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${data?.t3Status === 'Certified' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <svg viewBox="0 0 24 24" className={`h-8 w-8 ${data?.t3Status === 'Certified' ? 'text-emerald-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold uppercase ${data?.t3Status === 'Certified' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data?.t3Status === 'Certified' ? 'EPR Certified Trainer' : 'Certification In Progress'}
            </p>
            {data?.t3Issued && <p className="mt-0.5 text-[10px] text-slate-500">Issued {data.t3Issued}</p>}
            {data?.t3Expiry && <p className="text-[10px] text-slate-600">Valid until {data.t3Expiry}</p>}
          </div>
          {(data?.programs ?? []).length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Authorised Programs</p>
              {data!.programs.map(p => (
                <div key={p} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Onboarding Checklist */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Onboarding Progress</h2>
            <span className="text-xs text-slate-500">
              {(data?.onboardingSteps ?? []).filter(s => s.done).length}/{(data?.onboardingSteps ?? []).length} complete
            </span>
          </div>
          <div className="space-y-2">
            {(data?.onboardingSteps ?? []).map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${step.done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-700 text-slate-600'}`}>
                  {step.done
                    ? <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>
                  }
                </div>
                <span className={`text-xs ${step.done ? 'text-slate-400 line-through' : 'text-slate-300 font-medium'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referral & Assets */}
        <div className="space-y-4">
          {/* Referral Link */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">My Referral Link</h2>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2">
              <span className="flex-1 truncate text-xs text-slate-400 font-mono">
                {data?.referralLink?.replace(/^https?:\/\/[^/]+/, "EPR Compass") ?? 'EPR Compass/ref/—'}
              </span>
              <button className="shrink-0 rounded px-2 py-1 text-[10px] font-medium text-indigo-400 hover:bg-indigo-500/10 transition">Copy</button>
            </div>
            <p className="text-[10px] text-slate-600">20% revenue share on all learners who enroll via this link</p>
          </div>

          {/* Quick Actions */}
          <TourTarget id="dash-quick-actions" className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'My Earnings',      href: '/academy/partners/my/earnings',  color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
                { label: 'My Referrals',     href: '/academy/partners/my/referrals', color: 'text-violet-300 border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20' },
                { label: 'Marketing Assets', href: '/academy/partners/my/assets',    color: 'text-amber-300 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' },
                { label: 'Partner Profile',  href: '/academy/partners/my',           color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20' },
              ].map(a => (
                <a key={a.href} href={a.href}
                  className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${a.color}`}>
                  {a.label}
                </a>
              ))}
            </div>
          </TourTarget>
        </div>
      </div>
    </div>
  );
}

