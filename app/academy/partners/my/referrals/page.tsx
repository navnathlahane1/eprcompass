'use client';

import { useState, useEffect } from 'react';

type Referral = { learner: string; program: string; date: string; fee: number; share: number; status: string };

export default function MyReferralsPage() {
  const [referrals, setReferrals]     = useState<Referral[]>([]);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch('/api/academy/partner-dashboard')
      .then(r => r.json())
      .then(d => {
        setReferralLink(d.referralLink ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalShare = referrals.reduce((s, r) => s + r.share, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">My Referrals</h1>
        <p className="mt-0.5 text-sm text-slate-500">Learners who enrolled via your referral link. You earn 20% of their program fee.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Referrals</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">{referrals.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Referral Earnings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">₹{totalShare.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Quarterly Target</p>
          <p className="mt-1 text-2xl font-bold text-slate-400">100</p>
        </div>
      </div>

      {/* Progress to quarterly target */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-200">Q2 2026 Referral Target</h2>
          <span className="text-xs font-semibold text-slate-300">{referrals.length} / 100</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${Math.min(referrals.length, 100)}%` }} />
        </div>
        <p className="mt-2 text-[10px] text-slate-600">You need {Math.max(0, 100 - referrals.length)} more referrals to meet your Q2 commitment.</p>
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Your Referral Link</h2>
        {loading ? (
          <p className="text-xs text-slate-500">Loading referral link…</p>
        ) : referralLink ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 flex items-center gap-3">
            <span className="flex-1 font-mono text-xs text-indigo-300 break-all">{referralLink}</span>
            <button
              onClick={() => navigator.clipboard?.writeText(referralLink).catch(() => {})}
              className="shrink-0 rounded px-2.5 py-1.5 text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition">Copy Link</button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Referral link not assigned yet. Contact your program manager.</p>
        )}
        <p className="text-[10px] text-slate-600">Share this link in your WhatsApp broadcasts, LinkedIn posts, and DMs. Every enrollment tracked automatically.</p>
      </div>

      {/* Referral log */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Referred Enrollments</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Learner', 'Program', 'Enrolled', 'Fee', 'Your Share', 'Status'].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : referrals.map((r, i) => (
              <tr key={i} className="border-b border-slate-800/30 last:border-0">
                <td className="py-2.5 text-slate-200 font-medium">{r.learner}</td>
                <td className="py-2.5 text-slate-400">{r.program}</td>
                <td className="py-2.5 text-slate-500">{r.date}</td>
                <td className="py-2.5 text-slate-300">₹{r.fee.toLocaleString('en-IN')}</td>
                <td className="py-2.5 text-emerald-400 font-semibold">₹{r.share.toLocaleString('en-IN')}</td>
                <td className="py-2.5">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/15 text-emerald-400">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
